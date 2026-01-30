/**
 * Stream controls component
 */

import { useState } from 'react';
import { useStartStream, useStopStream } from '../hooks/useStreams';
import { Spinner } from './ui/Spinner';
import { StreamStatusBadge } from './StreamStatusBadge';
import type { CameraDevice, Stream } from '../lib/types';

interface StreamControlsProps {
  selectedCamera: CameraDevice | null;
  activeStream: Stream | null;
  onStreamStarted?: (stream: Stream) => void;
  onStreamStopped?: () => void;
}

export function StreamControls({
  selectedCamera,
  activeStream,
  onStreamStarted,
  onStreamStopped,
}: StreamControlsProps) {
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  const startMutation = useStartStream();
  const stopMutation = useStopStream();

  const handleStart = async () => {
    if (!selectedCamera) return;

    try {
      const stream = await startMutation.mutateAsync({
        cameraId: selectedCamera.id,
        options: {
          resolution: '1280x720',
          frameRate: 30,
        },
      });
      onStreamStarted?.(stream);
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const handleStop = async () => {
    if (!activeStream) return;

    try {
      await stopMutation.mutateAsync(activeStream.id);
      setShowConfirmStop(false);
      onStreamStopped?.();
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

  const isLoading = startMutation.isPending || stopMutation.isPending;

  // No camera selected
  if (!selectedCamera && !activeStream) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        Select a camera to start streaming
      </div>
    );
  }

  // Has active stream
  if (activeStream) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Active Stream</h3>
            <p className="text-sm text-gray-500">
              {activeStream.resolution} @ {activeStream.framerate}fps
            </p>
          </div>
          <StreamStatusBadge status={activeStream.status} />
        </div>

        {activeStream.hlsUrl && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              HLS URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeStream.hlsUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(activeStream.hlsUrl!)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy URL"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
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
          </div>
        )}

        {activeStream.error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {activeStream.error}
          </div>
        )}

        {showConfirmStop ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Stop streaming?</span>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {stopMutation.isPending && <Spinner size="sm" />}
              Confirm
            </button>
            <button
              onClick={() => setShowConfirmStop(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmStop(true)}
            disabled={
              isLoading ||
              activeStream.status === 'stopping' ||
              activeStream.status === 'stopped'
            }
            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
          >
            Stop Streaming
          </button>
        )}
      </div>
    );
  }

  // Camera selected, no active stream
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
      <div>
        <h3 className="font-medium text-gray-900">{selectedCamera?.name}</h3>
        <p className="text-sm text-gray-500">Ready to stream</p>
      </div>

      {startMutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {startMutation.error?.message || 'Failed to start stream'}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={isLoading || !selectedCamera}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {startMutation.isPending ? (
          <>
            <Spinner size="sm" />
            Starting...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Start Streaming
          </>
        )}
      </button>
    </div>
  );
}
