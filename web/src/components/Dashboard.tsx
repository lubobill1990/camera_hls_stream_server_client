/**
 * Main Dashboard component
 */

import { useState } from 'react';
import { CameraSelector } from './CameraSelector';
import { StreamControls } from './StreamControls';
import { StreamList } from './StreamList';
import { StreamPlayerModal } from './StreamPlayerModal';
import { StreamDetailsModal } from './StreamDetailsModal';
import type { CameraDevice, Stream } from '../lib/types';

export function Dashboard() {
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [playingStream, setPlayingStream] = useState<Stream | null>(null);
  const [detailsStream, setDetailsStream] = useState<Stream | null>(null);

  const handleStreamStarted = (stream: Stream) => {
    setActiveStream(stream);
    // Clear camera selection since it's now in use
    setSelectedCamera(null);
  };

  const handleStreamStopped = () => {
    setActiveStream(null);
  };

  const handlePlay = (stream: Stream) => {
    setPlayingStream(stream);
  };

  const handleDetails = (stream: Stream) => {
    setDetailsStream(stream);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                HLS Camera Streaming
              </h1>
              <p className="text-sm text-gray-500">
                Stream your webcam with HTTP Live Streaming
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Camera selection and controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Camera Selection
              </h2>
              <CameraSelector
                selectedCamera={selectedCamera}
                onSelect={setSelectedCamera}
                disabled={activeStream !== null}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Stream Controls
              </h2>
              <StreamControls
                selectedCamera={selectedCamera}
                activeStream={activeStream}
                onStreamStarted={handleStreamStarted}
                onStreamStopped={handleStreamStopped}
              />
            </div>
          </div>

          {/* Right column - Active streams */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Streams
              </h2>
              <StreamList onPlay={handlePlay} onDetails={handleDetails} />
            </div>
          </div>
        </div>
      </main>

      {/* Player modal */}
      {playingStream && (
        <StreamPlayerModal
          stream={playingStream}
          onClose={() => setPlayingStream(null)}
        />
      )}

      {/* Details modal */}
      {detailsStream && (
        <StreamDetailsModal
          stream={detailsStream}
          onClose={() => setDetailsStream(null)}
        />
      )}
    </div>
  );
}
