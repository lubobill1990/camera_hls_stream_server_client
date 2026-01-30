/**
 * API Client for HLS Camera Streaming Server
 */

import type {
  CameraDevice,
  Stream,
  GetCamerasResponse,
  StartStreamRequest,
  StartStreamResponse,
  GetStreamsResponse,
  GetStreamResponse,
  StopStreamResponse,
  HealthResponse,
  ApiError,
} from './types';

const API_BASE = '/api';

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Network error',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message || error.error);
  }
  
  return response.json();
}

/**
 * Get all available cameras
 */
export async function getCameras(): Promise<CameraDevice[]> {
  const data = await fetchApi<GetCamerasResponse>('/cameras');
  return data.cameras;
}

/**
 * Get a specific camera by ID
 */
export async function getCamera(id: string): Promise<CameraDevice> {
  const data = await fetchApi<{ camera: CameraDevice }>(`/cameras/${id}`);
  return data.camera;
}

/**
 * Start a new stream from a camera
 */
export async function startStream(
  cameraId: string,
  options?: {
    bitrate?: number;
    resolution?: string;
    frameRate?: number;
  }
): Promise<Stream> {
  const request: StartStreamRequest = {
    cameraId,
    ...options,
  };
  
  const data = await fetchApi<StartStreamResponse>('/streams', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  
  return data.stream;
}

/**
 * Get all streams
 */
export async function getStreams(): Promise<Stream[]> {
  const data = await fetchApi<GetStreamsResponse>('/streams');
  return data.streams;
}

/**
 * Get active streams only
 */
export async function getActiveStreams(): Promise<Stream[]> {
  const data = await fetchApi<GetStreamsResponse>('/streams?status=active');
  return data.streams;
}

/**
 * Get a specific stream by ID
 */
export async function getStream(id: string): Promise<Stream> {
  const data = await fetchApi<GetStreamResponse>(`/streams/${id}`);
  return data.stream;
}

/**
 * Stop a stream
 */
export async function stopStream(id: string): Promise<StopStreamResponse> {
  return fetchApi<StopStreamResponse>(`/streams/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get server health status
 */
export async function getHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>('/health');
}
