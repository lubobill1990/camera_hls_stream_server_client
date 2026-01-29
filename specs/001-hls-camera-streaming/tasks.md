# Tasks: HLS Camera Streaming Server

**Input**: Design documents from `/specs/001-hls-camera-streaming/`
**Prerequisites**: 
- ✅ spec.md (7 user stories, 15 functional requirements)
- ✅ plan.md (Next.js + FFmpeg architecture)
- ✅ research.md (6 research topics completed)
- ✅ data-model.md (4 core entities defined)
- ✅ contracts/api.md (8 REST endpoints)
- ✅ quickstart.md (working code template)

**Total Tasks**: 78 tasks across 6 phases
**Estimated Duration**: 80-120 development hours (6-8 days for 1-2 developers)
**Branch**: `001-hls-camera-streaming`

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

**Purpose**: Initialize Next.js project, establish directory structure, configure tools

**Duration**: 1-2 hours
**Deliverable**: Working Next.js dev environment with TypeScript

### Setup Tasks

- [ ] T001 Create Next.js project with TypeScript, Tailwind CSS, and ESLint config
- [ ] T002 [P] Create directory structure per plan.md: `app/api`, `app/components`, `app/lib`, `public/hls`, `tests`
- [ ] T003 [P] Install dependencies: ffmpeg, hls.js, uuid, jest, @testing-library/react
- [ ] T004 [P] Configure TypeScript strict mode and path aliases
- [ ] T005 Configure jest.config.js with Next.js support and test paths
- [ ] T006 Create `.env.example` with default configuration (ffmpeg path, hls segment settings)
- [ ] T007 Create `.gitignore` to exclude `public/hls/*` segment files and node_modules
- [ ] T008 [P] Setup ESLint and Prettier configuration for code consistency
- [ ] T009 Create README.md with setup and development instructions
- [ ] T010 [P] Configure Next.js build and dev scripts in `package.json`

**Checkpoint**: Project builds and runs with `npm run dev` - **REQUIRED BEFORE PHASE 2**

---

## Phase 2: Foundational Infrastructure (Core Services)

**Purpose**: Implement shared libraries and core logic that all user stories depend on

**Duration**: 2-3 hours
**Deliverable**: Camera manager, FFmpeg wrapper, stream registry, HLS utilities

**⚠️ CRITICAL**: All tasks must complete before user story implementation

### Camera Management Foundation

- [ ] T011 Create TypeScript interfaces for Camera entities in `app/lib/types/index.ts`
  - CameraDevice, CameraCapabilities, CameraStatus enums
- [ ] T012 [P] Create `app/lib/camera/cameraManager.ts` with:
  - `discoverCameras()`: Enumerate system cameras using FFmpeg
  - `getCameras()`: Return current camera list with status
  - `getCameraById(id)`: Get single camera details
- [ ] T013 [P] Create `app/lib/camera/platformHelpers.ts` for OS-specific camera enumeration
  - Windows: dshow format detection
  - macOS: avfoundation format detection
  - Linux: v4l2 format detection

### FFmpeg Integration Foundation

- [ ] T014 [P] Create TypeScript interfaces for Stream entities in `app/lib/types/index.ts`
  - Stream, StreamStatus, HLSSegment, HLSManifest types
- [ ] T015 Create `app/lib/ffmpeg/ffmpegWorker.ts` with:
  - `spawnFFmpeg(cameraId, options)`: Spawn FFmpeg child process
  - `killFFmpeg(process, timeout)`: Gracefully kill FFmpeg with timeout
  - Redirect stderr to capture encoding progress
- [ ] T016 [P] Create `app/lib/ffmpeg/transcodeConfig.ts` with:
  - `buildFFmpegArgs()`: Generate FFmpeg command-line arguments
  - Configure bitrate, resolution, segment duration, codec settings
  - Support for platform-specific device input formats
- [ ] T017 [P] Create error handling utilities in `app/lib/utils/logging.ts`
  - Structured logging for FFmpeg events
  - Error event handlers for process failures

### Stream Registry Foundation

- [ ] T018 Create `app/lib/stream/streamRegistry.ts` (in-memory state management)
  - Map<streamId, StreamState> store
  - `registerStream(stream)`: Add new stream to registry
  - `getStream(id)`: Retrieve stream metadata
  - `updateStream(id, partial)`: Update stream status/properties
  - `unregisterStream(id)`: Remove stream from registry
  - `getAllStreams()`: List all active streams
- [ ] T019 [P] Implement camera reservation system in `app/lib/camera/cameraManager.ts`
  - `reserveCamera(cameraId)`: Check and mark camera in-use
  - `releaseCamera(cameraId)`: Release camera for reuse
  - Prevent duplicate camera usage across streams

### HLS Utilities Foundation

- [ ] T020 Create `app/lib/hls/hlsManager.ts` with:
  - `createStreamDirectory(streamId)`: Create `/public/hls/<streamId>` directory
  - `cleanupStreamDirectory(streamId)`: Delete all stream files
  - `getAvailableSegments(streamId)`: List current segment files
  - `generateManifest(streamId)`: Build m3u8 content from segments
- [ ] T021 [P] Create utility functions in `app/lib/utils/uuid.ts`
  - `generateStreamId()`: Create unique stream identifiers
  - UUID v4 generation

### Initialization Tests (Unit Tests - OPTIONAL for MVP)

- [ ] T022 [P] Write unit tests for camera manager in `tests/unit/camera.test.ts`
  - Mock FFmpeg output parsing
  - Test camera enumeration logic
- [ ] T023 [P] Write unit tests for stream registry in `tests/unit/stream.test.ts`
  - Test add/remove/update operations
  - Verify isolation between streams
- [ ] T024 [P] Write unit tests for HLS utilities in `tests/unit/hls.test.ts`
  - Test manifest generation from segment files
  - Test directory creation/cleanup

**Checkpoint**: Core services ready, camera enumeration works, stream registry operational - **USER STORY IMPLEMENTATION CAN BEGIN**

---

## Phase 3: User Story 1 - Browse and Select Available Cameras (P1) 🎯

**Goal**: Users can see all available cameras and understand their capabilities

**Independent Test**: "Open dashboard → see list of cameras with names and capabilities"
**Acceptance**: User Story 2 requirements met (FR-001)

### Tests for User Story 1 (OPTIONAL)

- [ ] T025 [P] [US1] Contract test for GET /api/cameras in `tests/contract/cameras.test.ts`
  - Request: GET /api/cameras
  - Response: { cameras: Array<CameraDevice> }
  - Validate schema and required fields

### Implementation for User Story 1

- [ ] T026 Create API route `app/api/cameras/route.ts`
  - GET handler: Call cameraManager.getCameras()
  - Return JSON response with camera list
  - Error handling for enumeration failures
- [ ] T027 [P] Create React component `app/components/CameraSelector.tsx`
  - Fetch /api/cameras on mount
  - Display dropdown/list of cameras
  - Show camera name and type (builtin/usb)
  - Handle "no cameras available" state
  - Selected camera state management
- [ ] T028 [P] Create React component `app/components/CameraDetails.tsx`
  - Display selected camera capabilities
  - Show supported resolutions and frame rates
  - Display camera type and device name
- [ ] T029 [P] Update `app/components/Dashboard.tsx`
  - Import and render CameraSelector
  - Import and render CameraDetails
  - Pass selectedCamera state between components
- [ ] T030 [P] Add CSS styling in `app/styles/globals.css`
  - Camera selector dropdown styling
  - Details panel layout
  - Responsive design for mobile

**Checkpoint**: Users can open dashboard and see available cameras - **USER STORY 1 COMPLETE**

---

## Phase 3: User Story 2 - Start Live Streaming from Webcam (P1) 🎯

**Goal**: Users can start capturing video from selected camera and get HLS URL

**Independent Test**: "Select camera → click Start → verify HLS URL generated and stream status is 'active'"
**Acceptance**: Functional requirements FR-002, FR-003, FR-004, SC-001, SC-002 met

### Tests for User Story 2 (OPTIONAL)

- [ ] T031 [P] [US2] Contract test for POST /api/streams in `tests/contract/streams.test.ts`
  - POST /api/streams with { cameraId, bitrate, resolution }
  - Response: { stream: Stream } with hlsUrl
  - Error case: Camera already in use (409)
- [ ] T032 [P] [US2] Integration test for stream startup in `tests/integration/stream-start.test.ts`
  - Start stream from camera → FFmpeg spawns → manifest generates → segments appear
  - Verify m3u8 file creation within 2 seconds

### Implementation for User Story 2

- [ ] T033 Create `app/lib/stream/streamManager.ts` with:
  - `startStream(cameraId, options)`: Main stream startup orchestration
  - Check camera availability (via reservation)
  - Create stream directory
  - Spawn FFmpeg process
  - Register stream in registry
  - Wait for stream to reach 'active' status
  - Return Stream object with hlsUrl
  - Error handling: camera in use, FFmpeg startup failure
- [ ] T034 [P] Add `stopStream(streamId)` to streamManager
  - Kill FFmpeg process gracefully
  - Release camera
  - Clean up files
  - Remove from registry
- [ ] T035 Create API route `app/api/streams/route.ts`
  - POST handler: Extract cameraId from body
  - Call streamManager.startStream()
  - Return { stream } response (201 Created)
  - Error responses: 409 (camera in use), 400 (invalid params), 500 (FFmpeg failed)
  - GET handler: Call streamManager.getAllStreams()
  - Return { streams: [...] } array
- [ ] T036 Create API route `app/api/streams/[streamId]/route.ts`
  - GET handler: Get single stream details
  - DELETE handler: Stop stream, return success response
- [ ] T037 [P] Create React component `app/components/StreamControls.tsx`
  - Render "Start Streaming" button
  - Disabled state when no camera selected
  - Loading state during FFmpeg startup
  - Display selected camera name and streaming status
  - Display generated HLS URL (with copy-to-clipboard)
- [ ] T038 [P] Create custom React hook `app/hooks/useStreamStartStop.ts`
  - `startStream(cameraId)`: POST to /api/streams, poll for 'active' status
  - `stopStream(streamId)`: DELETE to /api/streams/{id}
  - Handle errors and provide user feedback
  - Status polling logic (500ms intervals)
- [ ] T039 [P] Update `app/components/Dashboard.tsx`
  - Import StreamControls
  - Wire up start/stop handlers
  - Display active stream list
  - Manage selectedStream state
- [ ] T040 [P] Create React component `app/components/StreamStatusBadge.tsx`
  - Visual indicator for stream status (starting/active/stopping/stopped/error)
  - Color coding (yellow/green/red)
  - Auto-refresh every 1 second

**Checkpoint**: Users can select camera and start stream, HLS URL appears - **USER STORIES 1-2 COMPLETE**

---

## Phase 3: User Story 3 - Stop Active Stream (P1) 🎯

**Goal**: Users can stop streaming and free up camera resources

**Independent Test**: "Start stream → click Stop → stream disappears from list, camera becomes available"
**Acceptance**: FR-005, FR-006 met

### Implementation for User Story 3

- [ ] T041 [P] Add stop button to `app/components/StreamControls.tsx`
  - Show "Stop Streaming" button when stream is active
  - Disabled state when no active stream
  - Confirmation dialog before stopping
- [ ] T042 [P] Add stop functionality to `app/components/StreamList.tsx` (see US4)
  - Individual stop button for each stream
  - Trigger useStreamStartStop.stopStream()
- [ ] T043 [P] Add visual feedback for stopping state
  - Show "stopping..." status during graceful shutdown
  - Confirm removal from list after completion
- [ ] T044 [P] Implement cleanup notification
  - Show toast/notification when stream stopped
  - Display cleanup progress

**Checkpoint**: Users can stop streams and free cameras - **USER STORIES 1-3 COMPLETE**

---

## Phase 3: User Story 4 - View All Active Streams (P1) 🎯

**Goal**: Users see real-time list of all active streams with details

**Independent Test**: "Start 2 streams from different cameras → see both in list with names and HLS URLs"
**Acceptance**: FR-006, FR-012, SC-010 met

### Implementation for User Story 4

- [ ] T045 Create custom React hook `app/hooks/useStreamList.ts`
  - Fetch /api/streams on mount
  - Poll every 2 seconds for updates
  - Return streams array and refresh function
  - Handle loading and error states
- [ ] T046 Create React component `app/components/StreamList.tsx`
  - Render table or grid of active streams
  - Columns: Camera Name, Status, HLS URL, Start Time, Uptime, Actions
  - Copy-to-clipboard for HLS URL
  - Stop button for each stream
  - Empty state: "No active streams"
  - Auto-refresh every 2 seconds
- [ ] T047 [P] Create React component `app/components/StreamListItem.tsx`
  - Individual stream row/card
  - Display stream metadata
  - Action buttons (copy URL, stop stream, view details)
  - Format timestamps and duration
- [ ] T048 [P] Update `app/components/Dashboard.tsx`
  - Import useStreamList hook
  - Display StreamList component
  - Auto-refresh integration
  - Handle loading states

**Checkpoint**: Users can see all active streams in real-time - **USER STORIES 1-4 COMPLETE**

---

## Phase 3: User Story 5 - Play Stream in Browser (P1) 🎯

**Goal**: Users can watch live video directly in browser with embedded player

**Independent Test**: "Start stream → click play → video plays in browser player"
**Acceptance**: FR-008, SC-003, SC-008 met

### Tests for User Story 5 (OPTIONAL)

- [ ] T049 [P] [US5] Integration test for manifest serving in `tests/integration/manifest.test.ts`
  - GET /api/hlsstream/{streamId}/manifest.m3u8 returns valid m3u8
  - Contains correct segment references
  - Updates with new segments every 2 seconds

### Implementation for User Story 5

- [ ] T050 Create API route `app/api/hlsstream/[streamId]/manifest/route.ts`
  - GET handler: Retrieve manifest for stream
  - Call hlsManager.generateManifest(streamId)
  - Return m3u8 content with correct MIME type
  - Cache-Control: no-cache headers
  - Error: 404 if stream not found or not active
- [ ] T051 [P] Create API route `app/api/hlsstream/[streamId]/[segmentFile]/route.ts`
  - GET handler: Serve video segment file
  - Support HTTP Range requests for seeking
  - Return correct Content-Type: video/mp2t
  - Cache-Control: public, max-age=31536000
  - Error: 404 if segment not found
- [ ] T052 [P] Create React component `app/components/StreamPlayer.tsx`
  - Import hls.js library
  - Render HTML5 video element
  - Load HLS stream on mount
  - Handle video element lifecycle
  - Error handling for network/playback errors
  - Play/pause/volume controls (native video controls)
- [ ] T053 [P] Create custom React hook `app/hooks/useHLSPlayer.ts`
  - `useHLSPlayer(videoRef, hlsUrl)`: Initialize hls.js
  - Attach media and load source
  - Handle MANIFEST_PARSED event
  - Auto-play on ready
  - Cleanup on unmount
  - Reconnection logic for network errors
- [ ] T054 [P] Create React component `app/components/StreamPlayerModal.tsx`
  - Modal/popover to display player full-screen
  - Close button
  - Stream info overlay
  - Keyboard shortcuts (space=play/pause, ESC=close)
- [ ] T055 [P] Update StreamListItem to add play button
  - Click handler opens StreamPlayerModal
  - Pass streamId and hlsUrl to player
- [ ] T056 [P] Add keyboard navigation support
  - ESC to close player
  - P to toggle play/pause
  - M to toggle mute

**Checkpoint**: Users can click play and watch video in browser - **USER STORIES 1-5 COMPLETE (MVP)**

---

## Phase 4: User Story 6 - Seek and Set Playback Time (P2)

**Goal**: Users can pause, seek backward/forward in buffered stream content

**Independent Test**: "Stream running for 20s → pause → seek backward → verify playback resumes from selected time"
**Acceptance**: FR-009, FR-010, SC-005 met

### Implementation for User Story 6

- [ ] T057 [P] Enhance `app/components/StreamPlayer.tsx` with seek controls
  - Add progress bar showing current playback position
  - Display DVR window (available buffered time range)
  - Show current time and total available duration
  - Implement seek-on-click functionality
- [ ] T058 [P] Enhance `app/hooks/useHLSPlayer.ts` with seeking logic
  - Capture current time and update progress bar
  - Handle user seek requests
  - Validate seek is within available buffer (DVR window)
  - Handle seek beyond available segments gracefully
- [ ] T059 [P] Add playback speed control to StreamPlayer
  - Dropdown: 0.5x, 1x, 1.5x, 2x speeds
  - Update video.playbackRate on selection
  - Display current speed indicator
- [ ] T060 [P] Add pause/resume button to StreamPlayer
  - Primary button: pause when playing, resume when paused
  - Visual indicator showing current state
  - Keyboard shortcut: spacebar
- [ ] T061 [P] Update StreamPlayerModal to display seek position
  - Show formatted current time (MM:SS)
  - Show formatted available duration
  - Update in real-time during playback

**Checkpoint**: Users can seek and control playback - **USER STORIES 1-6 COMPLETE**

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

