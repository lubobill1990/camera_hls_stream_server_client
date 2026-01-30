# Tasks: HLS Camera Streaming Server

**Input**: Design documents from `/specs/001-hls-camera-streaming/`
**Prerequisites**: 
- ✅ plan.md (Hono backend + Vite/React frontend)
- ✅ spec.md (7 user stories: 5 P1, 2 P2)
- ✅ data-model.md (CameraDevice, Stream, HLSSegment, StreamManifest)
- ✅ contracts/api.md (8 REST endpoints)

**Tests**: OPTIONAL - not explicitly requested in specification

**Organization**: Tasks grouped by user story to enable independent implementation and testing

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US7) from spec.md
- Paths follow plan.md structure: `server/` (Hono), `web/` (Vite/React)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Hono backend and Vite/React frontend projects

**Duration**: 1-2 hours

### Backend Setup (server/)

- [X] T001 Create `server/` directory and run `npm init -y`
- [X] T002 [P] Install Hono: `npm install hono @hono/node-server`
- [X] T003 [P] Install dev dependencies: `npm install -D typescript tsx vitest @types/node`
- [X] T004 [P] Install utilities: `npm install uuid && npm install -D @types/uuid`
- [X] T005 Create `server/tsconfig.json` with strict mode, ESM, NodeNext resolution
- [X] T006 Create `server/src/index.ts` with Hono app skeleton and health endpoint
- [X] T007 [P] Create `server/.env.example` with PORT, FFMPEG_PATH, HLS_OUTPUT_DIR
- [X] T008 [P] Add scripts in `server/package.json`: dev (tsx watch), build, start

### Frontend Setup (web/)

- [X] T009 Create Vite React project: `npm create vite@latest web -- --template react-ts`
- [X] T010 [P] Install Tailwind: `npm install -D tailwindcss postcss autoprefixer`
- [X] T011 [P] Install dependencies: `npm install hls.js @tanstack/react-query`
- [X] T012 Create `web/tailwind.config.js` and `web/postcss.config.js`
- [X] T013 [P] Add Tailwind directives to `web/src/index.css`
- [X] T014 [P] Configure API proxy in `web/vite.config.ts` (forward /api to localhost:3001)

### Shared Setup

- [X] T015 Create root `README.md` with setup instructions for both projects
- [X] T016 [P] Create root `.gitignore` for node_modules, dist, server/public/hls/*

**Checkpoint**: `npm run dev` works in both server/ (port 3001) and web/ (port 5173) - **REQUIRED BEFORE PHASE 2**

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**Duration**: 2-3 hours

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [X] T017 Create `server/src/lib/types/index.ts` with all TypeScript interfaces:
  - CameraDevice, CameraCapabilities, CameraStatus enum
  - Stream, StreamStatus enum, HLSSegment, StreamManifest
  - API request/response types per contracts/api.md

### Camera Management

- [X] T018 Create `server/src/lib/camera/cameraManager.ts` with:
  - `discoverCameras()`: Run FFmpeg -list_devices and parse output
  - `getCameras()`: Return camera list with current status
  - `getCameraById(id)`: Get single camera
  - `reserveCamera(id)` / `releaseCamera(id)`: Track camera usage
- [X] T019 [P] Create `server/src/lib/camera/platformHelpers.ts`:
  - `getFFmpegDeviceArgs(platform)`: Windows dshow, macOS avfoundation, Linux v4l2
  - `parseDeviceList(output, platform)`: Parse FFmpeg output to CameraDevice[]

### FFmpeg Integration

- [X] T020 Create `server/src/lib/ffmpeg/ffmpegWorker.ts` with:
  - `spawnFFmpeg(cameraId, streamId, options)`: Start FFmpeg child process
  - `killFFmpeg(process, timeout)`: Graceful shutdown with 10s timeout
  - Event handling for stdout/stderr
- [X] T021 [P] Create `server/src/lib/ffmpeg/transcodeConfig.ts` with:
  - `buildFFmpegArgs(camera, stream, outputDir)`: Generate full FFmpeg command
  - Default config: ultrafast preset, 2500 kbps, 720p, 2-sec segments, 10 segment window

### Stream Registry

- [X] T022 Create `server/src/lib/stream/streamRegistry.ts`:
  - In-memory Map<streamId, Stream> store
  - `register(stream)`, `get(id)`, `update(id, partial)`, `remove(id)`, `getAll()`
  - Status transition validation (starting → active → stopping → stopped)

### HLS Utilities

- [X] T023 Create `server/src/lib/hls/hlsManager.ts` with:
  - `createStreamDir(streamId)`: Create server/public/hls/{streamId}/
  - `cleanupStreamDir(streamId)`: Delete directory and contents
  - `listSegments(streamId)`: Get .ts files with metadata
  - `generateManifest(streamId)`: Build m3u8 content from segments
- [X] T024 [P] Create `server/src/lib/utils/uuid.ts`:
  - `generateStreamId()`: Return UUID v4 prefixed with "stream-"

### Middleware

- [X] T025 [P] Create `server/src/middleware/cors.ts`:
  - CORS middleware allowing localhost origins for dev

### Logging

- [X] T026 [P] Create `server/src/lib/utils/logging.ts`:
  - Structured logger with timestamp, level, context
  - Log FFmpeg events, API requests, errors

**Checkpoint**: Foundation complete - `GET /api/cameras` returns camera list, FFmpeg can spawn - **USER STORY IMPLEMENTATION CAN BEGIN**

---

## Phase 3: User Story 1 - Browse and Select Available Cameras (P1) 🎯

**Goal**: Users can see all cameras connected to the server and select one

**Independent Test**: Open dashboard → see camera list with names → select a camera

**Acceptance**: FR-001, SC-010 (1s load time)

### Backend (US1)

- [X] T027 [US1] Create `server/src/routes/cameras.ts`:
  - GET /cameras handler → call cameraManager.getCameras()
  - Return `{ cameras: CameraDevice[] }`
  - Error handling: 500 if enumeration fails
- [X] T028 [P] [US1] Register cameras route in `server/src/index.ts`

### Frontend (US1)

- [X] T029 [P] [US1] Create `web/src/lib/api.ts`:
  - Base fetch wrapper with error handling
  - `getCameras(): Promise<CameraDevice[]>`
- [X] T030 [P] [US1] Create `web/src/lib/types.ts`:
  - Mirror CameraDevice, Stream, etc. from server types
- [X] T031 [P] [US1] Create `web/src/hooks/useCameras.ts`:
  - React Query hook fetching /api/cameras
  - Return { cameras, isLoading, error, refetch }
- [X] T032 [P] [US1] Create `web/src/components/CameraSelector.tsx`:
  - Dropdown/list of cameras from useCameras
  - Display camera name and type badge (builtin/usb)
  - "No cameras available" empty state
  - onSelect(camera) callback
- [X] T033 [P] [US1] Create `web/src/components/Dashboard.tsx`:
  - Main layout with header "HLS Camera Streaming"
  - Render CameraSelector
  - Manage selectedCamera state

**Checkpoint**: Users open dashboard, see camera list, can select camera - **US1 COMPLETE**

---

## Phase 3: User Story 2 - Start Live Streaming from Webcam (P1) 🎯

**Goal**: Users can start capture and get HLS URL within 2 seconds

**Independent Test**: Select camera → click "Start" → see HLS URL and "active" status

**Acceptance**: FR-002, FR-003, FR-004, SC-001 (3 clicks), SC-002 (2s URL)

### Backend (US2)

- [X] T034 [US2] Create `server/src/lib/stream/streamManager.ts`:
  - `startStream(cameraId, options)`: Orchestrate full stream startup
    - Validate camera available
    - Reserve camera
    - Create HLS directory
    - Spawn FFmpeg
    - Register stream with 'starting' status
    - Wait for first segment → update to 'active'
    - Return Stream object
  - `stopStream(streamId)`: Kill FFmpeg, release camera, cleanup
- [X] T035 [US2] Create `server/src/routes/streams.ts`:
  - POST /streams: Start new stream (cameraId, bitrate?, resolution?, frameRate?)
  - GET /streams: List all active streams
  - GET /streams/:id: Get single stream details
  - DELETE /streams/:id: Stop stream
  - Error responses per contracts/api.md (409, 400, 404, 500)
- [X] T036 [P] [US2] Register streams route in `server/src/index.ts`

### Frontend (US2)

- [X] T037 [P] [US2] Add to `web/src/lib/api.ts`:
  - `startStream(cameraId, options?): Promise<Stream>`
  - `getStreams(): Promise<Stream[]>`
  - `getStream(id): Promise<Stream>`
  - `stopStream(id): Promise<void>`
- [X] T038 [P] [US2] Create `web/src/hooks/useStreams.ts`:
  - React Query mutations for start/stop
  - Query for stream list with 2s polling
  - Optimistic updates
- [X] T039 [P] [US2] Create `web/src/components/StreamStatusBadge.tsx`:
  - Color-coded badge: starting(yellow), active(green), stopping(orange), error(red)
- [X] T040 [P] [US2] Create `web/src/components/StreamControls.tsx`:
  - "Start Streaming" button (disabled if no camera selected)
  - Loading spinner during startup
  - Display HLS URL with copy button when active
  - Uses selectedCamera from Dashboard
- [X] T041 [P] [US2] Update `web/src/components/Dashboard.tsx`:
  - Add StreamControls below CameraSelector
  - Pass selectedCamera and handle stream state

**Checkpoint**: Users start stream, see HLS URL appear - **US1-2 COMPLETE**

---

## Phase 3: User Story 3 - Stop Active Stream (P1) 🎯

**Goal**: Users can stop streaming and free camera

**Independent Test**: Start stream → click "Stop" → stream removed, camera available

**Acceptance**: FR-005

### Frontend (US3)

- [X] T042 [P] [US3] Add to `web/src/components/StreamControls.tsx`:
  - "Stop Streaming" button when stream active
  - Confirmation dialog before stopping
  - Loading state during shutdown
- [X] T043 [P] [US3] Create `web/src/components/ui/ConfirmDialog.tsx`:
  - Reusable confirmation modal
  - Title, message, confirm/cancel buttons

**Checkpoint**: Users can stop streams - **US1-3 COMPLETE**

---

## Phase 3: User Story 4 - View All Active Streams (P1) 🎯

**Goal**: Real-time list of all active streams with details

**Independent Test**: Start 2 streams → see both in list with camera name, status, URL

**Acceptance**: FR-006, FR-012, SC-010

### Frontend (US4)

- [X] T044 [P] [US4] Create `web/src/components/StreamList.tsx`:
  - Table/grid of active streams
  - Columns: Camera, Status, HLS URL, Uptime, Actions
  - Auto-refresh via useStreams hook (2s polling)
  - Empty state: "No active streams"
- [X] T045 [P] [US4] Create `web/src/components/StreamListItem.tsx`:
  - Single stream row with metadata
  - Copy URL button, Stop button, Play button
  - Format uptime as HH:MM:SS
- [X] T046 [P] [US4] Update `web/src/components/Dashboard.tsx`:
  - Add StreamList section below controls

**Checkpoint**: Users see all active streams in real-time - **US1-4 COMPLETE**

---

## Phase 3: User Story 5 - Play Stream in Browser (P1) 🎯

**Goal**: Watch live video in embedded player

**Independent Test**: Start stream → click Play → video plays in browser

**Acceptance**: FR-008, SC-003 (5s playback), SC-008

### Backend (US5)

- [X] T047 [US5] Create `server/src/routes/hls.ts`:
  - GET /hls/:streamId/manifest.m3u8: Serve m3u8 content
    - Content-Type: application/vnd.apple.mpegurl
    - Cache-Control: no-cache
  - GET /hls/:streamId/:segment: Serve .ts segment file
    - Content-Type: video/mp2t
    - Support Range requests
    - Cache-Control: public, max-age=31536000
- [X] T048 [P] [US5] Register HLS route in `server/src/index.ts`

### Frontend (US5)

- [X] T049 [P] [US5] Create `web/src/hooks/useHLSPlayer.ts`:
  - Initialize hls.js with video element ref
  - Handle MANIFEST_PARSED, ERROR events
  - Auto-play when ready
  - Cleanup on unmount
- [X] T050 [P] [US5] Create `web/src/components/StreamPlayer.tsx`:
  - HTML5 video element
  - Use hls.js for HLS playback
  - Native controls (play/pause/volume)
  - Error overlay for playback issues
- [X] T051 [P] [US5] Create `web/src/components/StreamPlayerModal.tsx`:
  - Modal wrapper for full-size player
  - Close button (ESC key)
  - Stream info overlay (camera name, uptime)
- [X] T052 [P] [US5] Add Play button to `web/src/components/StreamListItem.tsx`:
  - Opens StreamPlayerModal with stream URL

**Checkpoint**: Users can click Play and watch video - **US1-5 COMPLETE (MVP)**

---

## Phase 4: User Story 6 - Seek and Playback Control (P2)

**Goal**: Pause, seek, speed control for DVR-style playback

**Independent Test**: Stream 20s → pause → seek backward → resume from earlier position

**Acceptance**: FR-009, FR-010, SC-005 (1s seek)

### Frontend (US6)

- [X] T053 [P] [US6] Enhance `web/src/components/StreamPlayer.tsx`:
  - Progress bar showing current position in DVR window
  - Time display: current / available duration
  - Click-to-seek functionality
- [X] T054 [P] [US6] Enhance `web/src/hooks/useHLSPlayer.ts`:
  - Track current time and DVR range
  - `seekTo(seconds)`: Validate and seek within buffer
  - Handle seek beyond available segments
- [X] T055 [P] [US6] Add playback speed control to StreamPlayer:
  - Dropdown: 0.5x, 1x, 1.5x, 2x
  - Update video.playbackRate

**Checkpoint**: Users can seek and control playback - **US1-6 COMPLETE**

---

## Phase 4: User Story 7 - Stream Information (P2)

**Goal**: View detailed stream metadata with copyable URL

**Independent Test**: Start stream → click "Details" → see all metadata

**Acceptance**: FR-014

### Frontend (US7)

- [X] T056 [P] [US7] Create `web/src/components/StreamDetailsModal.tsx`:
  - Display: Stream ID, Camera Name, Status, Start Time, Uptime
  - Resolution, Bitrate, Frame Rate, Segment Count
  - HLS URL with copy button
- [X] T057 [P] [US7] Create `web/src/components/CopyableField.tsx`:
  - Read-only text input with copy icon
  - Toast on successful copy
- [X] T058 [P] [US7] Create `web/src/lib/formatters.ts`:
  - `formatUptime(seconds)`: → "01:23:45"
  - `formatBytes(bytes)`: → "125.5 MB"
  - `formatTimestamp(iso)`: → "Jan 29, 10:30 AM"
- [X] T059 [P] [US7] Add "Details" button to `web/src/components/StreamListItem.tsx`:
  - Opens StreamDetailsModal

**Checkpoint**: Users can view comprehensive stream info - **US1-7 COMPLETE**

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, UX polish, robustness

**Duration**: 2-3 hours

### Error Handling

- [X] T060 Enhance `server/src/lib/stream/streamManager.ts`:
  - Monitor FFmpeg stderr for errors
  - Detect camera disconnect within 5 seconds (FR-015)
  - Update stream status to 'error' with message
  - Auto-cleanup on failure
- [X] T061 [P] Add parameter validation in `server/src/routes/streams.ts`:
  - Bitrate: 500-8000 kbps
  - FrameRate: 1-60 fps
  - Return 400 with detailed error message
- [X] T062 [P] Add disk space check before starting stream:
  - Warn if < 500MB available
  - Return 507 Insufficient Storage

### UI Polish

- [X] T063 [P] Create `web/src/components/ui/Toast.tsx`:
  - Toast notification system
  - Success (green), Error (red), Info (blue) variants
- [X] T064 [P] Create `web/src/components/ui/Spinner.tsx`:
  - Reusable loading spinner
- [X] T065 [P] Add loading states across all components:
  - Camera list loading
  - Stream starting/stopping
  - Player loading
- [X] T066 [P] Add responsive design in `web/src/index.css`:
  - Mobile-friendly layout
  - Touch-friendly buttons

### Health & Monitoring

- [X] T067 [P] Enhance `server/src/routes/health.ts`:
  - Check FFmpeg availability
  - Report active stream count
  - Report disk usage for HLS directory

### Stability

- [X] T068 [P] Add graceful shutdown to `server/src/index.ts`:
  - Handle SIGTERM/SIGINT
  - Stop all active streams cleanly
  - Wait for FFmpeg processes to exit

**Checkpoint**: Robust application with good error handling and UX

---

## Phase 6: Documentation & Deployment (Final)

**Purpose**: Documentation, containerization

**Duration**: 1-2 hours

- [X] T069 [P] Add JSDoc comments to all public functions in server/src/
- [X] T070 [P] Update root `README.md` with:
  - Prerequisites (Node.js, FFmpeg)
  - Setup instructions
  - API documentation summary
  - Troubleshooting guide
- [X] T071 [P] Document environment variables in `server/.env.example`
- [X] T072 Create `server/Dockerfile` for backend container
- [X] T073 [P] Create `web/Dockerfile` for frontend container
- [X] T074 [P] Create root `docker-compose.yml` for full stack

**Checkpoint**: Documented and deployable application

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    ↓
Phase 3-4 (User Stories) ← Can run in parallel per story
    ↓
Phase 5 (Polish) ← Affects all stories
    ↓
Phase 6 (Docs)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Cameras) | Phase 2 | - |
| US2 (Start) | Phase 2 | US1 |
| US3 (Stop) | US2 (needs stream) | - |
| US4 (List) | US2 (needs streams to list) | US3 |
| US5 (Play) | US2 (needs HLS URL) | US3, US4 |
| US6 (Seek) | US5 (needs player) | US7 |
| US7 (Details) | US4 (needs list) | US6 |

### Parallel Execution Example

With 2 developers after Phase 2:

```
Developer A: US1 → US2 → US5 → US6
Developer B: (wait for US2) → US3 → US4 → US7
```

---

## Summary

| Phase | Tasks | Purpose | Duration |
|-------|-------|---------|----------|
| Phase 1 | T001-T016 (16) | Setup | 1-2h |
| Phase 2 | T017-T026 (10) | Foundation | 2-3h |
| Phase 3 (US1-5) | T027-T052 (26) | MVP Features | 4-5h |
| Phase 4 (US6-7) | T053-T059 (7) | Enhancements | 1-2h |
| Phase 5 | T060-T068 (9) | Polish | 2-3h |
| Phase 6 | T069-T074 (6) | Docs/Deploy | 1-2h |
| **TOTAL** | **74 tasks** | | **11-17h** |

### MVP Scope

**Phases 1-3 = MVP** (52 tasks, ~7-10h):
- ✅ US1: Browse cameras
- ✅ US2: Start streaming
- ✅ US3: Stop streaming
- ✅ US4: View stream list
- ✅ US5: Play in browser

### Success Criteria Coverage

| Criteria | Tasks |
|----------|-------|
| SC-001: 3 clicks | T032, T040 |
| SC-002: 2s URL | T034 |
| SC-003: 5s playback | T049, T050 |
| SC-004: 2 concurrent | T022, T018 |
| SC-005: 1s seek | T054 |
| SC-006: UI responsive | T065, T066 |
| SC-007: 1h runtime | T060, T068 |
| SC-008: Browser ops | T050, T051 |
| SC-009: 90% success | T060, T061 |
| SC-010: 1s load | T031, T038 |
