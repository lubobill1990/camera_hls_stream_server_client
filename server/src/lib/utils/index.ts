/**
 * Utility functions for the HLS camera streaming server
 */

import { spawn } from 'child_process';
import * as os from 'os';

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Format uptime in seconds to HH:MM:SS
 */
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Parse resolution string to width and height
 */
export function parseResolution(resolution: string): { width: number; height: number } | null {
  const match = resolution.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}

/**
 * Validate resolution string
 */
export function isValidResolution(resolution: string): boolean {
  const parsed = parseResolution(resolution);
  if (!parsed) return false;
  
  // Check reasonable bounds
  return parsed.width >= 320 && parsed.width <= 4096 &&
         parsed.height >= 240 && parsed.height <= 2160;
}

/**
 * Validate framerate
 */
export function isValidFramerate(framerate: number): boolean {
  return framerate >= 1 && framerate <= 120;
}

/**
 * Validate bitrate string (e.g., '2500k', '5M')
 */
export function isValidBitrate(bitrate: string): boolean {
  return /^\d+[kKmM]?$/.test(bitrate);
}

/**
 * Get system information
 */
export function getSystemInfo(): {
  platform: string;
  arch: string;
  cpus: number;
  memory: { total: number; free: number };
  uptime: number;
} {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    uptime: os.uptime(),
  };
}

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpeg(ffmpegPath = 'ffmpeg'): Promise<{
  available: boolean;
  version: string | null;
  error: string | null;
}> {
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ['-version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    let output = '';
    
    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        const versionMatch = output.match(/ffmpeg version (\S+)/);
        resolve({
          available: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          error: null,
        });
      } else {
        resolve({
          available: false,
          version: null,
          error: `FFmpeg exited with code ${code}`,
        });
      }
    });
    
    proc.on('error', (error) => {
      resolve({
        available: false,
        version: null,
        error: error.message,
      });
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      proc.kill();
      resolve({
        available: false,
        version: null,
        error: 'FFmpeg check timed out',
      });
    }, 5000);
  });
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Minimum disk space required (500 MB) */
const MIN_DISK_SPACE_MB = 500;

/**
 * Check available disk space for the HLS output directory
 * Returns available space in bytes and whether it meets minimum requirements
 */
export async function checkDiskSpace(dirPath: string): Promise<{
  available: number;
  total: number;
  sufficient: boolean;
  requiredMB: number;
}> {
  const { statfs } = await import('fs/promises');
  const stats = await statfs(dirPath);
  
  const available = stats.bavail * stats.bsize;
  const total = stats.blocks * stats.bsize;
  const requiredBytes = MIN_DISK_SPACE_MB * 1024 * 1024;
  
  return {
    available,
    total,
    sufficient: available >= requiredBytes,
    requiredMB: MIN_DISK_SPACE_MB,
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate a unique ID (for non-crypto purposes)
 */
export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Safe JSON parse with default value
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Environment variable helpers
 */
export function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
