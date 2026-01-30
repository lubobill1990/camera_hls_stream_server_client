/**
 * Stream Registry - Manages active stream state
 */

import { v4 as uuidv4 } from 'uuid';
import type { Stream, StreamOptions, StreamStatus } from '../types/index.js';

/** Stream with internal metadata */
interface StreamEntry {
  stream: Stream;
  createdAt: Date;
  updatedAt: Date;
}

/** Stream registry state */
const streams = new Map<string, StreamEntry>();

/**
 * Create a new stream entry
 */
export function createStream(cameraId: string, options?: StreamOptions): Stream {
  const id = uuidv4();
  
  const stream: Stream = {
    id,
    cameraId,
    status: 'starting',
    hlsUrl: null,
    resolution: options?.resolution ?? '1280x720',
    framerate: options?.framerate ?? 30,
    videoBitrate: options?.videoBitrate,
    audioBitrate: options?.audioBitrate,
    startedAt: null,
    error: null,
  };
  
  streams.set(id, {
    stream,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return stream;
}

/**
 * Get a stream by ID
 */
export function getStream(id: string): Stream | undefined {
  const entry = streams.get(id);
  return entry?.stream;
}

/**
 * Get all streams
 */
export function getAllStreams(): Stream[] {
  return Array.from(streams.values()).map((entry) => entry.stream);
}

/**
 * Get streams by camera ID
 */
export function getStreamsByCamera(cameraId: string): Stream[] {
  return Array.from(streams.values())
    .filter((entry) => entry.stream.cameraId === cameraId)
    .map((entry) => entry.stream);
}

/**
 * Get active streams (running or starting)
 */
export function getActiveStreams(): Stream[] {
  return Array.from(streams.values())
    .filter((entry) => 
      entry.stream.status === 'running' || 
      entry.stream.status === 'starting'
    )
    .map((entry) => entry.stream);
}

/**
 * Update stream status
 */
export function updateStreamStatus(
  id: string, 
  status: StreamStatus, 
  hlsUrl?: string,
  error?: string
): Stream | undefined {
  const entry = streams.get(id);
  if (!entry) {
    return undefined;
  }
  
  const updatedStream: Stream = {
    ...entry.stream,
    status,
    hlsUrl: hlsUrl ?? entry.stream.hlsUrl,
    startedAt: status === 'running' && !entry.stream.startedAt 
      ? new Date().toISOString() 
      : entry.stream.startedAt,
    error: error ?? null,
  };
  
  streams.set(id, {
    ...entry,
    stream: updatedStream,
    updatedAt: new Date(),
  });
  
  return updatedStream;
}

/**
 * Mark stream as running with HLS URL
 */
export function markStreamRunning(id: string, hlsUrl: string): Stream | undefined {
  return updateStreamStatus(id, 'running', hlsUrl);
}

/**
 * Mark stream as stopped
 */
export function markStreamStopped(id: string): Stream | undefined {
  return updateStreamStatus(id, 'stopped');
}

/**
 * Mark stream as errored
 */
export function markStreamError(id: string, error: string): Stream | undefined {
  return updateStreamStatus(id, 'error', undefined, error);
}

/**
 * Delete a stream
 */
export function deleteStream(id: string): boolean {
  return streams.delete(id);
}

/**
 * Check if a stream exists
 */
export function hasStream(id: string): boolean {
  return streams.has(id);
}

/**
 * Get stream count
 */
export function getStreamCount(): number {
  return streams.size;
}

/**
 * Get active stream count
 */
export function getActiveStreamCount(): number {
  return getActiveStreams().length;
}

/**
 * Clear all streams (for testing)
 */
export function clearStreams(): void {
  streams.clear();
}

/**
 * Clean up old stopped/error streams
 * Returns number of streams cleaned up
 */
export function cleanupOldStreams(maxAgeMs: number = 3600000): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [id, entry] of streams.entries()) {
    const age = now - entry.updatedAt.getTime();
    const isInactive = 
      entry.stream.status === 'stopped' || 
      entry.stream.status === 'error';
    
    if (isInactive && age > maxAgeMs) {
      streams.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}
