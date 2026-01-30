/**
 * Stream list component
 */

import { useStreams } from '../hooks/useStreams';
import { StreamListItem } from './StreamListItem';
import { Spinner } from './ui/Spinner';
import type { Stream } from '../lib/types';

interface StreamListProps {
  onPlay: (stream: Stream) => void;
  onDetails?: (stream: Stream) => void;
}

export function StreamList({ onPlay, onDetails }: StreamListProps) {
  const { streams, isLoading, error } = useStreams();

  const activeStreams = streams.filter(
    (s) => s.status === 'running' || s.status === 'starting'
  );

  if (isLoading && streams.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700">
        Failed to load streams: {error.message}
      </div>
    );
  }

  if (activeStreams.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-300"
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
        <p>No active streams</p>
        <p className="text-sm mt-1">Start streaming from a camera to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeStreams.map((stream) => (
        <StreamListItem
          key={stream.id}
          stream={stream}
          onPlay={onPlay}
          onDetails={onDetails}
        />
      ))}
    </div>
  );
}
