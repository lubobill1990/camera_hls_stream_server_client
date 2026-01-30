/**
 * HLS Camera Streaming Server - Type Definitions
 * 
 * Core types for camera management, stream handling, and HLS output
 */

// ============================================================================
// Camera Types
// ============================================================================

/** Camera device status */
export type CameraStatus = 'available' | 'in-use' | 'disconnected' | 'error';

/** Type of camera device */
export type CameraType = 'builtin' | 'usb' | 'virtual' | 'unknown';

/** Camera device capabilities */
export interface CameraCapabilities {
  /** Supported resolutions (e.g., ["1920x1080", "1280x720"]) */
  resolutions: string[];
  /** Supported frame rates */
  frameRates: number[];
  /** Whether camera supports auto-focus */
  autoFocus: boolean;
}

/** Camera device information */
export interface CameraDevice {
  /** Unique identifier for the camera (platform-specific) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Type of camera */
  type: CameraType;
  /** Current status */
  status: CameraStatus;
  /** Device capabilities (may be null if not detected) */
  capabilities: CameraCapabilities | null;
}

// ============================================================================
// Stream Types
// ============================================================================

/** Stream lifecycle status */
export type StreamStatus = 
  | 'starting'   // FFmpeg spawning, waiting for first segment
  | 'running'    // Streaming normally (changed from 'active' for consistency)
  | 'stopping'   // Graceful shutdown in progress
  | 'stopped'    // Stream ended normally
  | 'error';     // Stream failed

/** Stream configuration options */
export interface StreamOptions {
  /** Target video bitrate (e.g., "2500k") */
  videoBitrate?: string;
  /** Target audio bitrate (e.g., "128k") */
  audioBitrate?: string;
  /** Target resolution (default: "1280x720") */
  resolution?: string;
  /** Target frame rate (default: 30) */
  framerate?: number;
}

/** Active stream information */
export interface Stream {
  /** Unique stream identifier (UUID) */
  id: string;
  /** Camera being used for this stream */
  cameraId: string;
  /** Current stream status */
  status: StreamStatus;
  /** HLS manifest URL (available when status is 'running') */
  hlsUrl: string | null;
  /** Video resolution */
  resolution: string;
  /** Video framerate */
  framerate: number;
  /** Video bitrate (e.g., "2500k") */
  videoBitrate?: string;
  /** Audio bitrate (e.g., "128k") */
  audioBitrate?: string;
  /** Stream start timestamp (ISO 8601, null if not yet started) */
  startedAt: string | null;
  /** Error message (if status is 'error') */
  error: string | null;
}

// ============================================================================
// HLS Types
// ============================================================================

/** HLS segment file information */
export interface HLSSegment {
  /** Segment sequence number */
  sequence: number;
  /** Segment filename (e.g., "segment_001.ts") */
  filename: string;
  /** Segment duration in seconds */
  duration: number;
  /** URL to access segment */
  url: string;
}

/** HLS manifest metadata */
export interface StreamManifest {
  /** Stream this manifest belongs to */
  streamId: string;
  /** HLS version */
  version: number;
  /** Target duration for segments */
  targetDuration: number;
  /** Media sequence number */
  mediaSequence: number;
  /** List of available segments */
  segments: HLSSegment[];
  /** Playlist URL */
  playlistUrl: string;
}

// ============================================================================
// API Types
// ============================================================================

/** API error response */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/** GET /api/cameras response */
export interface GetCamerasResponse {
  cameras: CameraDevice[];
}

/** POST /api/streams request */
export interface StartStreamRequest {
  cameraId: string;
  bitrate?: number;
  resolution?: string;
  frameRate?: number;
}

/** POST /api/streams response */
export interface StartStreamResponse {
  stream: Stream;
}

/** GET /api/streams response */
export interface GetStreamsResponse {
  streams: Stream[];
}

/** GET /api/streams/:id response */
export interface GetStreamResponse {
  stream: Stream;
}

/** DELETE /api/streams/:id response */
export interface StopStreamResponse {
  success: boolean;
  message: string;
}

/** GET /api/health response */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  ffmpegAvailable?: boolean;
  activeStreams?: number;
  diskUsage?: {
    hlsDirectory: string;
    usedBytes: number;
    availableBytes: number;
  };
}
