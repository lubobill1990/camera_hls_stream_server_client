/**
 * Stream list item component
 */

import { useState } from 'react';
import { StreamStatusBadge } from './StreamStatusBadge';
import { useStopStream } from '../hooks/useStreams';
import { Spinner } from './ui/Spinner';
import type { Stream } from '../lib/types';

interface StreamListItemProps {
  stream: Stream;
  onPlay: (stream: Stream) => void;
  onDetails?: (stream: Stream) => void;
}

export function StreamListItem({ stream, onPlay, onDetails }: StreamListItemProps) {
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const stopMutation = useStopStream();

  const handleStop = async () => {
    try {
      await stopMutation.mutateAsync(stream.id);
      setShowConfirmStop(false);
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

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

  const isActive = stream.status === 'running' || stream.status === 'starting';

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">
              Camera: {stream.cameraId}
            </h3>
            <StreamStatusBadge status={stream.status} />
          </div>
          <p className="text-sm text-gray-500">
            {stream.resolution} @ {stream.framerate}fps
          </p>
        </div>
        
        {isActive && (
          <span className="text-sm font-mono text-gray-600">
            {formatUptime(stream.startedAt)}
          </span>
        )}
      </div>

      {stream.hlsUrl && (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded truncate">
            {stream.hlsUrl}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(stream.hlsUrl!)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Copy URL"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      )}

      {stream.error && (
        <div className="p-2 bg-red-50 text-red-700 rounded text-sm">
          {stream.error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {isActive && stream.hlsUrl && (
          <button
            onClick={() => onPlay(stream)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
        )}

        {onDetails && (
          <button
            onClick={() => onDetails(stream)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            Details
          </button>
        )}

        {isActive && (
          showConfirmStop ? (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleStop}
                disabled={stopMutation.isPending}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                {stopMutation.isPending && <Spinner size="sm" />}
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmStop(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmStop(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm ml-auto"
            >
              Stop
            </button>
          )
        )}
      </div>
    </div>
  );
}
