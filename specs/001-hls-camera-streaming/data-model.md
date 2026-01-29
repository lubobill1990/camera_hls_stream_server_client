# Data Model: HLS Camera Streaming System

**Feature**: HLS Camera Streaming Server  
**Date**: January 29, 2026  
**Status**: Phase 1 Design

---

## Domain Overview

The system models real-time video streaming through four primary entities:

1. **CameraDevice** - Physical/virtual camera hardware
2. **Stream** - Active capture session from a camera
3. **HLSSegment** - Individual video file chunk (2 seconds)
4. **StreamManifest** - HLS playlist (.m3u8 file) describing segments

The relationships form a simple flow:
```
CameraDevice → Stream → [HLSSegments...] → Manifest (m3u8)
                      → [Process: FFmpeg] → Output files
```

---

## Entity: CameraDevice

Represents a physical or virtual camera device available on the system.

### Attributes

| Field | Type | Required | Constraints | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | UUID v4 or OS device ID | `"usb-0781:5591-0:0"` |
| `name` | string | Yes | 1-255 chars, user-friendly | `"Built-in iSight Camera"` |
| `deviceName` | string | Yes | OS-specific device identifier | `"Integrated Camera"` (Windows) |
| `type` | enum | Yes | `usb` \| `builtin` \| `virtual` | `"builtin"` |
| `status` | enum | Yes | `available` \| `in-use` \| `disconnected` | `"available"` |
| `capabilities` | object | Yes | Supported resolutions/framerates | See below |
| `lastSeen` | ISO8601 | No | Last detected timestamp | `"2026-01-29T10:30:00Z"` |
| `errorMessage` | string | No | If status is `disconnected` | `"Device unplugged"` |

### Capabilities Object

```typescript
capabilities: {
  resolutions: Array<{
    width: number;        // pixels (e.g., 1920)
    height: number;       // pixels (e.g., 1080)
    fps: number[];        // supported framerates [24, 30, 60]
  }>;
  defaultResolution: {
    width: number;
    height: number;
    fps: number;
  };
  formats: string[];      // ["mjpeg", "h264", "yuy2"]
}
```

### Validation Rules

- **id**: Must be unique across system
- **name**: Cannot be empty, should be human-readable
- **status**: Auto-transitions from `available` → `in-use` when stream starts
- **capabilities**: Must include at least one supported resolution

### Example

```json
{
  "id": "camera-001",
  "name": "Front Webcam",
  "deviceName": "Integrated Webcam",
  "type": "builtin",
  "status": "available",
  "capabilities": {
    "resolutions": [
      { "width": 640, "height": 480, "fps": [24, 30] },
      { "width": 1280, "height": 720, "fps": [30, 60] },
      { "width": 1920, "height": 1080, "fps": [30] }
    ],
    "defaultResolution": { "width": 1280, "height": 720, "fps": 30 },
    "formats": ["yuy2", "mjpeg"]
  },
  "lastSeen": "2026-01-29T10:30:00Z"
}
```

---

## Entity: Stream

Represents an active real-time stream from a camera being encoded to HLS.

### Attributes

| Field | Type | Required | Constraints | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | UUID v4 | `"stream-a1b2c3d4e5f6"` |
| `cameraId` | string | Yes | FK to CameraDevice.id | `"camera-001"` |
| `status` | enum | Yes | `starting` \| `active` \| `stopping` \| `stopped` \| `error` | `"active"` |
| `startTime` | ISO8601 | Yes | Creation timestamp | `"2026-01-29T10:30:00.000Z"` |
| `stopTime` | ISO8601 | No | When stream ended | `"2026-01-29T10:35:45.000Z"` |
| `hlsUrl` | string | Yes | Relative path to m3u8 | `"/api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8"` |
| `resolution` | object | Yes | Encoding output resolution | `{ "width": 1280, "height": 720 }` |
| `frameRate` | number | Yes | Target fps (1-60) | `30` |
| `bitrate` | number | Yes | Target bitrate in kbps | `2500` |
| `segmentDuration` | number | Yes | Duration in seconds (1-10) | `2` |
| `segmentCount` | number | Yes | Number of segments generated | `42` |
| `ffmpegPid` | number | No | Process ID of encoder | `1234` |
| `ffmpegStartTime` | ISO8601 | No | When encoder started | `"2026-01-29T10:30:01.000Z"` |
| `bufferedSegments` | number | Yes | Currently available segments | `10` |
| `uptime` | number | Yes | Duration in seconds | `345` |
| `bytesEncoded` | number | Yes | Total bytes written | `125000000` |
| `error` | string | No | Error message if status is `error` | `"Camera disconnected"` |

### Status Transitions

```
[starting] --(FFmpeg ready)--> [active] --(stop req)--> [stopping] --> [stopped]
                                   |
                                   +-(error)--> [error]
```

- **starting**: Stream created, FFmpeg spawning (0-1 second)
- **active**: FFmpeg running, segments being generated
- **stopping**: Stop requested, waiting for FFmpeg to cleanly shutdown (0-10 seconds)
- **stopped**: Stream fully stopped, files cleaned up
- **error**: FFmpeg crashed or camera disconnected

### Validation Rules

- **id**: Must be unique
- **cameraId**: Must reference existing available camera
- **hlsUrl**: Auto-generated from stream id
- **bitrate**: Between 500-8000 kbps
- **frameRate**: Between 1-60 fps
- **segmentDuration**: Between 1-10 seconds
- **status**: Cannot transition backward (no restarting stopped streams)
- **bytesEncoded**: Only increases, never decreases
- **bufferedSegments**: Managed by system (0-15 range typical)

### Example

```json
{
  "id": "stream-a1b2c3d4e5f6",
  "cameraId": "camera-001",
  "status": "active",
  "startTime": "2026-01-29T10:30:00.000Z",
  "hlsUrl": "/api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8",
  "resolution": { "width": 1280, "height": 720 },
  "frameRate": 30,
  "bitrate": 2500,
  "segmentDuration": 2,
  "segmentCount": 42,
  "ffmpegPid": 5678,
  "ffmpegStartTime": "2026-01-29T10:30:01.000Z",
  "bufferedSegments": 10,
  "uptime": 345,
  "bytesEncoded": 125000000
}
```

---

## Entity: HLSSegment

An individual video chunk file (.ts) that is part of a stream.

### Attributes

| Field | Type | Required | Constraints | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | Filename | `"segment_0042.ts"` |
| `streamId` | string | Yes | Parent stream reference | `"stream-a1b2c3d4e5f6"` |
| `sequenceNumber` | number | Yes | 0-indexed sequence | `42` |
| `duration` | number | Yes | Duration in milliseconds | `2000` |
| `byteSize` | number | Yes | File size in bytes | `625000` |
| `filepath` | string | Yes | Location on disk | `"./public/hls/stream-a1b2c3d4e5f6/segment_0042.ts"` |
| `createdAt` | ISO8601 | Yes | Write timestamp | `"2026-01-29T10:30:28.000Z"` |
| `checksum` | string | No | SHA256 hash for integrity | `"a1b2c3..."` |

### File Storage

Segments are written to disk in stream-specific directories:
```
./public/hls/<streamId>/segment_0000.ts
./public/hls/<streamId>/segment_0001.ts
./public/hls/<streamId>/segment_0002.ts
...
./public/hls/<streamId>/segment_0009.ts  (kept)
./public/hls/<streamId>/manifest.m3u8    (keeps last 10 segments)
```

### Lifecycle

1. **Created**: FFmpeg writes segment to disk (~2 second duration)
2. **Indexed**: Added to manifest (m3u8 file)
3. **Served**: Available via `GET /api/hlsstream/<streamId>/segment_XXXX.ts`
4. **Expired**: Removed from manifest after 10 newer segments exist
5. **Deleted**: File removed from disk during automatic cleanup

### Validation Rules

- **sequenceNumber**: Must be monotonically increasing within stream
- **duration**: Must match segment duration configured in stream
- **byteSize**: Must be > 0 and reasonable for configured bitrate
- **filepath**: Must be unique, under stream-specific directory
- **createdAt**: Cannot be in future

---

## Entity: StreamManifest (m3u8)

The HLS playlist file that describes available segments for a stream.

### Format (HLS Specification v3)

```
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

### Key Fields

| Field | Meaning | Value |
|-------|---------|-------|
| `#EXT-X-VERSION` | Spec version | 3 (for compatibility) |
| `#EXT-X-TARGETDURATION` | Max segment duration | 2 (seconds) |
| `#EXT-X-MEDIA-SEQUENCE` | First segment number | Auto-incrementing |
| `#EXT-X-PLAYLIST-TYPE` | Stream type | `EVENT` (live, append-only) |
| `#EXTINF` | Segment duration | 2.0 (seconds) |

### Generation Rules

1. Scan filesystem for segments: `segment_0000.ts` through `segment_NNNN.ts`
2. Keep newest 10 segments (rolling window)
3. Update MEDIA-SEQUENCE to first kept segment
4. List all segments with EXTINF duration marker
5. Do NOT include #EXT-X-ENDLIST (live stream, no end)

### Update Frequency

- Generated on **every manifest request** (no caching)
- Added segments appear in manifest ~2-3 seconds after creation
- Removed segments disappear from manifest immediately

### Example Response

```
Content-Type: application/vnd.apple.mpegurl
Cache-Control: no-cache, no-store, must-revalidate
Content-Length: 345

#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:32
#EXT-X-PLAYLIST-TYPE:EVENT
#EXTINF:2.0,
segment_0032.ts
[... 8 more segments ...]
#EXTINF:2.0,
segment_0041.ts
```

---

## Relationships & Constraints

### One-to-Many: Camera → Streams

- One camera can have **at most 1 active stream** at a time
- Previous streams can be stopped to free the camera
- When camera is in-use, `CameraDevice.status = "in-use"`

### One-to-Many: Stream → Segments

- One stream produces many segments (1 every 2 seconds)
- Segments belong to exactly one stream
- When stream stops, segments are deleted

### Cardinality

```
┌──────────────┐      ┌─────────────┐      ┌─────────────────┐
│ CameraDevice │ 1 ──→ │   Stream    │ 1 ──→ │  HLSSegment     │
│ (cameras)    │    0.1│ (active)    │    0.N│ (files)         │
└──────────────┘      └─────────────┘      └─────────────────┘
                             │
                             │ 1
                             ├──→ StreamManifest
                             │    (m3u8 file)
```

---

## State Machine: Stream Lifecycle

```
START (POST /api/streams?cameraId=X)
  ↓
[NEW: status=starting]
  ├─ Create stream record with UUID
  ├─ Validate camera is available
  ├─ Create /public/hls/<streamId>/ directory
  └─ Spawn FFmpeg process
  ↓
[ACTIVE: status=active]
  ├─ FFmpeg encoding → segments written every 2s
  ├─ Manifest file updated with latest segments
  ├─ Can accept PAUSE (pause playback, not stream)
  └─ Can accept STOP request
  ↓
STOP (DELETE /api/streams/<streamId>)
  │
  ├─ [STOPPING: status=stopping]
  │  ├─ Send SIGTERM to FFmpeg
  │  ├─ Wait up to 10 seconds for graceful shutdown
  │  └─ Force SIGKILL if not responsive
  │
  └─ [STOPPED: status=stopped]
     ├─ Delete all .ts and .m3u8 files
     ├─ Release camera resource
     ├─ Record final metadata (uptime, bytes encoded, etc.)
     └─ Clean stream from registry

ERROR (any point)
  ├─ FFmpeg crash
  ├─ Camera disconnected
  ├─ Disk full
  └─ [ERROR: status=error]
     ├─ Record error message
     ├─ Kill FFmpeg if still running
     └─ Mark for cleanup
```

---

## Storage & Persistence

### In-Memory State

Tracked in `StreamManager` registry:
- Active streams (status, process IDs, metadata)
- Camera availability
- Current segment counts

**Persistence**: None (lost on restart) - acceptable for MVP

### File-Based Storage

```
./public/hls/
├── stream-abc123/
│   ├── segment_0000.ts
│   ├── segment_0001.ts
│   └── manifest.m3u8
├── stream-def456/
│   ├── segment_0000.ts
│   ├── segment_0001.ts
│   ├── segment_0002.ts
│   └── manifest.m3u8
```

- Segments written by FFmpeg automatically
- Manifest generated on-demand by GET endpoint
- Old segments auto-deleted by FFmpeg (hls_flags delete_segments)
- **Total disk usage per stream**: ~20-30MB (2500 kbps × 120 seconds typical)

---

## Data Validation & Constraints

### Camera Discovery

```typescript
// Enumeration happens on startup + periodically
// Validates each device can be accessed
cameras = await enumerateCameras(); // Uses ffmpeg -f dshow -list_devices

cameras.forEach(cam => {
  if (!canAccessCamera(cam.id)) {
    cam.status = 'disconnected';
  }
});
```

### Stream Creation Validation

```
1. Camera exists and status == 'available'
2. No other stream exists for this camera
3. Resolution/bitrate within camera capabilities
4. Disk space available (> 500MB)
5. FFmpeg executable found and working
```

### Segment Validation

```
1. File exists and is readable
2. Duration matches stream.segmentDuration (±100ms tolerance)
3. Filesize matches expected bitrate (±10% tolerance)
4. Sequence number is monotonic
5. No gaps in sequence numbers within manifest
```

---

## API Response Examples

### GET /api/cameras

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
          { "width": 1280, "height": 720, "fps": [30] }
        ],
        "defaultResolution": { "width": 1280, "height": 720, "fps": 30 }
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

### POST /api/streams (success)

```json
{
  "stream": {
    "id": "stream-a1b2c3d4e5f6",
    "cameraId": "camera-001",
    "status": "starting",
    "startTime": "2026-01-29T10:30:00.000Z",
    "hlsUrl": "/api/hlsstream/stream-a1b2c3d4e5f6/manifest.m3u8",
    "resolution": { "width": 1280, "height": 720 },
    "bitrate": 2500
  }
}
```

### POST /api/streams (error - camera in use)

```json
{
  "error": "Camera already in use by stream stream-xyz789",
  "code": "CAMERA_IN_USE"
}
```

---

## Summary Table

| Entity | Count | Lifetime | Update Freq | Storage |
|--------|-------|----------|------------|---------|
| CameraDevice | 1-10 | Persistent | On change | Memory |
| Stream | 0-4 | Minutes | Per request | Memory |
| HLSSegment | 0-15 per stream | ~30s | Every 2s | Disk |
| Manifest | 1 per stream | ~30s | Every 2s | Disk |

Total typical footprint:
- Memory: ~10MB (metadata only)
- Disk per stream: ~20-30MB
- 4 concurrent streams: ~100-120MB disk

