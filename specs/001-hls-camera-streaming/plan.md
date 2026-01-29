# Implementation Plan: HLS Camera Streaming Server

**Branch**: `001-hls-camera-streaming` | **Date**: January 29, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-hls-camera-streaming/spec.md`

## Summary

Build a real-time HLS video streaming server that captures webcam input and makes it playable in standard browsers. The system will detect available cameras, manage multiple concurrent streams via REST API, and provide a web-based UI for all operations. Uses Next.js for the full-stack application (backend API + frontend UI) with FFmpeg for video encoding/transcoding to HLS format.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+), JavaScript (React 18+)  
**Primary Dependencies**: 
  - Next.js 14+ (full-stack framework - API routes + React frontend)
  - FFmpeg (video encoding/transcoding to HLS)
  - node-webrtc or similar (camera access via browser APIs)
  - hls.js (browser-side HLS playback)
  - TypeScript 5+

**Storage**: File-based (local disk for HLS segments .ts files and m3u8 manifests)  
**Testing**: Jest (unit), Playwright/Cypress (integration/E2E)  
**Target Platform**: Node.js server (Windows/Mac/Linux) + modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web (monorepo style: backend API in Next.js API routes + React frontend in same project)  
**Performance Goals**: 
  - Capture and encode to HLS within 2 seconds of stream start
  - Support at least 2 concurrent streams with <500ms latency
  - HLS segments generated every ~2 seconds
  - Maintain 60 fps capture if camera supports, with reasonable bitrate (2-5 Mbps adaptive)

**Constraints**: 
  - <2 second startup time for stream
  - <5 second initial playback delay in browser
  - Automatic HLS buffer management (keep ~30 seconds of segments)
  - Graceful camera disconnection handling

**Scale/Scope**: 
  - Single machine operation (cameras on same host or local network)
  - Support 2-4 concurrent streams
  - ~5000 LOC for MVP (backend) + 3000 LOC (frontend)
  - ~20 UI screens/components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - No violations detected

**Rationale**:
- Single monorepo project combining backend (API routes) and frontend (React) - acceptable for integrated service
- No external databases needed (file-based segment storage)
- Clear separation of concerns: camera capture → HLS encoding → manifest generation → browser playback
- Straightforward technical stack with proven libraries
- No architectural complexities requiring additional justification

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js Web Application (Frontend + Backend API combined)

app/
├── api/
│   ├── cameras/                    # GET /api/cameras - list available cameras
│   │   ├── route.ts
│   │   └── [id].ts
│   ├── streams/                    # Stream lifecycle management
│   │   ├── route.ts               # GET (list), POST (start stream)
│   │   └── [streamId].ts          # GET (info), DELETE (stop stream)
│   ├── health/
│   │   └── route.ts               # Health check endpoint
│   └── hlsstream/                 # Serve HLS segments and manifests
│       ├── [streamId]/
│       │   ├── route.ts           # Serve m3u8 manifest
│       │   └── [segmentFile].ts   # Serve .ts video segments
│
├── components/
│   ├── StreamList.tsx              # Display all active streams
│   ├── StreamPlayer.tsx            # HLS video player component
│   ├── CameraSelector.tsx          # Camera selection UI
│   ├── StreamControls.tsx          # Start/stop controls
│   ├── StreamDetails.tsx           # Stream info display
│   └── Dashboard.tsx               # Main dashboard layout
│
├── pages/                          # or use app router pages
│   ├── index.tsx                   # Main dashboard page
│   ├── stream/
│   │   └── [streamId].tsx         # Individual stream view (optional)
│   └── _app.tsx
│
├── lib/
│   ├── hls/
│   │   ├── hlsManager.ts          # HLS segment/manifest generation
│   │   └── segmentWriter.ts       # Write .ts and m3u8 files
│   ├── camera/
│   │   ├── cameraManager.ts       # Detect, enumerate cameras
│   │   └── videoCapture.ts        # Webcam capture via native module
│   ├── ffmpeg/
│   │   ├── ffmpegWorker.ts        # FFmpeg encoding process wrapper
│   │   ├── transcodeConfig.ts     # HLS encoding parameters
│   │   └── streamProcess.ts       # Manage ffmpeg child process
│   ├── stream/
│   │   ├── streamManager.ts       # Coordinate camera → capture → encode → HLS
│   │   └── streamRegistry.ts      # In-memory stream state store
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   └── utils/
│       ├── uuid.ts                # Generate stream IDs
│       └── logging.ts             # Structured logging
│
├── public/
│   └── hls/                        # HLS segments storage (manifests + .ts files)
│       └── [streamId]/
│           ├── manifest.m3u8      # Generated dynamically
│           └── segment_*.ts       # Video segments
│
├── styles/
│   └── globals.css
│
├── hooks/
│   ├── useStreamList.ts           # Fetch and manage active streams
│   └── useHLSPlayer.ts            # Video player integration
│
└── tests/
    ├── unit/
    │   ├── ffmpeg.test.ts
    │   ├── camera.test.ts
    │   └── stream.test.ts
    ├── integration/
    │   ├── api.test.ts
    │   └── capture-encode.test.ts
    └── e2e/
        └── streaming.spec.ts       # Full user flow tests

package.json
tsconfig.json
next.config.js
jest.config.js
.env.example
```

**Structure Decision**: Single Next.js monorepo with:
- Backend: API routes in `/app/api/` for stream control and HLS serving
- Frontend: React components in `/app/components/` and pages in `/app/pages/`
- Utilities: Shared TypeScript libraries for camera, FFmpeg, HLS management
- Storage: HLS segments/manifests served from `/public/hls/` directory
- This integrates the full application stack in one repository for easier development and deployment

## Complexity Tracking

> **No violations to justify** - Technical stack is straightforward and appropriate for the feature scope

| Component | Complexity Justification |
|-----------|--------------------------|
| FFmpeg integration | Essential for real-time video encoding to HLS - no simpler alternative exists |
| HLS manifest generation | Required by HLS spec - automatic file-based approach simpler than external streaming CDN |
| Concurrent stream management | Multiple cameras need parallel processing - necessary for feature requirement FR-012 |
| Browser-based playback | User requirement to avoid external tools - hls.js library simplifies browser implementation |
