/**
 * Camera selector dropdown component
 */

import { useCameras } from '../hooks/useCameras';
import { Spinner } from './ui/Spinner';
import type { CameraDevice } from '../lib/types';

interface CameraSelectorProps {
  selectedCamera: CameraDevice | null;
  onSelect: (camera: CameraDevice | null) => void;
  disabled?: boolean;
}

const cameraTypeLabels: Record<string, string> = {
  builtin: 'Built-in',
  usb: 'USB',
  virtual: 'Virtual',
  unknown: 'Unknown',
};

export function CameraSelector({
  selectedCamera,
  onSelect,
  disabled = false,
}: CameraSelectorProps) {
  const { cameras, isLoading, error, refetch } = useCameras();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <Spinner size="sm" />
        <span className="text-gray-600">Loading cameras...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-700 mb-2">Failed to load cameras</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const availableCameras = cameras.filter((cam) => cam.status === 'available');
  const inUseCameras = cameras.filter((cam) => cam.status === 'in-use');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Select Camera
      </label>

      {cameras.length === 0 ? (
        <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700">
          <p>No cameras detected.</p>
          <p className="text-sm mt-1">
            Make sure your camera is connected and not being used by another
            application.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {availableCameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => onSelect(camera)}
              disabled={disabled}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedCamera?.id === camera.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-500"
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
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{camera.name}</p>
                  <p className="text-sm text-gray-500">
                    {cameraTypeLabels[camera.type]}
                  </p>
                </div>
              </div>
              <span className="w-3 h-3 bg-green-500 rounded-full" title="Available" />
            </button>
          ))}

          {inUseCameras.map((camera) => (
            <div
              key={camera.id}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-700">{camera.name}</p>
                  <p className="text-sm text-gray-400">In use</p>
                </div>
              </div>
              <span className="w-3 h-3 bg-yellow-500 rounded-full" title="In use" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
