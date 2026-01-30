/**
 * Stream player modal component
 */

import { useEffect } from 'react';
import { StreamPlayer } from './StreamPlayer';
import { StreamStatusBadge } from './StreamStatusBadge';
import type { Stream } from '../lib/types';

interface StreamPlayerModalProps {
  stream: Stream;
  onClose: () => void;
}

export function StreamPlayerModal({ stream, onClose }: StreamPlayerModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatUptime = (startedAt: string | null) => {
    if (!startedAt) return '--:--:--';
    
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-4xl mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Video player */}
        <StreamPlayer
          hlsUrl={stream.hlsUrl}
          title={`Camera: ${stream.cameraId}`}
          className="w-full"
        />

        {/* Stream info overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-3">
            <span className="text-white text-sm font-medium">
              Camera: {stream.cameraId}
            </span>
            <StreamStatusBadge status={stream.status} />
          </div>
          
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-white text-sm font-mono">
              {formatUptime(stream.startedAt)}
            </span>
          </div>
        </div>

        {/* Stream details below video */}
        <div className="mt-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Resolution</span>
              <p className="font-medium">{stream.resolution}</p>
            </div>
            <div>
              <span className="text-gray-400">Framerate</span>
              <p className="font-medium">{stream.framerate} fps</p>
            </div>
            <div>
              <span className="text-gray-400">Stream ID</span>
              <p className="font-medium font-mono text-xs truncate">{stream.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
