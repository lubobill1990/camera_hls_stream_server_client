# Tasks: HLS Camera Streaming Server

**Input**: Design documents from `/specs/001-hls-camera-streaming/`
**Prerequisites**: 
- ✅ spec.md (7 user stories, 15 functional requirements)
- ✅ plan.md (Hono backend + Vite/React frontend architecture)
- ✅ research.md (6 research topics completed)
- ✅ data-model.md (4 core entities defined)
- ✅ contracts/api.md (8 REST endpoints)
- ✅ quickstart.md (working code template)

**Total Tasks**: 88 tasks across 6 phases
**Estimated Duration**: 70-100 development hours (5-7 days for 1-2 developers)
**Branch**: `001-hls-camera-streaming`

**Architecture**: 
- **Backend**: Hono + TypeScript (server/) - REST API + FFmpeg camera capture
- **Frontend**: Vite + React + Tailwind CSS (web/) - SPA for stream management

---

## Format & Organization

- **[P]**: Task can run in parallel (different files/components, no dependencies)
- **[Story]**: User story reference (US1-US7, maps to spec.md priorities)
- **Checklist Format**: `- [ ] [ID] [P?] [Story?] Description with file path`

**Structure**: Tasks grouped by phase and then by user story, enabling:
- Independent implementation of each story
- Parallel development where dependencies allow
- MVP delivery after Phase 3 (P1 stories)
- Progressive enhancement through Phase 4-5 (P2 stories)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize both backend (Hono) and frontend (Vite/React) projects

**Duration**: 1-2 hours
**Deliverable**: Working dev environments for both server and web projects

### Backend Setup (server/)

- [ ] T001 Create `server/` directory and initialize with `npm init -y`
- [ ] T002 [P] Install Hono dependencies: `hono @hono/node-server`
- [ ] T003 [P] Install dev dependencies: `typescript tsx vitest @types/node`
- [ ] T004 [P] Install utility dependencies: `uuid` and `@types/uuid`
- [ ] T005 Configure `server/tsconfig.json` with strict mode and ESM
- [ ] T006 Create `server/src/index.ts` with basic Hono app skeleton
- [ ] T007 [P] Create `server/.env.example` with FFMPEG_PATH, HLS_DIR, PORT settings
- [ ] T008 [P] Add npm scripts in `server/package.json`: dev, build, start, test

### Frontend Setup (web/)

- [ ] T009 Create Vite React project: `npm create vite@latest web -- --template react-ts`
- [ ] T010 [P] Install Tailwind CSS: `tailwindcss postcss autoprefixer`
- [ ] T011 [P] Install dependencies: `hls.js @tanstack/react-query`
- [ ] T012 Configure `web/tailwind.config.js` and `postcss.config.js`
- [ ] T013 [P] Setup Tailwind in `web/src/styles/globals.css`
- [ ] T014 [P] Configure Vite proxy in `web/vite.config.ts` for API calls to backend

### Shared Setup

- [ ] T015 Create root `README.md` with setup instructions for both projects
- [ ] T016 [P] Create root `.gitignore` for node_modules, dist, public/hls/*
- [ ] T017 [P] Create directory structure: `server/src/lib`, `server/src/routes`, `web/src/components`, `web/src/hooks`

**Checkpoint**: Both `npm run dev` commands work (server on :3001, web on :5173) - **REQUIRED BEFORE PHASE 2**

---

## Phase 2: Foundational Infrastructure (Core Services)

**Purpose**: Implement shared libraries and core logic that all user stories depend on

**Duration**: 2-3 hours
**Deliverable**: Camera manager, FFmpeg wrapper, stream registry, HLS utilities

**⚠️ CRITICAL**: All tasks must complete before user story implementation

### Type Definitions

- [ ] T018 Create TypeScript interfaces in `server/src/lib/types/index.ts`
  - CameraDevice, CameraCapabilities, CameraStatus enums
  - Stream, StreamStatus, HLSSegment, HLSManifest types

### Camera Management Foundation

- [ ] T019 [P] Create `server/src/lib/camera/cameraManager.ts` with:
  - `discoverCameras()`: Enumerate system cameras using FFmpeg -list_devices
  - `getCameras()`: Return current camera list with status
  - `getCameraById(id)`: Get single camera details
- [ ] T020 [P] Create `server/src/lib/camera/platformHelpers.ts` for OS-specific camera enumeration
  - Windows: dshow format detection
  - macOS: avfoundation format detection
  - Linux: v4l2 format detection
- [ ] T021 [P] Implement camera reservation system in cameraManager
  - `reserveCamera(cameraId)`: Check and mark camera in-use
  - `releaseCamera(cameraId)`: Release camera for reuse

### FFmpeg Integration Foundation

- [ ] T022 Create `server/src/lib/ffmpeg/ffmpegWorker.ts` with:
  - `spawnFFmpeg(cameraId, options)`: Spawn FFmpeg child process
  - `killFFmpeg(process, timeout)`: Gracefully kill FFmpeg with 10s timeout
  - Redirect stderr to capture encoding progress and errors
- [ ] T023 [P] Create `server/src/lib/ffmpeg/transcodeConfig.ts` with:
  - `buildFFmpegArgs()`: Generate FFmpeg command-line arguments
  - Configure: ultrafast preset, 2500 kbps, 720p, 2-sec segments
  - Support for platform-specific device input formats

### Stream Registry Foundation

- [ ] T024 Create `server/src/lib/stream/streamRegistry.ts` (in-memory state management)
  - Map<streamId, StreamState> store
  - `registerStream(stream)`, `getStream(id)`, `updateStream(id, partial)`
  - `unregisterStream(id)`, `getAllStreams()`
- [ ] T025 [P] Create error handling utilities in `server/src/lib/utils/logging.ts`
  - Structured logging for FFmpeg events
  - Error event handlers for process failures

### HLS Utilities Foundation

- [ ] T026 Create `server/src/lib/hls/hlsManager.ts` with:
  - `createStreamDirectory(streamId)`: Create `server/public/hls/<streamId>`
  - `cleanupStreamDirectory(streamId)`: Delete all stream files
  - `getAvailableSegments(streamId)`: List current segment files
  - `generateManifest(streamId)`: Build m3u8 content from segments
- [ ] T027 [P] Create `server/src/lib/utils/uuid.ts`
  - `generateStreamId()`: Create unique stream identifiers (UUID v4)

### Unit Tests (OPTIONAL for MVP)

- [ ] T028 [P] Write unit tests in `server/tests/unit/camera.test.ts`
- [ ] T029 [P] Write unit tests in `server/tests/unit/stream.test.ts`
- [ ] T030 [P] Write unit tests in `server/tests/unit/hls.test.ts`

**Checkpoint**: Core services ready, camera enumeration works - **USER STORY IMPLEMENTATION CAN BEGIN**

---

## Phase 3: User Story 1 - Browse and Select Available Cameras (P1) 🎯

**Goal**: Users can see all available cameras on the server

**Acceptance**: FR-001 met, SC-010 (<1s list load)

### Backend Implementation (US1)

- [ ] T031 Create Hono route `server/src/routes/cameras.ts`
  - GET /api/cameras: Call cameraManager.getCameras()
  - Return JSON: `{ cameras: CameraDevice[] }`
  - Error handling for enumeration failures
- [ ] T032 [P] Register cameras route in `server/src/index.ts`
  - Import and mount `/api/cameras` routes

### Frontend Implementation (US1)

- [ ] T033 [P] [US1] Create API client `web/src/lib/api.ts`
  - Base URL configuration (proxy to backend)
  - `getCameras()`: Fetch camera list
  - Error handling wrapper
- [ ] T034 [P] [US1] Create types `web/src/lib/types.ts`
  - Mirror CameraDevice, Stream interfaces from backend
- [ ] T035 [P] [US1] Create hook `web/src/hooks/useCameras.ts`
  - Fetch /api/cameras using react-query
  - Return cameras array, loading, error states
- [ ] T036 [P] [US1] Create component `web/src/components/CameraSelector.tsx`
  - Dropdown/list of cameras
  - Show camera name and type
  - Handle "no cameras available" state
  - onSelect callback for parent
- [ ] T037 [P] [US1] Create component `web/src/components/Dashboard.tsx`
  - Main layout with header
  - Render CameraSelector
  - Manage selectedCamera state

**Checkpoint**: Users can open dashboard and see available cameras - **US1 COMPLETE**

---

## Phase 3: User Story 2 - Start Live Streaming from Webcam (P1) 🎯

**Goal**: Users can start capturing video and get HLS URL

**Acceptance**: FR-002, FR-003, FR-004, SC-001 (3 clicks), SC-002 (2s URL) met

### Backend Implementation (US2)

- [ ] T038 Create `server/src/lib/stream/streamManager.ts` with:
  - `startStream(cameraId, options)`: Main orchestration
  - Check camera availability, create directory, spawn FFmpeg
  - Register stream, wait for 'active' status
  - Return Stream object with hlsUrl
- [ ] T039 [P] Add `stopStream(streamId)` to streamManager
  - Kill FFmpeg gracefully (10s timeout)
  - Release camera, cleanup files, remove from registry
- [ ] T040 Create Hono route `server/src/routes/streams.ts`
  - POST /api/streams: Start new stream
  - GET /api/streams: List all active streams
  - GET /api/streams/:id: Get single stream details
  - DELETE /api/streams/:id: Stop stream
- [ ] T041 [P] Register streams route in `server/src/index.ts`

### Frontend Implementation (US2)

- [ ] T042 [P] [US2] Add to API client `web/src/lib/api.ts`
  - `startStream(cameraId)`: POST /api/streams
  - `getStreams()`: GET /api/streams
  - `stopStream(streamId)`: DELETE /api/streams/:id
- [ ] T043 [P] [US2] Create hook `web/src/hooks/useStreams.ts`
  - CRUD operations for streams
  - Polling for stream status updates
  - Optimistic updates
- [ ] T044 [P] [US2] Create component `web/src/components/StreamControls.tsx`
  - "Start Streaming" button
  - Disabled when no camera selected
  - Loading state during startup
  - Display HLS URL with copy button
- [ ] T045 [P] [US2] Create component `web/src/components/StreamStatusBadge.tsx`
  - Visual indicator: starting(yellow)/active(green)/error(red)
- [ ] T046 [P] [US2] Update Dashboard to integrate StreamControls

**Checkpoint**: Users can start stream and see HLS URL - **US1-2 COMPLETE**

---

## Phase 3: User Story 3 - Stop Active Stream (P1) 🎯

**Goal**: Users can stop streaming and free camera resources

**Acceptance**: FR-005, FR-006 met

### Frontend Implementation (US3)

- [ ] T047 [P] [US3] Add stop button to `StreamControls.tsx`
  - Show when stream is active
  - Confirmation dialog before stopping
- [ ] T048 [P] [US3] Add visual feedback for stopping state
  - Show "stopping..." status
  - Remove from list after completion
- [ ] T049 [P] [US3] Add toast notification for stream stopped

**Checkpoint**: Users can stop streams - **US1-3 COMPLETE**

---

## Phase 3: User Story 4 - View All Active Streams (P1) 🎯

**Goal**: Real-time list of all active streams with details

**Acceptance**: FR-006, FR-012, SC-010 met

### Frontend Implementation (US4)

- [ ] T050 [P] [US4] Create component `web/src/components/StreamList.tsx`
  - Table/grid of active streams
  - Columns: Camera, Status, HLS URL, Start Time, Actions
  - Auto-refresh every 2 seconds
  - Empty state: "No active streams"
- [ ] T051 [P] [US4] Create component `web/src/components/StreamListItem.tsx`
  - Individual stream row
  - Copy URL, Stop, View Details buttons
- [ ] T052 [P] [US4] Update Dashboard to show StreamList

**Checkpoint**: Users can see all active streams - **US1-4 COMPLETE**

---

## Phase 3: User Story 5 - Play Stream in Browser (P1) 🎯

**Goal**: Watch live video directly in browser

**Acceptance**: FR-008, SC-003 (5s playback), SC-008 met

### Backend Implementation (US5)

- [ ] T053 Create Hono route `server/src/routes/hls.ts`
  - GET /api/hls/:streamId/manifest.m3u8: Serve m3u8
  - GET /api/hls/:streamId/:segment: Serve .ts files
  - Correct MIME types and cache headers
- [ ] T054 [P] Register HLS route in `server/src/index.ts`
- [ ] T055 [P] Add static file serving for HLS segments

### Frontend Implementation (US5)

- [ ] T056 [P] [US5] Create hook `web/src/hooks/useHLSPlayer.ts`
  - Initialize hls.js with video element ref
  - Handle MANIFEST_PARSED, ERROR events
  - Auto-play on ready
  - Cleanup on unmount
- [ ] T057 [P] [US5] Create component `web/src/components/StreamPlayer.tsx`
  - HTML5 video element
  - hls.js integration
  - Native play/pause/volume controls
  - Error display for playback issues
- [ ] T058 [P] [US5] Create component `web/src/components/StreamPlayerModal.tsx`
  - Modal wrapper for player
  - Close button, ESC key handling
  - Stream info overlay
- [ ] T059 [P] [US5] Add Play button to StreamListItem
  - Opens StreamPlayerModal with stream URL

**Checkpoint**: Users can watch video in browser - **US1-5 COMPLETE (MVP)**

---

## Phase 4: User Story 6 - Seek and Playback Control (P2)

**Goal**: Pause, seek, speed control for buffered content

**Acceptance**: FR-009, FR-010, SC-005 (1s seek) met

### Frontend Implementation (US6)

- [ ] T060 [P] [US6] Enhance StreamPlayer with seek controls
  - Progress bar showing DVR window
  - Current time and available duration display
  - Click-to-seek functionality
- [ ] T061 [P] [US6] Add playback speed control
  - Dropdown: 0.5x, 1x, 1.5x, 2x
- [ ] T062 [P] [US6] Enhance useHLSPlayer with seeking logic
  - Validate seek within DVR buffer
  - Handle seek beyond available segments

**Checkpoint**: Users can seek and control playback - **US1-6 COMPLETE**

---

## Phase 4: User Story 7 - Stream Information (P2)

**Goal**: View detailed stream metadata

**Acceptance**: FR-014, FR-007 met

### Frontend Implementation (US7)

- [ ] T063 [P] [US7] Create component `web/src/components/StreamDetailsModal.tsx`
  - Display: Stream ID, Camera, Status, Start Time, Uptime
  - HLS URL with copy button
  - Segment count, bitrate info
- [ ] T064 [P] [US7] Create component `web/src/components/CopyableField.tsx`
  - Read-only text with copy button
  - Success toast on copy
- [ ] T065 [P] [US7] Add "Details" button to StreamListItem
- [ ] T066 [P] [US7] Add time formatting utilities `web/src/lib/time.ts`

**Checkpoint**: Users can view stream details - **US1-7 COMPLETE**

---

## Phase 5: Polish, Error Handling & Monitoring

**Duration**: 2-3 hours

### Error Handling

- [ ] T067 Implement FFmpeg error detection in streamManager
  - Monitor stderr for errors
  - Detect camera disconnection (within 5 seconds per FR-015)
  - Update stream status to 'error' with message
  - Auto-cleanup on failure
- [ ] T068 [P] Add validation for stream parameters
  - Bitrate: 500-8000 kbps
  - Return 400 with detailed errors
- [ ] T069 [P] Handle disk space issues
  - Check available space before starting
  - Return 507 if < 500MB available

### UI Polish

- [ ] T070 [P] Add loading states and spinners across all components
- [ ] T071 [P] Create Toast notification system in `web/src/components/ui/Toast.tsx`
- [ ] T072 [P] Add responsive design for mobile
- [ ] T073 [P] Add dark mode support (optional)

### Monitoring

- [ ] T074 Create health check endpoint `server/src/routes/health.ts`
  - FFmpeg availability check
  - Active stream count
  - Disk usage report
- [ ] T075 [P] Implement structured logging throughout backend
- [ ] T076 [P] Add stream quality monitoring (frame drop detection for FR-011)

### Testing

- [ ] T077 [P] Write E2E tests in `tests/e2e/streaming.spec.ts`
- [ ] T078 [P] Add stability/soak test for 1-hour runtime (SC-007)

**Checkpoint**: Robust application with good error handling

---

## Phase 6: Documentation & Deployment

**Duration**: 1-2 hours

### Documentation

- [ ] T079 Add JSDoc comments to all public functions
- [ ] T080 [P] Document TypeScript interfaces
- [ ] T081 [P] Update README with API documentation
- [ ] T082 [P] Document .env configuration

### Deployment

- [ ] T083 Create `server/Dockerfile`
- [ ] T084 Create `web/Dockerfile`
- [ ] T085 Create `docker-compose.yml` for full stack
- [ ] T086 [P] Create deployment guide

### Final Testing

- [ ] T087 Run full integration test suite
- [ ] T088 Test on multiple browsers (Chrome, Firefox, Safari, Edge)

---

## Summary

### Task Statistics

| Phase | Purpose | Task Count | Duration | Prerequisites |
|-------|---------|-----------|----------|---|
| Phase 1 | Setup | 17 | 1-2h | None |
| Phase 2 | Foundation | 13 | 2-3h | Phase 1 ✓ |
| Phase 3 | P1 Stories (MVP) | 29 | 3-4h | Phase 2 ✓ |
| Phase 4 | P2 Stories | 7 | 1-2h | Phase 3 ✓ |
| Phase 5 | Polish | 12 | 2-3h | Phase 4 ✓ |
| Phase 6 | Docs/Deploy | 10 | 1-2h | Phase 5 ✓ |
| **TOTAL** | **Complete Feature** | **88** | **70-100h** | **5-7 days** |

### MVP Scope (Minimum Viable Product)

**Phases 1-3 deliver MVP** (all P1 user stories):

✅ **Phase 1**: Backend (Hono) and Frontend (Vite/React) initialized
✅ **Phase 2**: Core infrastructure ready
✅ **Phase 3**: All P1 user stories complete:
  - US1: Browse and select cameras
  - US2: Start live streaming  
  - US3: Stop streaming
  - US4: View active streams
  - US5: Play in browser

**MVP Duration**: 35-50 hours (3-4 days)

### Success Criteria Mapping

| Success Criteria | Supporting Tasks |
|---|---|
| SC-001: 3 clicks to start | T036 (selector) + T044 (controls) |
| SC-002: 2 sec URL generation | T038 (streamManager) |
| SC-003: 5 sec playback | T056-T057 (hls.js player) |
| SC-004: 2 concurrent streams | T024 (registry) + T021 (reservation) |
| SC-005: 1 sec seek response | T062 (seek logic) |
| SC-006: UI responsive | T070, T072 (polish) |
| SC-007: 1 hour runtime | T078 (soak test) |
| SC-008: All browser ops | T056-T059 (full player) |
| SC-009: 90% success rate | T067-T069 (error handling) |
| SC-010: 1 sec list load | T035, T050 (react-query) |

---

## Phase 4: User Story 7 - Get Stream Information and URLs (P2)

**Goal**: Users can view detailed stream information (URL, bitrate, resolution, timing)

**Independent Test**: "Start stream → click 'Stream Info' → see detailed metadata with copyable HLS URL"
**Acceptance**: FR-014, FR-007, SC-007 met

### Implementation for User Story 7

- [ ] T062 Create React component `app/components/StreamDetailsModal.tsx`
  - Display detailed stream information
  - Fields: Stream ID, Camera Name, Status, Start Time, Uptime, Bitrate, Resolution, Frame Rate
  - HLS URL with copy button
  - Segment count and buffered segments
  - FFmpeg process ID
  - Last updated timestamp
  - Modal/popover with close button
- [ ] T063 [P] Create React component `app/components/CopyableField.tsx`
  - Display read-only text field
  - Copy button on hover/click
  - Show success toast after copy
  - Format value for display (URLs, timestamps, etc.)
- [ ] T064 [P] Add "Stream Details" button to StreamListItem
  - Click handler opens StreamDetailsModal
  - Pass streamId to modal
  - Trigger stream info fetch
- [ ] T065 [P] Add time formatting utilities in `app/lib/utils/time.ts`
  - `formatUptime(seconds)`: Convert to HH:MM:SS
  - `formatTimestamp(iso8601)`: Convert to readable date/time
  - `formatDuration(ms)`: Convert to MM:SS
- [ ] T066 [P] Add storage information display
  - Show bytes encoded for stream
  - Estimate disk usage per stream
  - Display total disk usage across all streams

**Checkpoint**: Users can view comprehensive stream information - **USER STORIES 1-7 COMPLETE**

---

## Phase 5: Polish, Error Handling & Monitoring

**Purpose**: Robustness, user experience, and operational visibility

**Duration**: 2-3 hours

### Error Handling & Edge Cases

- [ ] T067 Implement comprehensive error handling for FFmpeg failures
  - Monitor FFmpeg stderr for errors
  - Detect camera disconnection during streaming
  - Update stream status to 'error' with error message
  - User notification when stream fails
  - Auto-cleanup on failure
- [ ] T068 [P] Add validation for stream parameters
  - Bitrate validation (500-8000 kbps)
  - Resolution validation (must match camera capabilities)
  - Frame rate validation (1-60 fps)
  - Return 400 Bad Request with detailed error messages
- [ ] T069 [P] Handle camera disconnection gracefully
  - Detect when camera is unplugged during streaming
  - Update camera status to 'disconnected'
  - Stop stream and notify user
  - Clear UI state
- [ ] T070 [P] Handle disk space issues
  - Monitor available disk space before starting stream
  - Return 507 Insufficient Storage if < 500MB available
  - Auto-cleanup old segments if disk usage > 80%

### UI Polish & User Experience

- [ ] T071 [P] Add loading states and spinners
  - Camera enumeration loading
  - Stream startup loading
  - Manifest fetch loading
  - Graceful degradation if slow
- [ ] T072 [P] Add toast/notification system
  - Stream started successfully
  - Stream stopped successfully
  - Errors and warnings
  - Camera disconnected warning
  - Disk space warning
- [ ] T073 [P] Add responsive design for mobile
  - Mobile-friendly camera selector
  - Responsive video player
  - Touch-friendly buttons and controls
  - Hamburger menu for options
- [ ] T074 [P] Enhance visual design
  - Improve color scheme and contrast
  - Add icons for status indicators
  - Better typography and spacing
  - Dark mode support (optional)

### Monitoring & Observability

- [ ] T075 Implement structured logging
  - Log all stream lifecycle events (start, active, stop, error)
  - Log FFmpeg events and stderr output
  - Log API request/response times
  - Rotate logs to prevent disk bloat
- [ ] T076 [P] Create health check endpoint `app/api/health/route.ts`
  - Check FFmpeg availability
  - Report active stream count
  - Report disk usage
  - Report uptime and system status
- [ ] T077 [P] Add performance monitoring
  - Measure stream startup time
  - Measure manifest generation time
  - Monitor memory usage
  - Monitor CPU usage during encoding

### Testing & Validation

- [ ] T078 [P] Write E2E tests in `tests/e2e/streaming.spec.ts`
  - Full user flow: Select camera → Start → Play → Stop
  - Multi-stream scenarios
  - Camera disconnection handling
  - Error recovery

**Checkpoint**: Robust, polished application with good error handling and UX

---

## Phase 6: Documentation & Deployment

**Purpose**: Documentation, deployment preparation, and knowledge transfer

**Duration**: 1-2 hours

### Code Documentation

- [ ] T079 Add JSDoc comments to all public functions
- [ ] T080 [P] Document TypeScript interfaces and types
- [ ] T081 [P] Create API documentation from contracts/api.md
- [ ] T082 [P] Document environment variables in .env.example

### Deployment & DevOps

- [ ] T083 Create Dockerfile for containerized deployment
- [ ] T084 Create docker-compose.yml for local development
- [ ] T085 Create deployment guide in README.md
- [ ] T086 [P] Create environment configuration for different stages (dev/staging/prod)
- [ ] T087 [P] Create startup/shutdown scripts for FFmpeg management

### Final Testing

- [ ] T088 Run full integration test suite
- [ ] T089 Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] T090 Test on different platforms (Windows, macOS, Linux)
- [ ] T091 Performance testing with multiple concurrent streams

---

## Summary

### Task Statistics

| Phase | Purpose | Task Count | Duration | Prerequisites |
|-------|---------|-----------|----------|---|
| Phase 1 | Setup | 10 | 1-2h | None |
| Phase 2 | Foundation | 14 | 2-3h | Phase 1 ✓ |
| Phase 3 | P1 Stories (MVP) | 28 | 3-4h | Phase 2 ✓ |
| Phase 4 | P2 Stories | 13 | 2-3h | Phase 3 ✓ |
| Phase 5 | Polish | 14 | 2-3h | Phase 4 ✓ |
| Phase 6 | Docs/Deploy | 9 | 1-2h | Phase 5 ✓ |
| **TOTAL** | **Complete Feature** | **78** | **80-120h** | **6-8 days** |

### MVP Scope (Minimum Viable Product)

**Phases 1-3 deliver MVP** (all P1 user stories):

✅ **Phase 1**: Project initialized, dependencies installed
✅ **Phase 2**: Core infrastructure ready for user story work
✅ **Phase 3**: All P1 user stories complete:
  - Browse and select cameras
  - Start live streaming  
  - Stop streaming
  - View active streams
  - Play in browser

**MVP Duration**: 40-60 hours (3-4 days)

**MVP Deliverable**: Fully functional HLS streaming from webcam with browser playback

### Enhancement Phases

**Phase 4** (P2 stories, +20-30h):
- Seek/playback control
- Stream details/info

**Phase 5** (Polish, +20-30h):
- Error handling
- UX improvements
- Monitoring/logging

**Phase 6** (Docs/Deploy, +10-15h):
- Documentation
- Containerization
- Deployment guides

---

## Parallel Execution Strategy

### Phase 1: Sequential Required
- Projects can't start without setup

### Phase 2: Parallel Opportunities
- T012 & T013: Camera helpers (different files)
- T014 & T015 & T016 & T017: FFmpeg config (independent modules)
- T020 & T021: HLS utilities (independent)
- T022 & T023 & T024: Unit tests (test different services)

**Estimated Parallelization**: 14 tasks → 8-10 actual hours (vs 14 sequential)

### Phase 3: Maximum Parallelism
- Each user story implements independently
- US1, US2, US3, US4, US5 can start immediately after Phase 2

**Parallel Execution Example**:
```
Developer A: US1 (Camera Selector)     + US2 API
Developer B: US3 (Stop)                + US4 List
Developer C: US5 (Player)              + Tests
→ All 5 stories complete in parallel in ~6-8 hours
```

---

## Dependency Graph

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundation) ← REQUIRED before user stories
  ├─ Camera Manager (T011-T013)
  ├─ FFmpeg Wrapper (T014-T017)  
  ├─ Stream Registry (T018-T019)
  └─ HLS Utilities (T020-T021)
  ↓
Phase 3 (P1 Stories) ← Can run in parallel
  ├─ US1: Camera Browse (T025-T030)
  ├─ US2: Start Stream (T031-T040)
  ├─ US3: Stop Stream (T041-T044)
  ├─ US4: Stream List (T045-T048)
  └─ US5: Player (T049-T056) ← Depends on US2 (stream must exist)
  ↓
Phase 4 (P2 Stories) ← Depends on Phase 3
  ├─ US6: Seek Control (T057-T061)
  └─ US7: Stream Info (T062-T066)
  ↓
Phase 5 (Polish) ← Enhancement, can overlap Phase 4
  └─ Error handling, UX, Monitoring
  ↓
Phase 6 (Docs/Deploy) ← Final phase
  └─ Documentation, containerization
```

---

## Task Checklist Format

All tasks follow consistent format for easy tracking:

```
- [ ] T001 Create project structure per implementation plan
- [ ] T012 [P] Create TypeScript interfaces in app/lib/types/index.ts
- [ ] T026 [P] [US1] Create API route app/api/cameras/route.ts
```

**Checklist Fields**:
1. Checkbox: `- [ ]` (unchecked) → `- [x]` (completed)
2. Task ID: T001, T002, ... (sequential across all phases)
3. [P]: Parallelizable (optional, only if can run in parallel)
4. [Story]: User story (optional, only in Phase 3+)
5. Description: Clear action with specific file path

---

## Next Steps

1. **Prioritize**: Choose MVP scope (Phase 1-3) or full feature (Phase 1-6)
2. **Assign**: Distribute tasks to developers based on expertise
3. **Track**: Use this checklist to monitor progress
4. **Iterate**: Complete Phase 1 → Phase 2 → Phase 3 in sequence
5. **Test**: After each user story, verify it meets acceptance criteria

---

## Success Criteria Mapping to Tasks

| Success Criteria | Supporting Tasks |
|---|---|
| SC-001: 3 clicks to start | T027 (UI) + T033-T035 (API) |
| SC-002: 2 sec URL generation | T033 (FFmpeg quick start) + T050 (manifest serve) |
| SC-003: 5 sec playback | T050 (manifest) + T052 (hls.js) |
| SC-004: 2 concurrent streams | T018 (registry) + T019 (reservation) |
| SC-005: 1 sec seek response | T058 (seek logic) |
| SC-006: UI responsive | T073 (polish) |
| SC-007: 1 hour runtime | T067 (error handling) |
| SC-008: All browser ops | T046-T056 (full UI) |
| SC-009: 90% success rate | T067-T070 (error handling) |
| SC-010: 1 sec list load | T045 (polling) |

