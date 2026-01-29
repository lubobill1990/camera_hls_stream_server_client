# Feature Specification: HLS Camera Streaming Server

**Feature Branch**: `001-hls-camera-streaming`  
**Created**: January 29, 2026  
**Status**: Draft  
**Input**: User description: "创建一个 hono + typescript 的服务器，能打开当前机器的摄像头，读取 webcam 的内容，保存为 hls stream..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Live Streaming from Webcam (Priority: P1)

A user wants to start capturing video from their computer's webcam and stream it as HLS so it can be viewed in standard video players.

**Why this priority**: This is the core functionality that enables the entire feature. Without it, users cannot capture or stream video.

**Independent Test**: Can be fully tested by opening the UI, selecting a camera, clicking "Start Streaming", and verifying that an HLS URL is generated and playable in a video player.

**Acceptance Scenarios**:

1. **Given** the user is on the streaming dashboard, **When** they select an available camera from the dropdown and click "Start Streaming", **Then** the system starts capturing video from that camera and displays a generated HLS URL
2. **Given** streaming is active, **When** the user tries to start streaming again with the same camera, **Then** the system returns an error indicating that camera is already in use
3. **Given** streaming is active, **When** the user attempts to start streaming with a different available camera, **Then** the system successfully starts streaming from the new camera

---

### User Story 2 - Browse and Select Available Cameras (Priority: P1)

A user wants to see all cameras connected to their computer and select which one to use for streaming.

**Why this priority**: Users need to discover and choose cameras before they can start streaming. This is essential for the initial setup.

**Independent Test**: Can be fully tested by opening the UI and verifying that all connected cameras are listed with readable names/IDs, and a camera can be selected from the list.

**Acceptance Scenarios**:

1. **Given** the user opens the dashboard, **When** the page loads, **Then** the system displays a list of all available cameras with identifiable names or IDs
2. **Given** multiple cameras are connected, **When** the user views the camera list, **Then** each camera is clearly distinguishable
3. **Given** no cameras are connected, **When** the user opens the dashboard, **Then** the system displays a message indicating no cameras are available

---

### User Story 3 - Stop Active Stream (Priority: P1)

A user wants to stop the currently active video stream from a camera.

**Why this priority**: Users need to stop streaming to free up camera resources and manage their streams effectively.

**Independent Test**: Can be fully tested by starting a stream and then clicking "Stop Streaming" to verify the stream ends and the camera is released.

**Acceptance Scenarios**:

1. **Given** a stream is actively running, **When** the user clicks "Stop Streaming", **Then** the stream stops and the camera is released for other use
2. **Given** a stream is active, **When** the user stops the stream, **Then** the HLS URL becomes unavailable
3. **Given** no stream is running, **When** the user looks at the UI, **Then** the "Stop Streaming" button is disabled or unavailable

---

### User Story 4 - View All Active Streams (Priority: P1)

A user wants to see a list of all currently active streams with their details and HLS URLs.

**Why this priority**: Users need to manage and monitor multiple potential streams, understanding what's currently running.

**Independent Test**: Can be fully tested by starting multiple streams and verifying they all appear in a list view with their details.

**Acceptance Scenarios**:

1. **Given** one or more streams are active, **When** the user views the streams list, **Then** each active stream is displayed with its camera name and HLS URL
2. **Given** multiple streams are active, **When** the user views the streams list, **Then** the list is clearly organized and easy to navigate
3. **Given** no streams are active, **When** the user views the streams list, **Then** the list shows "No active streams"

---

### User Story 5 - Play Stream in Browser (Priority: P1)

A user wants to watch the live video stream directly in their web browser without additional tools or software.

**Why this priority**: Core user-facing feature that delivers the primary value of the system.

**Independent Test**: Can be fully tested by starting a stream, clicking a "Play" or "Watch" button, and verifying that video plays in an embedded player within the page.

**Acceptance Scenarios**:

1. **Given** an active HLS stream, **When** the user clicks the play/watch button for that stream, **Then** a video player appears in the UI and begins playing the stream
2. **Given** a stream is playing in the browser, **When** the user watches the video, **Then** the video plays smoothly with live content
3. **Given** a video player is open, **When** the user closes the player, **Then** the stream continues on the server (stopping the player doesn't affect the stream)

---

### User Story 6 - Seek and Set Playback Time (Priority: P2)

A user wants to pause the stream, seek to a different point in time, and resume playback (time-shift viewing).

**Why this priority**: Provides enhanced viewing experience allowing users to rewatch recent portions of the stream. Important for usability but not critical for basic functionality.

**Independent Test**: Can be fully tested by starting a stream, letting it run for a period, pausing, seeking backward/forward, and verifying playback resumes from the selected time.

**Acceptance Scenarios**:

1. **Given** a stream has been running for some time, **When** the user pauses the video, **Then** playback stops and the current position is displayed
2. **Given** a paused stream, **When** the user uses the seek bar to move to an earlier point in the stream, **Then** playback resumes from that time
3. **Given** a playing or paused stream, **When** the user seeks forward, **Then** the player jumps to the requested time in the HLS buffer

---

### User Story 7 - Get Stream Information and URLs (Priority: P2)

A user wants to view detailed information about a stream including its HLS URL, bitrate, resolution, and other technical details.

**Why this priority**: Enables advanced users to understand stream characteristics and use URLs in external applications. Important but secondary to core streaming functionality.

**Independent Test**: Can be fully tested by starting a stream, opening stream information view, and verifying all displayed data is accurate and complete.

**Acceptance Scenarios**:

1. **Given** an active stream, **When** the user clicks "Stream Info" or "Details", **Then** detailed information is displayed including HLS URL, camera name, start time, and status
2. **Given** stream details are shown, **When** the user hovers over the HLS URL, **Then** they can easily copy the URL to clipboard
3. **Given** stream details are visible, **When** the user views the information, **Then** all details are human-readable and clearly labeled

---

### Edge Cases

- What happens when a camera is disconnected while streaming? (System should handle gracefully with error notification)
- How does the system behave if multiple users try to access the same camera simultaneously? (First user gets access, others see "camera in use" message)
- What happens if the HLS buffer fills up and older segments need to be deleted? (System should manage buffer automatically to maintain reasonable disk usage)
- How does playback behave if the network connection drops temporarily? (Player should attempt to reconnect and resume)
- What if a user tries to seek beyond available buffered segments? (Seek should go to the nearest available segment or prevent seeking with a message)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect and list all cameras connected to the computer on application startup
- **FR-002**: System MUST allow users to select a camera and initiate HLS stream capture with a single action
- **FR-003**: System MUST encode captured webcam video into HLS format with proper m3u8 manifest files and .ts video segments
- **FR-004**: System MUST provide an accessible HLS URL (playable by standard m3u8-compatible players) for each active stream
- **FR-005**: System MUST allow users to stop any active stream and release the camera for other uses
- **FR-006**: System MUST display a real-time list of all active streams with current status
- **FR-007**: System MUST provide a web-based UI for all streaming operations without requiring external tools or applications
- **FR-008**: System MUST support playing HLS streams directly in the browser using an embedded video player
- **FR-009**: System MUST support seeking/scrubbing through stream content that has been buffered
- **FR-010**: System MUST support pausing, resuming, and adjusting playback speed of streams
- **FR-011**: System MUST maintain HLS stream quality and prevent frame drops during normal operation
- **FR-012**: System MUST handle multiple concurrent streams from different cameras
- **FR-013**: System MUST provide REST API endpoints to control streams (start, stop, list, get details)
- **FR-014**: System MUST generate unique identifiable names/IDs for each active stream for easy reference
- **FR-015**: System MUST monitor camera health and handle disconnection gracefully with user notification

### Key Entities

- **Camera**: Represents a physical or virtual camera device connected to the system. Attributes: device ID, friendly name, status (available/in-use), resolution capabilities
- **Stream**: Represents an active HLS stream being captured from a camera. Attributes: stream ID, camera reference, start time, status, HLS URL, buffered segment count
- **HLS Segment**: Individual .ts video file that is part of an HLS stream. Generated continuously during streaming
- **Manifest**: The m3u8 playlist file that describes available HLS segments and stream metadata

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete camera selection and stream start within 3 clicks from the dashboard
- **SC-002**: HLS stream URL becomes available within 2 seconds of pressing "Start Streaming"
- **SC-003**: Video playback in the browser begins within 5 seconds of clicking play
- **SC-004**: System successfully streams from at least 2 simultaneous cameras without performance degradation
- **SC-005**: Seeking in the video player responds within 1 second of user interaction
- **SC-006**: The web UI remains responsive even while streaming multiple cameras (no freezing or lag)
- **SC-007**: Streaming can continue for at least 1 hour without crashes or errors
- **SC-008**: Users can complete all major operations (start, stop, play, seek) entirely within the web browser UI
- **SC-009**: At least 90% of attempted stream starts succeed without errors
- **SC-010**: Camera dropdown and streams list load within 1 second of page refresh

## Assumptions

- Users have webcams connected via standard USB or built-in camera interfaces
- Target browsers support HTML5 video player (Chrome, Firefox, Safari, Edge - modern versions)
- The server runs on the same machine or local network as the webcams
- Network bandwidth is sufficient for HLS streaming (assumes reasonable LAN speeds)
- HLS segments can be stored temporarily on the server's local storage
- Users have basic technical knowledge to navigate a web UI (no advanced configuration required)

## Out of Scope

- Cloud streaming or uploading streams to external servers
- User authentication and multi-user permissions
- Recording entire streams to permanent storage
- Real-time analytics or AI processing on video content
- Custom bitrate/resolution management (uses camera defaults)
- Scheduled recording or automation
