/**
 * Stream Routes - /api/streams
 */

import { Hono } from 'hono';
import type { 
  StartStreamRequest, 
  StartStreamResponse, 
  GetStreamsResponse, 
  GetStreamResponse,
  StopStreamResponse 
} from '../lib/types/index.js';
import { startStream, stopStream, getStreamInfo, InsufficientStorageError } from '../lib/stream/streamManager.js';
import { getAllStreams, getActiveStreams } from '../lib/stream/streamRegistry.js';

const streams = new Hono();

/**
 * POST /api/streams
 * Start a new stream from a camera
 */
streams.post('/', async (c) => {
  try {
    const body = await c.req.json() as StartStreamRequest;
    
    // Validate request
    if (!body.cameraId) {
      return c.json({ error: 'Missing required field: cameraId' }, 400);
    }
    
    // Validate optional parameters
    if (body.bitrate !== undefined && (body.bitrate < 500 || body.bitrate > 8000)) {
      return c.json({ error: 'Bitrate must be between 500 and 8000 kbps' }, 400);
    }
    
    if (body.frameRate !== undefined && (body.frameRate < 1 || body.frameRate > 60)) {
      return c.json({ error: 'Frame rate must be between 1 and 60 fps' }, 400);
    }
    
    if (body.resolution !== undefined) {
      const resMatch = body.resolution.match(/^(\d+)x(\d+)$/);
      if (!resMatch) {
        return c.json({ error: 'Resolution must be in format WIDTHxHEIGHT (e.g., 1280x720)' }, 400);
      }
    }
    
    // Start the stream
    const stream = await startStream(body.cameraId, {
      videoBitrate: body.bitrate ? `${body.bitrate}k` : undefined,
      resolution: body.resolution,
      framerate: body.frameRate,
    });
    
    const response: StartStreamResponse = { stream };
    return c.json(response, 201);
    
  } catch (error) {
    console.error('Failed to start stream:', error);
    
    // Check for insufficient storage
    if (error instanceof InsufficientStorageError) {
      return c.json({ 
        error: 'Insufficient storage', 
        message: error.message,
        available: error.available,
        required: error.required,
      }, 507);
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
    if (message.includes('not found')) {
      return c.json({ error: 'Camera not found', message }, 404);
    }
    
    if (message.includes('not available') || message.includes('in-use')) {
      return c.json({ error: 'Camera not available', message }, 409);
    }
    
    return c.json({ error: 'Failed to start stream', message }, 500);
  }
});

/**
 * GET /api/streams
 * List all streams (optionally filter by status)
 */
streams.get('/', (c) => {
  const status = c.req.query('status');
  
  let streamList;
  if (status === 'active') {
    streamList = getActiveStreams();
  } else {
    streamList = getAllStreams();
  }
  
  const response: GetStreamsResponse = { streams: streamList };
  return c.json(response);
});

/**
 * GET /api/streams/:id
 * Get a specific stream by ID
 */
streams.get('/:id', (c) => {
  const id = c.req.param('id');
  const stream = getStreamInfo(id);
  
  if (!stream) {
    return c.json({ error: 'Stream not found' }, 404);
  }
  
  const response: GetStreamResponse = { stream };
  return c.json(response);
});

/**
 * DELETE /api/streams/:id
 * Stop a stream
 */
streams.delete('/:id', async (c) => {
  const id = c.req.param('id');
  
  try {
    const stream = getStreamInfo(id);
    
    if (!stream) {
      return c.json({ error: 'Stream not found' }, 404);
    }
    
    await stopStream(id);
    
    const response: StopStreamResponse = {
      success: true,
      message: 'Stream stopped successfully',
    };
    return c.json(response);
    
  } catch (error) {
    console.error('Failed to stop stream:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: 'Failed to stop stream', message }, 500);
  }
});

export default streams;
