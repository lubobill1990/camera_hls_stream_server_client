/**
 * HLS Routes - Serve HLS manifest and segments
 */

import { Hono } from 'hono';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getStreamDir, getPlaylistPath } from '../lib/hls/hlsManager.js';
import { getStream } from '../lib/stream/streamRegistry.js';

const hls = new Hono();

/**
 * GET /hls/:streamId/stream.m3u8
 * Serve HLS manifest with proper headers
 */
hls.get('/:streamId/stream.m3u8', async (c) => {
  const streamId = c.req.param('streamId');
  
  // Check if stream exists
  const stream = getStream(streamId);
  if (!stream) {
    return c.json({ error: 'Stream not found' }, 404);
  }
  
  try {
    const playlistPath = getPlaylistPath(streamId);
    const content = await fs.readFile(playlistPath, 'utf-8');
    
    return c.body(content, 200, {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
  } catch (error) {
    console.error(`Failed to read playlist for stream ${streamId}:`, error);
    return c.json({ error: 'Playlist not available' }, 404);
  }
});

/**
 * GET /hls/:streamId/:segment
 * Serve HLS segment files with proper headers
 */
hls.get('/:streamId/:segment', async (c) => {
  const streamId = c.req.param('streamId');
  const segment = c.req.param('segment');
  
  // Validate segment filename
  if (!segment.endsWith('.ts')) {
    return c.json({ error: 'Invalid segment file' }, 400);
  }
  
  try {
    const segmentPath = path.join(getStreamDir(streamId), segment);
    const stat = await fs.stat(segmentPath);
    const content = await fs.readFile(segmentPath);
    
    // Handle Range requests for seeking
    const range = c.req.header('Range');
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      
      const chunk = content.slice(start, end + 1);
      
      return c.body(chunk, 206, {
        'Content-Type': 'video/mp2t',
        'Content-Length': chunkSize.toString(),
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      });
    }
    
    return c.body(content, 200, {
      'Content-Type': 'video/mp2t',
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
    });
  } catch (error) {
    console.error(`Failed to read segment ${segment} for stream ${streamId}:`, error);
    return c.json({ error: 'Segment not found' }, 404);
  }
});

export default hls;
