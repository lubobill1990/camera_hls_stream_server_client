/**
 * Camera Routes - GET /api/cameras
 */

import { Hono } from 'hono';
import type { GetCamerasResponse } from '../lib/types/index.js';
import { getCameras, discoverCameras } from '../lib/camera/cameraManager.js';

const cameras = new Hono();

/**
 * GET /api/cameras
 * Returns list of all available cameras
 */
cameras.get('/', async (c) => {
  try {
    // Discover cameras (refresh list)
    await discoverCameras();
    
    // Get camera list
    const cameraList = getCameras();
    
    const response: GetCamerasResponse = {
      cameras: cameraList,
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Failed to get cameras:', error);
    return c.json(
      { 
        error: 'Failed to enumerate cameras',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/cameras/:id
 * Returns a specific camera by ID
 */
cameras.get('/:id', async (c) => {
  const id = c.req.param('id');
  
  try {
    const cameraList = getCameras();
    const camera = cameraList.find((cam) => cam.id === id);
    
    if (!camera) {
      return c.json({ error: 'Camera not found' }, 404);
    }
    
    return c.json({ camera });
  } catch (error) {
    console.error('Failed to get camera:', error);
    return c.json(
      { 
        error: 'Failed to get camera',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default cameras;
