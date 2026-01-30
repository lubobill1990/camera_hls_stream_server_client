/**
 * Stream Manager - Orchestrates stream lifecycle
 */

import type { Stream, StreamOptions } from '../types/index.js';
import { getCameraById, reserveCamera, releaseCamera, isCameraAvailable } from '../camera/cameraManager.js';
import { createStream, getStream, markStreamRunning, markStreamStopped, markStreamError, deleteStream } from './streamRegistry.js';
import { createWorker, stopWorker, getWorker } from '../ffmpeg/ffmpegWorker.js';
import { ensureStreamDir, deleteStreamFiles, getHlsUrl, playlistExists, getHlsBaseDir } from '../hls/hlsManager.js';
import { sleep, checkDiskSpace, formatBytes } from '../utils/index.js';

/** Maximum time to wait for first segment (ms) */
const STREAM_START_TIMEOUT = 15000;

/** Poll interval for checking playlist existence (ms) */
const PLAYLIST_CHECK_INTERVAL = 500;

/** Custom error for insufficient disk space */
export class InsufficientStorageError extends Error {
  public available: number;
  public required: number;
  
  constructor(available: number, requiredMB: number) {
    super(`Insufficient disk space: ${formatBytes(available)} available, ${requiredMB} MB required`);
    this.name = 'InsufficientStorageError';
    this.available = available;
    this.required = requiredMB * 1024 * 1024;
  }
}

/**
 * Start a new stream from a camera
 */
export async function startStream(cameraId: string, options?: StreamOptions): Promise<Stream> {
  // Check disk space before starting
  const hlsDir = getHlsBaseDir();
  const diskInfo = await checkDiskSpace(hlsDir);
  
  if (!diskInfo.sufficient) {
    throw new InsufficientStorageError(diskInfo.available, diskInfo.requiredMB);
  }
  
  // Validate camera exists and is available
  const camera = getCameraById(cameraId);
  if (!camera) {
    throw new Error(`Camera not found: ${cameraId}`);
  }
  
  if (!isCameraAvailable(cameraId)) {
    throw new Error(`Camera is not available: ${cameraId} (status: ${camera.status})`);
  }
  
  // Create stream entry
  const stream = createStream(cameraId, options);
  
  try {
    // Reserve the camera
    const reserved = reserveCamera(cameraId, stream.id);
    if (!reserved) {
      deleteStream(stream.id);
      throw new Error(`Failed to reserve camera: ${cameraId}`);
    }
    
    // Create HLS output directory
    const outputDir = await ensureStreamDir(stream.id);
    
    // Start FFmpeg worker
    await createWorker(stream.id, {
      cameraId,
      outputDir,
      resolution: stream.resolution,
      framerate: stream.framerate,
      videoBitrate: stream.videoBitrate,
      includeAudio: true,
    });
    
    // Wait for first segment to appear
    const playlistReady = await waitForPlaylist(stream.id, STREAM_START_TIMEOUT);
    
    if (!playlistReady) {
      // Clean up on timeout
      await stopWorker(stream.id);
      releaseCamera(cameraId, stream.id);
      markStreamError(stream.id, 'Timeout waiting for stream to start');
      throw new Error('Stream failed to start: timeout waiting for first segment');
    }
    
    // Mark stream as running
    const hlsUrl = getHlsUrl(stream.id);
    const updatedStream = markStreamRunning(stream.id, hlsUrl);
    
    if (!updatedStream) {
      throw new Error('Failed to update stream status');
    }
    
    // Set up error handling on the worker
    const worker = getWorker(stream.id);
    if (worker) {
      worker.on('error', (error) => {
        console.error(`Stream ${stream.id} error:`, error.message);
        markStreamError(stream.id, error.message);
        releaseCamera(cameraId, stream.id);
      });
      
      worker.on('stopped', () => {
        const currentStream = getStream(stream.id);
        if (currentStream && currentStream.status === 'running') {
          markStreamStopped(stream.id);
          releaseCamera(cameraId, stream.id);
        }
      });
    }
    
    return updatedStream;
    
  } catch (error) {
    // Clean up on failure
    await stopWorker(stream.id).catch(() => {});
    releaseCamera(cameraId, stream.id);
    deleteStream(stream.id);
    throw error;
  }
}

/**
 * Stop an active stream
 */
export async function stopStream(streamId: string): Promise<void> {
  const stream = getStream(streamId);
  if (!stream) {
    throw new Error(`Stream not found: ${streamId}`);
  }
  
  if (stream.status === 'stopped') {
    return;
  }
  
  // Stop FFmpeg worker
  await stopWorker(streamId);
  
  // Release camera
  releaseCamera(stream.cameraId, streamId);
  
  // Update stream status
  markStreamStopped(streamId);
  
  // Clean up HLS files after a delay (allow player to catch up)
  setTimeout(() => {
    deleteStreamFiles(streamId).catch((err) => {
      console.error(`Failed to clean up stream files for ${streamId}:`, err);
    });
  }, 30000); // 30 second delay
}

/**
 * Get stream info
 */
export function getStreamInfo(streamId: string): Stream | undefined {
  return getStream(streamId);
}

/**
 * Wait for HLS playlist to be created
 */
async function waitForPlaylist(streamId: string, timeout: number): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await playlistExists(streamId)) {
      return true;
    }
    await sleep(PLAYLIST_CHECK_INTERVAL);
  }
  
  return false;
}
