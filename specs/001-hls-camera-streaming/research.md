# Research Findings: HLS Camera Streaming

**Feature**: HLS Camera Streaming Server  
**Date**: January 29, 2026  
**Status**: Phase 0 Complete

## Research Summary

This document consolidates investigation into key technical decisions for the HLS streaming system using Next.js and FFmpeg.

---

## 1. Camera Access on Node.js

### Decision: FFmpeg Device Input + Native Node.js Wrapper

**Approach**:
- Use FFmpeg's native device input capabilities to directly capture from cameras
- On Windows: `-f dshow` (DirectShow) to enumerate and capture from devices
- On macOS: `-f avfoundation` for camera access
- On Linux: `-f v4l2` (Video4Linux2) for USB cameras
- Create a Node.js wrapper (library) that spawns FFmpeg child process with appropriate device input

**Why This**:
- FFmpeg already handles OS-specific device enumeration and camera I/O
- Avoids complex native module compilation (no gyp/node-gyp required)
- Cross-platform support built into FFmpeg
- Single source handles both camera capture AND HLS encoding

**Alternatives Rejected**:
- `node-webcam` library: Limited to serving snapshots, not continuous stream
- Direct Windows Media Foundation: Windows-only, requires complex C++ bindings
- `SimpleWebRTC` / getUserMedia: Browser-only, doesn't work in Node.js backend

### Implementation Details

```bash
# Windows camera enumeration
ffmpeg -f dshow -list_devices true -i dummy

# Capture from first camera to HLS
ffmpeg -f dshow -i video="Camera Name" -c:v libx264 -preset ultrafast \
  -b:v 2500k -f hls -hls_time 2 -hls_list_size 10 output.m3u8

# macOS
ffmpeg -f avfoundation -i ":0" ...

# Linux
ffmpeg -f v4l2 -i /dev/video0 ...
```

---

## 2. FFmpeg HLS Encoding Strategy

### Decision: Real-Time Encoding with Rolling Buffer

**Configuration**:
- **Codec**: libx264 (H.264) for universal browser support
- **Preset**: ultrafast (prioritize low latency over compression)
- **Target Bitrate**: 2500 kbps (adaptive: 1500-5000 kbps based on resolution)
- **Segment Duration**: 2 seconds (HLS spec recommends 2-10 seconds)
- **Buffer Size**: Keep 10-15 segments (~20-30 seconds of video)
- **Output Format**: HLS with auto-generated m3u8 manifest

**Why This**:
- ultrafast preset minimizes encoding delay to meet <2s startup goal
- H.264 compatible with all browsers (better than VP8/9)
- 2-second segments balance latency vs reliability
- Rolling buffer prevents unbounded disk usage

**Segment Lifecycle**:
1. FFmpeg writes new `.ts` segment every 2 seconds
2. Manifest (m3u8) updated to reference latest 10 segments
3. Segments older than 30 seconds automatically deleted
4. Client requests latest segments on demand

### FFmpeg Command Reference

```bash
ffmpeg \
  -f dshow -i "video=Integrated Camera" \      # Camera input (Windows)
  -c:v libx264 \                               # H.264 codec
  -preset ultrafast \                          # Low latency
  -b:v 2500k \                                 # Bitrate
  -maxrate 5000k -bufsize 10000k \            # Quality control
  -g 60 \                                      # GOP size (keyframe interval)
  -f hls \                                     # HLS output format
  -hls_time 2 \                                # Segment duration
  -hls_list_size 10 \                         # Keep 10 segments
  -hls_flags delete_segments \                 # Auto-delete old segments
  -hls_segment_filename "segment_%03d.ts" \
  output.m3u8
```

---

## 3. HLS.js Browser-Side Integration

### Decision: HLS.js with Live Mode + Adaptive Bitrate

**Configuration**:
- Use `hls.js` library for HLS playback in browsers
- Enable live mode: `ll: true` (low-latency mode)
- Implement DVR (digital video recorder) window for seeking
- Auto-recovery for network errors
- Adaptive bitrate disabled for MVP (fixed bitrate)

**Why This**:
- hls.js is well-maintained, widely used (works in all modern browsers)
- Low-latency mode reduces initial playback delay
- Handles manifest refresh and segment buffering automatically
- Seeking only works within available segment buffer (DVR window)

**Browser Compatibility**:
- Chrome/Edge: Native
- Firefox: Via Media Source Extensions (MSE)
- Safari: Via native HLS support
- Requires modern browser with MSE API

### Implementation Example

```javascript
import Hls from 'hls.js';

const video = document.getElementById('video');
const url = '/api/hlsstream/stream-abc123/manifest.m3u8';

if (Hls.isSupported()) {
  const hls = new Hls({
    debug: false,
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90,
  });
  
  hls.loadSource(url);
  hls.attachMedia(video);
  
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
  });
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  // Safari native HLS support
  video.src = url;
}
```

**Seeking Limitations**:
- Can only seek within available segments (DVR window ~30s)
- Attempting to seek beyond available segments fails gracefully
- Live playback always catches up to live edge after seeking

---

## 4. Next.js API Routes & HLS Serving

### Decision: Hybrid Approach - API Routes for Control, Static Serving for Segments

**Architecture**:
- **API Routes** (`/app/api/`): 
  - Manage streams (start, stop, list)
  - Manage cameras (enumerate, status)
  - Serve m3u8 manifests (dynamic, updated every segment)
  
- **Public Static** (`/public/hls/`):
  - Store `.ts` video segments (read-only after write)
  - Serve via Next.js built-in static serving or CDN

**Why This**:
- Manifests must be dynamic (updated every 2 seconds)
- Segments are immutable once written (perfect for caching)
- Public folder serves files faster than API routes
- Separates control plane (API) from data plane (static files)

**Performance Considerations**:
- Manifest requests: ~10-50ms (small file)
- Segment requests: ~5-20ms (from disk/cache)
- Total playlist fetch + play start: ~500-1000ms
- Meets <5s playback start goal

### Serving Strategy

```typescript
// API Route: GET /api/hlsstream/[streamId]/manifest.m3u8
export async function GET(request, { params }) {
  const { streamId } = params;
  const manifest = await generateManifest(streamId);
  return new Response(manifest, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store', // Force refresh
    },
  });
}

// Public folder serving:
// /public/hls/<streamId>/segment_0000.ts
// Served by Next.js with cache-friendly headers
// Browser/CDN caches aggressively
```

---

## 5. Multi-Stream Concurrent Processing

### Decision: Process Pool with In-Memory Registry

**Design**:
- Each stream gets its own FFmpeg child process
- Maximum concurrent processes: 4 (configurable, limited by CPU/IO)
- In-memory registry tracks all active streams (Map<streamId, StreamState>)
- Graceful shutdown with 10-second timeout for FFmpeg processes

**Why This**:
- FFmpeg processes are heavyweight but isolated (failure doesn't affect others)
- In-memory registry is fast and sufficient (data not persisted)
- Process pool pattern handles resource limits gracefully
- Timeout prevents zombie processes

**Camera Conflict Resolution**:
- First request to use camera gets exclusive access
- Subsequent requests from different stream immediately rejected (409 Conflict)
- If camera disconnects, stream marked as errored
- Automatic cleanup releases camera for reuse

### Implementation Architecture

```typescript
// StreamManager - coordinates multiple FFmpeg processes
class StreamManager {
  private streams = new Map<string, StreamState>();
  private maxConcurrent = 4;
  
  async startStream(cameraId: string): Promise<Stream> {
    // Check camera not in use
    if (this.isCameraInUse(cameraId)) throw new Error('Camera in use');
    
    // Check process limit
    if (this.streams.size >= this.maxConcurrent) {
      throw new Error('Max concurrent streams reached');
    }
    
    // Spawn FFmpeg process
    const streamId = generateUUID();
    const ffmpeg = spawnFFmpeg(cameraId);
    
    this.streams.set(streamId, {
      id: streamId,
      cameraId,
      ffmpegProcess: ffmpeg,
      startTime: Date.now(),
      segmentCount: 0,
    });
    
    return { id: streamId, hlsUrl: `/api/hlsstream/${streamId}/manifest.m3u8` };
  }
  
  async stopStream(streamId: string): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream) throw new Error('Stream not found');
    
    // Kill FFmpeg with timeout
    await killProcess(stream.ffmpegProcess, 10000);
    
    // Clean up files
    await fs.rm(`./public/hls/${streamId}`, { recursive: true });
    
    this.streams.delete(streamId);
  }
}
```

---

## 6. HLS Manifest Generation

### Decision: Dynamic Generation with File-Based Segments

**Manifest Format** (m3u8):
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:8
#EXTINF:2.0,
segment_0008.ts
#EXTINF:2.0,
segment_0009.ts
...
#EXTINF:2.0,
segment_0017.ts
```

**Generation Strategy**:
- Scan `/public/hls/<streamId>/` directory for `.ts` files
- Count segments and derive media sequence number
- Build manifest with last 10 segments
- Update on every request (or cache for 1 second)

**Why This**:
- Simple file-based approach, no database needed
- Manifest always fresh without complex state management
- Segment numbering prevents duplicate/missing segments
- Works well with FFmpeg's segment naming

---

## Dependencies Summary

| Dependency | Version | Purpose | Alternative |
|------------|---------|---------|-------------|
| Next.js | 14+ | Full-stack framework | Hono (user's original choice) |
| FFmpeg | Latest | Video encoding | GStreamer (more complex) |
| hls.js | 1.4+ | Browser HLS player | Video.js + HLS plugin |
| React | 18+ | Frontend framework | Vue, Svelte |
| TypeScript | 5+ | Type safety | JavaScript |
| Jest | Latest | Unit testing | Vitest |
| Playwright | Latest | E2E testing | Cypress |

---

## Open Questions & Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Use Next.js or Hono? | **Next.js 14+** | Better for full-stack (API + React UI), richer ecosystem |
| Where to store segments? | **Disk (`/public/hls/`)** | Simple, no external storage dependency |
| Adaptive bitrate? | **No (fixed 2500kbps MVP)** | Simpler implementation, can add later |
| Recording to permanent storage? | **No (only temporary buffer)** | Out of scope per spec |
| Browser compatibility | **Modern browsers only** | Requires HTML5 video + MSE |

---

## Recommendations

1. **Start with single-camera prototype** to validate FFmpeg integration and HLS serving
2. **Implement in-memory stream registry first** before adding persistence layer
3. **Use FFmpeg CLI (child process)** rather than ffmpeg.js (WASM) - native is faster
4. **Test segment writing/deletion** carefully to avoid disk space issues
5. **Implement health check endpoint** to monitor FFmpeg process status
6. **Add structured logging** for debugging multi-stream scenarios

---

## References

- FFmpeg HLS Encoding: https://trac.ffmpeg.org/wiki/Encode/H.264
- HLS Specification: https://datatracker.ietf.org/doc/html/rfc8216
- hls.js Documentation: https://github.com/video-dev/hls.js/wiki
- Next.js File Serving: https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
