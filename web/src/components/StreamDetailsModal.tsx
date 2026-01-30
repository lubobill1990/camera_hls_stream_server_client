/**
 * Stream details modal component
 */

import { useEffect } from 'react';
import { StreamStatusBadge } from './StreamStatusBadge';
import { formatUptime, formatTimestamp, formatBitrate, calculateUptime } from '../lib/formatters';
import type { Stream } from '../lib/types';

interface StreamDetailsModalProps {
  stream: Stream;
  onClose: () => void;
}

export function StreamDetailsModal({ stream, onClose }: StreamDetailsModalProps) {
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

  const uptime = calculateUptime(stream.startedAt);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Stream Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <StreamStatusBadge status={stream.status} />
          </div>

          {/* Stream ID */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Stream ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-gray-100 px-3 py-2 rounded truncate">
                {stream.id}
              </code>
              <button
                onClick={() => copyToClipboard(stream.id)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Copy"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Camera ID */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Camera ID</label>
            <p className="text-sm font-medium text-gray-900">{stream.cameraId}</p>
          </div>

          {/* Grid of details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Resolution</label>
              <p className="text-sm font-medium text-gray-900">{stream.resolution}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Frame Rate</label>
              <p className="text-sm font-medium text-gray-900">{stream.framerate} fps</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Video Bitrate</label>
              <p className="text-sm font-medium text-gray-900">{formatBitrate(stream.videoBitrate)}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Audio Bitrate</label>
              <p className="text-sm font-medium text-gray-900">{formatBitrate(stream.audioBitrate)}</p>
            </div>
          </div>

          {/* Time info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Started At</label>
              <p className="text-sm font-medium text-gray-900">
                {formatTimestamp(stream.startedAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Uptime</label>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {formatUptime(uptime)}
              </p>
            </div>
          </div>

          {/* HLS URL */}
          {stream.hlsUrl && (
            <div className="pt-2 border-t">
              <label className="block text-sm text-gray-500 mb-1">HLS URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={stream.hlsUrl}
                  className="flex-1 text-sm font-mono bg-gray-100 px-3 py-2 rounded border-0"
                />
                <button
                  onClick={() => copyToClipboard(stream.hlsUrl!)}
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                  title="Copy URL"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {stream.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              <strong>Error:</strong> {stream.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
