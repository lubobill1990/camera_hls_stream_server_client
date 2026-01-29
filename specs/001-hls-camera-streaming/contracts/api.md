# API Contracts: HLS Camera Streaming

**Feature**: HLS Camera Streaming Server  
**Date**: January 29, 2026  
**Format**: OpenAPI-style contract documentation

---

## Overview

The API consists of three main resource families:

1. **Cameras** - List and manage connected camera devices
2. **Streams** - Control active HLS streams
3. **HLS Media** - Serve manifest and video segments

All endpoints are prefixed with `/api/`.

---

## Resource: Cameras

### GET /cameras

List all available camera devices on the system.

**Request**:
```http
GET /api/cameras HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```json
{
  "cameras": [
    {
      "id": "camera-001",
      "name": "Built-in iSight Camera",
      "type": "builtin",
      "status": "available",
      "capabilities": {
        "resolutions": [
          {
            "width": 640,
            "height": 480,
            "fps": [24, 30]
          },
          {
            "width": 1280,
            "height": 720,
            "fps": [30, 60]
          },
          {
            "width": 1920,
            "height": 1080,
            "fps": [30]
          }
        ],
        "defaultResolution": {
          "width": 1280,
          "height": 720,
          "fps": 30
        }
      }
    },
    {
      "id": "camera-002",
      "name": "USB Webcam",
      "type": "usb",
      "status": "in-use",
      "capabilities": { ... }
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Camera list successfully retrieved
- `500 Internal Server Error` - Camera enumeration failed

**Notes**:
- Cameras with `status: "disconnected"` may still appear in list
- `status` is computed in real-time based on active streams
- Call frequently (every 1-5 seconds) to stay in sync with system state

---

## Resource: Streams

### POST /streams

Start a new HLS stream from a camera.

**Request**:
```http
POST /api/streams HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "cameraId": "camera-001",
  "bitrate": 2500,
  "resolution": {
    "width": 1280,
    "height": 720
  },
  "frameRate": 30
}
```

**Parameters**:
- `cameraId` (string, required): Camera ID from `/cameras` endpoint
- `bitrate` (number, optional, default: 2500): Target bitrate in kbps (500-8000)
- `resolution` (object, optional): Output resolution. If omitted, use camera default
  - `width` (number): Pixels (must match camera capability)
  - `height` (number): Pixels (must match camera capability)
- `frameRate` (number, optional, default: 30): Target fps (1-60)

**Response** (201 Created):
```json
{
  "stream": {
    "id": "stream-a1b2c3d4e5f6",
    "cameraId": "camera-001",
    "status": "starting",
    "startTime": "2026-01-29T10:30:00.000Z",
    "hlsUrl": "/api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8",
    "resolution": {
      "width": 1280,
      "height": 720
    },
    "bitrate": 2500,
    "frameRate": 30,
    "segmentDuration": 2,
    "segmentCount": 0,
    "bufferedSegments": 0,
    "uptime": 0
  }
}
```

**Error Responses**:

**409 Conflict** - Camera already in use:
```json
{
  "error": "Camera already in use by another stream",
  "code": "CAMERA_IN_USE",
  "streamId": "stream-xyz789"
}
```

**400 Bad Request** - Invalid parameters:
```json
{
  "error": "Bitrate must be between 500 and 8000 kbps",
  "code": "INVALID_BITRATE"
}
```

**404 Not Found** - Camera not found:
```json
{
  "error": "Camera not found",
  "code": "CAMERA_NOT_FOUND"
}
```

**500 Internal Server Error** - FFmpeg failed to start:
```json
{
  "error": "Failed to start FFmpeg: [reason]",
  "code": "FFMPEG_START_FAILED"
}
```

**Status Codes**:
- `201 Created` - Stream created successfully
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Camera not found
- `409 Conflict` - Camera already in use
- `500 Internal Server Error` - Server error

**Notes**:
- Stream enters `starting` state; transitions to `active` when FFmpeg is ready (~1 second)
- `hlsUrl` becomes playable after stream reaches `active` status
- Client should poll `/streams/{streamId}` to wait for `active` status
- Only one stream per camera allowed at a time

---

### GET /streams

List all active streams.

**Request**:
```http
GET /api/streams HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```json
{
  "streams": [
    {
      "id": "stream-a1b2c3d4e5f6",
      "cameraId": "camera-001",
      "status": "active",
      "startTime": "2026-01-29T10:30:00.000Z",
      "hlsUrl": "/api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8",
      "resolution": { "width": 1280, "height": 720 },
      "bitrate": 2500,
      "segmentCount": 42,
      "bufferedSegments": 10,
      "uptime": 84
    },
    {
      "id": "stream-def456",
      "cameraId": "camera-002",
      "status": "active",
      "startTime": "2026-01-29T10:32:15.000Z",
      ...
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Stream list retrieved

**Notes**:
- Returns both `starting` and `active` streams
- Stopped streams do not appear in this list
- Call every 2-5 seconds to keep UI in sync

---

### GET /streams/{streamId}

Get details of a specific stream.

**Request**:
```http
GET /api/streams/stream-a1b2c3d4e5f6 HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```json
{
  "stream": {
    "id": "stream-a1b2c3d4e5f6",
    "cameraId": "camera-001",
    "status": "active",
    "startTime": "2026-01-29T10:30:00.000Z",
    "stopTime": null,
    "hlsUrl": "/api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8",
    "resolution": { "width": 1280, "height": 720 },
    "bitrate": 2500,
    "frameRate": 30,
    "segmentDuration": 2,
    "segmentCount": 42,
    "ffmpegPid": 5678,
    "bufferedSegments": 10,
    "uptime": 84,
    "bytesEncoded": 125000000
  }
}
```

**Path Parameters**:
- `streamId` (string, required): Stream ID

**Status Codes**:
- `200 OK` - Stream details retrieved
- `404 Not Found` - Stream not found

**Notes**:
- Use this to poll `status` until it becomes `active`
- `uptime` is in seconds, `bytesEncoded` is cumulative

---

### DELETE /streams/{streamId}

Stop an active stream and release the camera.

**Request**:
```http
DELETE /api/streams/stream-a1b2c3d4e5f6 HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```json
{
  "success": true,
  "streamId": "stream-a1b2c3d4e5f6",
  "stoppedAt": "2026-01-29T10:35:45.000Z",
  "totalUptime": 345,
  "totalBytesEncoded": 125000000
}
```

**Path Parameters**:
- `streamId` (string, required): Stream ID

**Status Codes**:
- `200 OK` - Stream stopped successfully
- `404 Not Found` - Stream not found
- `500 Internal Server Error` - Cleanup failed

**Notes**:
- Stream is moved to `stopped` state before response returns
- Files are cleaned up asynchronously (safe to delete)
- Camera is immediately released for reuse
- Subsequent requests to the stream return 404

---

## Resource: HLS Media

### GET /hlsstream/{streamId}/manifest.m3u8

Fetch the HLS master playlist for a stream.

**Request**:
```http
GET /api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8 HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```
Content-Type: application/vnd.apple.mpegurl
Cache-Control: no-cache, no-store, must-revalidate
Content-Length: 347

#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:32
#EXT-X-PLAYLIST-TYPE:EVENT
#EXTINF:2.0,
segment_0032.ts
#EXTINF:2.0,
segment_0033.ts
#EXTINF:2.0,
segment_0034.ts
#EXTINF:2.0,
segment_0035.ts
#EXTINF:2.0,
segment_0036.ts
#EXTINF:2.0,
segment_0037.ts
#EXTINF:2.0,
segment_0038.ts
#EXTINF:2.0,
segment_0039.ts
#EXTINF:2.0,
segment_0040.ts
#EXTINF:2.0,
segment_0041.ts
```

**Path Parameters**:
- `streamId` (string, required): Stream ID

**Query Parameters**: None

**Status Codes**:
- `200 OK` - Manifest retrieved
- `404 Not Found` - Stream not found or not yet started
- `500 Internal Server Error` - Manifest generation failed

**Headers**:
- `Content-Type: application/vnd.apple.mpegurl` - Required for browser HLS support
- `Cache-Control: no-cache, no-store` - Prevent stale manifests

**Notes**:
- Must be called frequently (~every 500-1000ms) to get fresh segment list
- Returns only the last 10 segments (rolling window)
- MEDIA-SEQUENCE indicates the first segment number
- Manifest format is HLS v3 spec compliant

---

### GET /hlsstream/{streamId}/{segmentFile}.ts

Fetch a specific video segment (MPEG-TS file).

**Request**:
```http
GET /api/hlsstream/stream-a1b2c3d4e5f6/segment_0041.ts HTTP/1.1
Host: localhost:3000
Range: bytes=0-262143
```

**Response** (200 OK or 206 Partial Content):
```
Content-Type: video/mp2t
Content-Length: 625000
Cache-Control: public, max-age=31536000

[binary MPEG-TS data - 625KB]
```

**Path Parameters**:
- `streamId` (string, required): Stream ID
- `segmentFile` (string, required): Segment filename (e.g., `segment_0041.ts`)

**Status Codes**:
- `200 OK` - Full segment retrieved
- `206 Partial Content` - Range request honored
- `404 Not Found` - Stream or segment not found
- `416 Range Not Satisfiable` - Invalid range requested

**Headers**:
- `Content-Type: video/mp2t` - MPEG-TS video format
- `Cache-Control: public, max-age=31536000` - Aggressively cache (1 year)
- `Content-Length` - Segment size in bytes

**Notes**:
- Segments are immutable; safe to cache indefinitely after creation
- Supports HTTP Range requests for seeking
- Segment must exist in manifest (check manifest first)
- Typical segment size: 500-700KB per 2 seconds

---

## Health Check (Optional)

### GET /health

Check server and FFmpeg status.

**Request**:
```http
GET /api/health HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T10:35:45.000Z",
  "ffmpeg": {
    "installed": true,
    "version": "N-107088-gfff73edd4d-static"
  },
  "activeStreams": 2,
  "totalDiskUsage": "150MB"
}
```

**Status Codes**:
- `200 OK` - Server is healthy
- `503 Service Unavailable` - FFmpeg not available

---

## Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `CAMERA_IN_USE` | 409 | Camera is already being used by another stream |
| `CAMERA_NOT_FOUND` | 404 | Camera ID doesn't exist |
| `STREAM_NOT_FOUND` | 404 | Stream ID doesn't exist |
| `INVALID_BITRATE` | 400 | Bitrate outside acceptable range |
| `INVALID_RESOLUTION` | 400 | Resolution not supported by camera |
| `FFMPEG_START_FAILED` | 500 | FFmpeg process failed to spawn |
| `FFMPEG_CRASHED` | 500 | FFmpeg process crashed during streaming |
| `DISK_FULL` | 507 | Not enough disk space for segments |
| `CAMERA_DISCONNECTED` | 409 | Camera was unplugged during streaming |

---

## Client Integration Example

### JavaScript/TypeScript

```typescript
// Start stream
const startStreamResponse = await fetch('/api/streams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cameraId: 'camera-001',
    bitrate: 2500,
    resolution: { width: 1280, height: 720 }
  })
});

const { stream } = await startStreamResponse.json();
console.log(`Stream ${stream.id} status: ${stream.status}`);

// Wait for stream to become active
let isActive = false;
while (!isActive) {
  const statusResponse = await fetch(`/api/streams/${stream.id}`);
  const { stream: updated } = await statusResponse.json();
  isActive = updated.status === 'active';
  if (!isActive) await new Promise(r => setTimeout(r, 500));
}

// Play stream
const videoElement = document.querySelector('video');
const hlsUrl = stream.hlsUrl;

import HlsPlayer from 'hls.js';
const hls = new HlsPlayer();
hls.loadSource(hlsUrl);
hls.attachMedia(videoElement);

// Stop stream
await fetch(`/api/streams/${stream.id}`, { method: 'DELETE' });
```

---

## Rate Limiting

No rate limiting is enforced in MVP. In production, consider:
- Manifest requests: Allow up to 10 req/sec per stream
- Segment requests: Allow up to 100 req/sec per stream
- Control endpoints: Standard rate limiting (100 req/minute per IP)

---

## Authentication

MVP has no authentication. All endpoints are public.

For production, add:
- JWT or session-based auth
- Scopes: `streams:read`, `streams:write`, `streams:delete`
- Rate limiting per user

---

## Versioning

Current version: **v1 (draft)**

No versioning required for MVP. Future versions would use:
- Request header: `X-API-Version: 1`
- URL path: `/api/v1/streams`

