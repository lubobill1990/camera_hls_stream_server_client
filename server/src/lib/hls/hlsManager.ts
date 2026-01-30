/**
 * HLS Manager - Manages HLS segment storage and cleanup
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { HLSSegment, StreamManifest } from '../types/index.js';
import { HLS_PLAYLIST_NAME, HLS_LIST_SIZE } from '../ffmpeg/transcodeConfig.js';

/** Base directory for HLS output */
let hlsBaseDir = './public/hls';

/**
 * Set HLS base directory
 */
export function setHlsBaseDir(dir: string): void {
  hlsBaseDir = dir;
}

/**
 * Get HLS base directory
 */
export function getHlsBaseDir(): string {
  return hlsBaseDir;
}

/**
 * Get the directory path for a stream's HLS files
 */
export function getStreamDir(streamId: string): string {
  return path.join(hlsBaseDir, streamId);
}

/**
 * Get the playlist file path for a stream
 */
export function getPlaylistPath(streamId: string): string {
  return path.join(getStreamDir(streamId), HLS_PLAYLIST_NAME);
}

/**
 * Get the HLS URL for a stream (relative to server)
 */
export function getHlsUrl(streamId: string): string {
  return `/hls/${streamId}/${HLS_PLAYLIST_NAME}`;
}

/**
 * Ensure stream directory exists
 */
export async function ensureStreamDir(streamId: string): Promise<string> {
  const dir = getStreamDir(streamId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Check if playlist file exists
 */
export async function playlistExists(streamId: string): Promise<boolean> {
  try {
    await fs.access(getPlaylistPath(streamId));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse HLS playlist
 */
export async function readPlaylist(streamId: string): Promise<StreamManifest | null> {
  try {
    const playlistPath = getPlaylistPath(streamId);
    const content = await fs.readFile(playlistPath, 'utf-8');
    return parsePlaylist(streamId, content);
  } catch {
    return null;
  }
}

/**
 * Parse M3U8 playlist content
 */
function parsePlaylist(streamId: string, content: string): StreamManifest {
  const lines = content.split('\n').filter((line) => line.trim());
  const segments: HLSSegment[] = [];
  
  let version = 3;
  let targetDuration = 4;
  let mediaSequence = 0;
  let currentDuration = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('#EXT-X-VERSION:')) {
      version = parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      mediaSequence = parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('#EXTINF:')) {
      // Duration line
      const durationStr = line.split(':')[1].replace(',', '');
      currentDuration = parseFloat(durationStr);
    } else if (!line.startsWith('#') && line.endsWith('.ts')) {
      // Segment file
      const filename = line;
      const sequence = mediaSequence + segments.length;
      
      segments.push({
        sequence,
        filename,
        duration: currentDuration,
        url: `/hls/${streamId}/${filename}`,
      });
    }
  }
  
  return {
    streamId,
    version,
    targetDuration,
    mediaSequence,
    segments,
    playlistUrl: getHlsUrl(streamId),
  };
}

/**
 * Get list of segment files for a stream
 */
export async function getSegmentFiles(streamId: string): Promise<string[]> {
  try {
    const dir = getStreamDir(streamId);
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith('.ts')).sort();
  } catch {
    return [];
  }
}

/**
 * Get segment count for a stream
 */
export async function getSegmentCount(streamId: string): Promise<number> {
  const files = await getSegmentFiles(streamId);
  return files.length;
}

/**
 * Delete stream HLS files
 */
export async function deleteStreamFiles(streamId: string): Promise<boolean> {
  try {
    const dir = getStreamDir(streamId);
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up old segment files (beyond HLS_LIST_SIZE)
 * This is normally handled by FFmpeg's delete_segments flag
 */
export async function cleanupOldSegments(streamId: string): Promise<number> {
  const files = await getSegmentFiles(streamId);
  const dir = getStreamDir(streamId);
  
  // Keep only the most recent segments
  const toDelete = files.slice(0, Math.max(0, files.length - HLS_LIST_SIZE - 2));
  
  for (const file of toDelete) {
    try {
      await fs.unlink(path.join(dir, file));
    } catch {
      // Ignore errors
    }
  }
  
  return toDelete.length;
}

/**
 * Get total size of HLS files for a stream
 */
export async function getStreamSize(streamId: string): Promise<number> {
  try {
    const dir = getStreamDir(streamId);
    const files = await fs.readdir(dir);
    
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(path.join(dir, file));
      totalSize += stats.size;
    }
    
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Get disk usage summary
 */
export async function getDiskUsage(): Promise<{
  totalStreams: number;
  totalSize: number;
  streams: Array<{ streamId: string; size: number }>;
}> {
  try {
    const dirs = await fs.readdir(hlsBaseDir);
    const streams: Array<{ streamId: string; size: number }> = [];
    let totalSize = 0;
    
    for (const streamId of dirs) {
      const size = await getStreamSize(streamId);
      if (size > 0) {
        streams.push({ streamId, size });
        totalSize += size;
      }
    }
    
    return {
      totalStreams: streams.length,
      totalSize,
      streams,
    };
  } catch {
    return {
      totalStreams: 0,
      totalSize: 0,
      streams: [],
    };
  }
}

/**
 * Clean up all HLS files for stopped streams
 */
export async function cleanupAllStopped(activeStreamIds: string[]): Promise<number> {
  try {
    const dirs = await fs.readdir(hlsBaseDir);
    const activeSet = new Set(activeStreamIds);
    let cleaned = 0;
    
    for (const streamId of dirs) {
      if (!activeSet.has(streamId)) {
        const deleted = await deleteStreamFiles(streamId);
        if (deleted) cleaned++;
      }
    }
    
    return cleaned;
  } catch {
    return 0;
  }
}
