# Implementation Plan: HLS Camera Streaming Server

**Branch**: `001-hls-camera-streaming` | **Date**: January 29, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-hls-camera-streaming/spec.md`

## Summary

Build a real-time HLS video streaming server that captures webcam input via FFmpeg on the backend and makes it playable in standard browsers. The system will detect available cameras, manage multiple concurrent streams via REST API, and provide a web-based UI for all operations. Uses **Hono** for the backend API server and **Vite + React + Tailwind CSS** for the frontend SPA.

## Technical Context

**Architecture**: Separate backend and frontend projects

### Backend (Hono API Server)
**Language/Version**: TypeScript 5+, Node.js 18+  
**Framework**: Hono 4+ (lightweight, fast HTTP framework)  
**Primary Dependencies**: 
  - Hono (REST API framework)
  - @hono/node-server (Node.js adapter)
  - FFmpeg (video encoding via child process)
  - uuid (stream ID generation)

### Frontend (Vite React SPA)
**Language/Version**: TypeScript 5+, React 18+  
**Framework**: Vite 5+ (build tool and dev server)  
**Primary Dependencies**: 
  - React 18+ (UI framework)
  - Tailwind CSS 3+ (styling)
  - hls.js 1.4+ (browser-side HLS playback)
  - @tanstack/react-query (data fetching)

**Camera Access**: Server-side only via FFmpeg (no browser WebRTC)  
**Storage**: File-based (local disk for HLS segments .ts files and m3u8 manifests)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Node.js server (Windows/Mac/Linux) + modern browsers  
**Project Type**: Web (separate backend + frontend directories)  
**Performance Goals**: 
  - Capture and encode to HLS within 2 seconds of stream start
  - Support at least 2 concurrent streams with <500ms encode-to-manifest latency
  - HLS segments generated every ~2 seconds
  - Maintain ≥99% frame delivery rate, minimum 720p@25fps

**Constraints**: 
  - <2 second startup time for stream
  - <5 second initial playback delay in browser
  - Automatic HLS buffer management (keep ~30 seconds of segments)
  - Camera disconnection detection within 5 seconds

**Scale/Scope**: 
  - Single machine operation (cameras connected to server host)
  - Support 2-4 concurrent streams
  - ~3000 LOC backend + ~2500 LOC frontend
  - ~15 React components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - No violations detected

**Rationale**:
- Clean separation: Hono backend (REST API + FFmpeg) + Vite frontend (React SPA)
- No external databases needed (file-based segment storage + in-memory registry)
- Clear separation of concerns: FFmpeg capture → HLS encoding → browser playback
- Lightweight stack: Hono is minimal/fast, Vite provides excellent DX
- Camera access is server-side only (FFmpeg) - simpler than WebRTC

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Separate Backend + Frontend Architecture

├── server/                         # Hono Backend (Node.js)
│   ├── src/
│   │   ├── index.ts               # Hono app entry point
│   │   ├── routes/
│   │   │   ├── cameras.ts         # GET /api/cameras
│   │   │   ├── streams.ts         # POST/GET/DELETE /api/streams
│   │   │   ├── hls.ts             # Serve m3u8 and .ts segments
│   │   │   └── health.ts          # GET /api/health
│   │   ├── lib/
│   │   │   ├── camera/
│   │   │   │   ├── cameraManager.ts    # Detect, enumerate cameras via FFmpeg
│   │   │   │   └── platformHelpers.ts  # OS-specific device detection
│   │   │   ├── ffmpeg/
│   │   │   │   ├── ffmpegWorker.ts     # FFmpeg child process wrapper
│   │   │   │   └── transcodeConfig.ts  # HLS encoding parameters
│   │   │   ├── stream/
│   │   │   │   ├── streamManager.ts    # Orchestrate camera → FFmpeg → HLS
│   │   │   │   └── streamRegistry.ts   # In-memory stream state store
│   │   │   ├── hls/
│   │   │   │   ├── hlsManager.ts       # Manifest generation, segment cleanup
│   │   │   │   └── segmentWriter.ts    # File I/O for .ts and m3u8
│   │   │   ├── types/
│   │   │   │   └── index.ts            # Shared TypeScript interfaces
│   │   │   └── utils/
│   │   │       ├── uuid.ts             # Stream ID generation
│   │   │       └── logging.ts          # Structured logging
│   │   └── middleware/
│   │       └── cors.ts                 # CORS for frontend access
│   ├── public/
│   │   └── hls/                        # HLS segments storage
│   │       └── [streamId]/
│   │           ├── manifest.m3u8
│   │           └── segment_*.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── camera.test.ts
│   │   │   ├── ffmpeg.test.ts
│   │   │   └── stream.test.ts
│   │   └── integration/
│   │       └── api.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env.example
│
├── web/                            # Vite + React Frontend
│   ├── src/
│   │   ├── main.tsx               # React app entry
│   │   ├── App.tsx                # Root component with routing
│   │   ├── components/
│   │   │   ├── Dashboard.tsx      # Main dashboard layout
│   │   │   ├── CameraSelector.tsx # Camera dropdown
│   │   │   ├── StreamControls.tsx # Start/stop buttons
│   │   │   ├── StreamList.tsx     # Active streams list
│   │   │   ├── StreamPlayer.tsx   # HLS video player (hls.js)
│   │   │   ├── StreamDetails.tsx  # Stream info modal
│   │   │   └── ui/                # Reusable UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       └── Toast.tsx
│   │   ├── hooks/
│   │   │   ├── useCameras.ts      # Fetch camera list
│   │   │   ├── useStreams.ts      # Stream CRUD operations
│   │   │   └── useHLSPlayer.ts    # hls.js integration
│   │   ├── lib/
│   │   │   ├── api.ts             # API client (fetch wrapper)
│   │   │   └── types.ts           # Shared types (mirror server types)
│   │   └── styles/
│   │       └── globals.css        # Tailwind imports
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── tsconfig.json
│
├── tests/
│   └── e2e/
│       └── streaming.spec.ts      # Playwright E2E tests
│
└── README.md
```

**Structure Decision**: Separate backend and frontend with:
- **Backend (server/)**: Hono API server with FFmpeg integration for camera capture
- **Frontend (web/)**: Vite + React SPA with Tailwind CSS for styling
- **Communication**: REST API over HTTP, CORS enabled for local development
- **HLS Serving**: Backend serves .m3u8 and .ts files from `server/public/hls/`

## Complexity Tracking

> **No violations to justify** - Technical stack is straightforward and appropriate for the feature scope

| Component | Complexity Justification |
|-----------|--------------------------|
| FFmpeg integration | Essential for real-time video encoding to HLS - no simpler alternative exists |
| HLS manifest generation | Required by HLS spec - automatic file-based approach simpler than external streaming CDN |
| Concurrent stream management | Multiple cameras need parallel processing - necessary for feature requirement FR-012 |
| Browser-based playback | User requirement to avoid external tools - hls.js library simplifies browser implementation |
| Separate backend/frontend | Clean architecture separation, independent scaling and deployment |
