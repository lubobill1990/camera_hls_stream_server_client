/**
 * Frontend Type Definitions
 * Mirrors server types for type safety
 */

// Camera Types
export type CameraStatus = 'available' | 'in-use' | 'disconnected' | 'error';
export type CameraType = 'builtin' | 'usb' | 'virtual' | 'unknown';

export interface CameraCapabilities {
  resolutions: string[];
  frameRates: number[];
  autoFocus: boolean;
}

export interface CameraDevice {
  id: string;
  name: string;
  type: CameraType;
  status: CameraStatus;
  capabilities: CameraCapabilities | null;
}

// Stream Types
export type StreamStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

export interface StreamOptions {
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string;
  framerate?: number;
}

export interface Stream {
  id: string;
  cameraId: string;
  status: StreamStatus;
  hlsUrl: string | null;
  resolution: string;
  framerate: number;
  videoBitrate?: string;
  audioBitrate?: string;
  startedAt: string | null;
  error: string | null;
}

// API Response Types
export interface GetCamerasResponse {
  cameras: CameraDevice[];
}

export interface StartStreamRequest {
  cameraId: string;
  bitrate?: number;
  resolution?: string;
  frameRate?: number;
}

export interface StartStreamResponse {
  stream: Stream;
}

export interface GetStreamsResponse {
  streams: Stream[];
}

export interface GetStreamResponse {
  stream: Stream;
}

export interface StopStreamResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  activeStreams?: number;
}

export interface ApiError {
  error: string;
  message?: string;
}
