import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import routes
import camerasRoute from './routes/cameras.js';
import streamsRoute from './routes/streams.js';
import hlsRoute from './routes/hls.js';

// Import managers for graceful shutdown
import { killAllWorkers } from './lib/ffmpeg/ffmpegWorker.js';
import { getActiveStreamCount } from './lib/stream/streamRegistry.js';

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeStreams: getActiveStreamCount(),
  });
});

// Register routes
app.route('/api/cameras', camerasRoute);
app.route('/api/streams', streamsRoute);
app.route('/hls', hlsRoute);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'HLS Camera Streaming Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      cameras: '/api/cameras',
      streams: '/api/streams',
      hls: '/hls/:streamId/stream.m3u8',
    },
  });
});

// Graceful shutdown handler
let isShuttingDown = false;

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('\n🛑 Shutting down server...');
  console.log('   Stopping all active streams...');
  killAllWorkers();
  console.log('   Goodbye!');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
// On Windows, SIGINT can be triggered unexpectedly, so only register for non-Windows
if (process.platform !== 'win32') {
  process.on('SIGINT', shutdown);
}

// Start server
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
