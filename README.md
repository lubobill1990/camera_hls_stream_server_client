# HLS Camera Streaming

A web-based application for streaming webcam video using HTTP Live Streaming (HLS). Built with Hono (backend) and React/Vite (frontend).

## Features

- 📹 **Camera Discovery**: Automatically detect connected webcams
- 🎬 **HLS Streaming**: Real-time video streaming using FFmpeg
- 🌐 **Web Player**: In-browser playback with hls.js
- 🎛️ **Stream Controls**: Start, stop, and manage multiple streams
- 📊 **Real-time Status**: Live stream status and uptime tracking
- 🐳 **Docker Ready**: Full Docker Compose setup for deployment

## Prerequisites

- **Node.js** 18 or higher
- **FFmpeg** installed and available in PATH
  - Windows: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org/)
  - macOS: `brew install ffmpeg`
  - Linux: `apt install ffmpeg` or `yum install ffmpeg`

## Quick Start

### 1. Clone and Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../web
npm install
```

### 2. Start Development Servers

**Backend (port 3001):**
```bash
cd server
npm run dev
```

**Frontend (port 5173):**
```bash
cd web
npm run dev
```

### 3. Open the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
playhlscamera/
├── server/                 # Hono backend
│   ├── src/
│   │   ├── index.ts       # App entry point
│   │   ├── routes/        # API routes
│   │   │   ├── cameras.ts # GET /api/cameras
│   │   │   ├── streams.ts # CRUD /api/streams
│   │   │   └── hls.ts     # HLS file serving
│   │   └── lib/
│   │       ├── camera/    # Camera detection
│   │       ├── ffmpeg/    # FFmpeg integration
│   │       ├── stream/    # Stream management
│   │       ├── hls/       # HLS file handling
│   │       └── types/     # TypeScript types
│   └── public/hls/        # HLS output directory
├── web/                    # React/Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # API client & utilities
│   └── index.html
└── docker-compose.yml      # Docker deployment
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/cameras` | GET | List available cameras |
| `/api/streams` | GET | List active streams |
| `/api/streams` | POST | Start new stream |
| `/api/streams/:id` | GET | Get stream details |
| `/api/streams/:id` | DELETE | Stop stream |
| `/hls/:id/stream.m3u8` | GET | HLS manifest |
| `/hls/:id/:segment.ts` | GET | HLS segments |

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
FFMPEG_PATH=ffmpeg
HLS_OUTPUT_DIR=./public/hls
```

## Stream Options

When starting a stream:

| Option | Type | Default | Range |
|--------|------|---------|-------|
| `bitrate` | number | 2500 | 500-8000 kbps |
| `resolution` | string | 1280x720 | - |
| `frameRate` | number | 30 | 1-60 fps |

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Access the app
open http://localhost:8080
```

## Troubleshooting

### No cameras detected
- Ensure camera is connected and not in use
- Restart the backend server

### Stream fails to start
- Verify FFmpeg is installed: `ffmpeg -version`
- Check server logs for errors

### Video not playing
- Ensure stream status is "running"
- Check browser console for errors

## Technology Stack

- **Backend**: Hono, FFmpeg, TypeScript
- **Frontend**: React 19, Vite, Tailwind CSS, hls.js, TanStack Query

## License

ISC
