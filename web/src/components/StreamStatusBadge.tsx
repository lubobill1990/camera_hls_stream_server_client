/**
 * Stream status badge component
 */

import type { StreamStatus } from '../lib/types';

interface StreamStatusBadgeProps {
  status: StreamStatus;
}

const statusConfig: Record<StreamStatus, { bg: string; text: string; label: string }> = {
  starting: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Starting' },
  running: { bg: 'bg-green-100', text: 'text-green-800', label: 'Running' },
  stopping: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Stopping' },
  stopped: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Stopped' },
  error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' },
};

export function StreamStatusBadge({ status }: StreamStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {status === 'running' && (
        <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
