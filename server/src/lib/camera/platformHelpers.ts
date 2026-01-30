/**
 * Platform-specific helpers for FFmpeg device detection
 */

import { spawn } from 'child_process';
import type { CameraDevice, CameraType } from '../types/index.js';

/** Supported platforms */
export type Platform = 'win32' | 'darwin' | 'linux';

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  const platform = process.platform;
  if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
    return platform;
  }
  // Default to linux for unknown platforms
  return 'linux';
}

/**
 * Get FFmpeg input format for the current platform
 */
export function getFFmpegInputFormat(platform: Platform): string {
  switch (platform) {
    case 'win32':
      return 'dshow';
    case 'darwin':
      return 'avfoundation';
    case 'linux':
      return 'v4l2';
  }
}

/**
 * Get FFmpeg arguments to list devices
 */
export function getListDevicesArgs(platform: Platform): string[] {
  switch (platform) {
    case 'win32':
      return ['-f', 'dshow', '-list_devices', 'true', '-i', 'dummy'];
    case 'darwin':
      return ['-f', 'avfoundation', '-list_devices', 'true', '-i', ''];
    case 'linux':
      // On Linux, we use v4l2-ctl or scan /dev/video*
      return ['-f', 'v4l2', '-list_formats', 'all', '-i', '/dev/video0'];
  }
}

/**
 * Get FFmpeg device input string for a camera
 */
export function getDeviceInput(platform: Platform, deviceId: string): string {
  switch (platform) {
    case 'win32':
      // DirectShow format: video=DeviceName
      return `video=${deviceId}`;
    case 'darwin':
      // AVFoundation format: device index
      return deviceId;
    case 'linux':
      // V4L2 format: /dev/videoX
      return deviceId.startsWith('/dev/') ? deviceId : `/dev/${deviceId}`;
  }
}

/**
 * Parse FFmpeg device list output into CameraDevice array
 */
export function parseDeviceList(output: string, platform: Platform): CameraDevice[] {
  const cameras: CameraDevice[] = [];
  
  switch (platform) {
    case 'win32':
      cameras.push(...parseDirectShowOutput(output));
      break;
    case 'darwin':
      cameras.push(...parseAVFoundationOutput(output));
      break;
    case 'linux':
      cameras.push(...parseV4L2Output(output));
      break;
  }
  
  return cameras;
}

/**
 * Parse DirectShow (Windows) device list
 * Handles both old format with "DirectShow video devices" header
 * and new format with "(video)" suffix on each device line
 */
function parseDirectShowOutput(output: string): CameraDevice[] {
  const cameras: CameraDevice[] = [];
  const lines = output.split('\n');
  
  // Try new format first: [dshow @ ...] "Device Name" (video)
  for (const line of lines) {
    // Match: "Device Name" (video) - the (video) suffix indicates a video device
    const newFormatMatch = line.match(/\[dshow[^\]]*\]\s*"([^"]+)"\s*\(video\)/);
    if (newFormatMatch) {
      const name = newFormatMatch[1];
      cameras.push({
        id: name,
        name: name,
        type: inferCameraType(name),
        status: 'available',
        capabilities: null,
      });
      continue;
    }
    
    // Also match devices with (none) type - these are virtual cameras
    const virtualMatch = line.match(/\[dshow[^\]]*\]\s*"([^"]+)"\s*\(none\)/);
    if (virtualMatch) {
      const name = virtualMatch[1];
      cameras.push({
        id: name,
        name: name,
        type: 'virtual' as CameraType,
        status: 'available',
        capabilities: null,
      });
    }
  }
  
  // If new format found devices, return them
  if (cameras.length > 0) {
    return cameras;
  }
  
  // Fallback to old format with section headers
  let inVideoDevices = false;
  
  for (const line of lines) {
    // Look for video devices section
    if (line.includes('DirectShow video devices')) {
      inVideoDevices = true;
      continue;
    }
    
    // Stop at audio devices section
    if (line.includes('DirectShow audio devices')) {
      inVideoDevices = false;
      continue;
    }
    
    if (inVideoDevices) {
      // Match device name in quotes: "Device Name"
      const match = line.match(/"([^"]+)"/);
      if (match) {
        const name = match[1];
        // Skip alternative names (they start with @device)
        if (!name.startsWith('@device')) {
          cameras.push({
            id: name,
            name: name,
            type: inferCameraType(name),
            status: 'available',
            capabilities: null,
          });
        }
      }
    }
  }
  
  return cameras;
}

/**
 * Parse AVFoundation (macOS) device list
 */
function parseAVFoundationOutput(output: string): CameraDevice[] {
  const cameras: CameraDevice[] = [];
  const lines = output.split('\n');
  
  let inVideoDevices = false;
  
  for (const line of lines) {
    // Look for video devices section
    if (line.includes('AVFoundation video devices:')) {
      inVideoDevices = true;
      continue;
    }
    
    // Stop at audio devices section
    if (line.includes('AVFoundation audio devices:')) {
      inVideoDevices = false;
      continue;
    }
    
    if (inVideoDevices) {
      // Match: [index] Device Name
      const match = line.match(/\[(\d+)\]\s+(.+)/);
      if (match) {
        const [, index, name] = match;
        cameras.push({
          id: index,
          name: name.trim(),
          type: inferCameraType(name),
          status: 'available',
          capabilities: null,
        });
      }
    }
  }
  
  return cameras;
}

/**
 * Parse V4L2 (Linux) device list
 */
function parseV4L2Output(_output: string): CameraDevice[] {
  // On Linux, we'll scan /dev/video* devices instead
  // This is a simplified implementation
  const cameras: CameraDevice[] = [];
  
  // Check for common video devices
  const fs = require('fs');
  for (let i = 0; i < 10; i++) {
    const devicePath = `/dev/video${i}`;
    try {
      fs.accessSync(devicePath);
      cameras.push({
        id: devicePath,
        name: `Video Device ${i}`,
        type: 'unknown',
        status: 'available',
        capabilities: null,
      });
    } catch {
      // Device doesn't exist
    }
  }
  
  return cameras;
}

/**
 * Infer camera type from device name
 */
function inferCameraType(name: string): CameraType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('facetime') || lowerName.includes('isight') || lowerName.includes('integrated')) {
    return 'builtin';
  }
  
  if (lowerName.includes('usb') || lowerName.includes('webcam') || lowerName.includes('logitech')) {
    return 'usb';
  }
  
  if (lowerName.includes('virtual') || lowerName.includes('obs') || lowerName.includes('screen')) {
    return 'virtual';
  }
  
  return 'unknown';
}

/**
 * Run FFmpeg command and capture output
 */
export function runFFmpegCommand(ffmpegPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    let stderr = '';
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', () => {
      // FFmpeg outputs device list to stderr and exits with error (expected)
      resolve(stderr);
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      proc.kill();
      resolve(stderr);
    }, 5000);
  });
}
