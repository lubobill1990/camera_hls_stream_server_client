/**
 * Camera Manager - Handles camera enumeration and reservation
 */

import type { CameraDevice } from '../types/index.js';
import {
  getPlatform,
  getListDevicesArgs,
  parseDeviceList,
  runFFmpegCommand,
} from './platformHelpers.js';

/** Camera state for reservation tracking */
interface CameraState {
  device: CameraDevice;
  reservedBy: string | null;
  lastSeen: Date;
}

/** Camera manager state */
const cameraStore = new Map<string, CameraState>();

/** FFmpeg executable path */
let ffmpegPath = 'ffmpeg';

/**
 * Set custom FFmpeg path
 */
export function setFFmpegPath(path: string): void {
  ffmpegPath = path;
}

/**
 * Get FFmpeg path
 */
export function getFFmpegPath(): string {
  return ffmpegPath;
}

/**
 * Discover cameras on the system using FFmpeg
 * Updates internal camera store with discovered devices
 */
export async function discoverCameras(): Promise<CameraDevice[]> {
  const platform = getPlatform();
  const args = getListDevicesArgs(platform);
  
  try {
    const output = await runFFmpegCommand(ffmpegPath, args);
    const devices = parseDeviceList(output, platform);
    
    // Update camera store with discovered devices
    const now = new Date();
    const discoveredIds = new Set<string>();
    
    for (const device of devices) {
      discoveredIds.add(device.id);
      
      const existing = cameraStore.get(device.id);
      if (existing) {
        // Update existing device, preserve reservation
        cameraStore.set(device.id, {
          device: {
            ...device,
            status: existing.reservedBy ? 'in-use' : 'available',
          },
          reservedBy: existing.reservedBy,
          lastSeen: now,
        });
      } else {
        // Add new device
        cameraStore.set(device.id, {
          device,
          reservedBy: null,
          lastSeen: now,
        });
      }
    }
    
    // Mark devices not seen as disconnected
    for (const [id, state] of cameraStore.entries()) {
      if (!discoveredIds.has(id)) {
        cameraStore.set(id, {
          ...state,
          device: {
            ...state.device,
            status: 'disconnected',
          },
        });
      }
    }
    
    return devices;
  } catch (error) {
    console.error('Failed to discover cameras:', error);
    throw error;
  }
}

/**
 * Get all known cameras
 */
export function getCameras(): CameraDevice[] {
  return Array.from(cameraStore.values()).map((state) => state.device);
}

/**
 * Get a specific camera by ID
 */
export function getCameraById(id: string): CameraDevice | undefined {
  const state = cameraStore.get(id);
  return state?.device;
}

/**
 * Reserve a camera for streaming
 * Returns true if successful, false if camera is not available
 */
export function reserveCamera(cameraId: string, streamId: string): boolean {
  const state = cameraStore.get(cameraId);
  
  if (!state) {
    return false;
  }
  
  if (state.reservedBy !== null) {
    // Already reserved
    return false;
  }
  
  if (state.device.status === 'disconnected' || state.device.status === 'error') {
    return false;
  }
  
  // Reserve the camera
  cameraStore.set(cameraId, {
    ...state,
    device: {
      ...state.device,
      status: 'in-use',
    },
    reservedBy: streamId,
  });
  
  return true;
}

/**
 * Release a camera from streaming
 * Returns true if successful, false if camera was not reserved by this stream
 */
export function releaseCamera(cameraId: string, streamId: string): boolean {
  const state = cameraStore.get(cameraId);
  
  if (!state) {
    return false;
  }
  
  if (state.reservedBy !== streamId) {
    // Not reserved by this stream
    return false;
  }
  
  // Release the camera
  cameraStore.set(cameraId, {
    ...state,
    device: {
      ...state.device,
      status: 'available',
    },
    reservedBy: null,
  });
  
  return true;
}

/**
 * Get the stream ID that has reserved a camera
 */
export function getCameraReservation(cameraId: string): string | null {
  const state = cameraStore.get(cameraId);
  return state?.reservedBy ?? null;
}

/**
 * Check if a camera is available for streaming
 */
export function isCameraAvailable(cameraId: string): boolean {
  const state = cameraStore.get(cameraId);
  return state !== undefined && 
         state.reservedBy === null && 
         state.device.status === 'available';
}

/**
 * Clear all camera state (for testing)
 */
export function clearCameraStore(): void {
  cameraStore.clear();
}

/**
 * Add a mock camera (for testing)
 */
export function addMockCamera(device: CameraDevice): void {
  cameraStore.set(device.id, {
    device,
    reservedBy: null,
    lastSeen: new Date(),
  });
}
