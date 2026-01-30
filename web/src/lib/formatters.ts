/**
 * Formatting utilities
 */

/**
 * Format uptime in seconds to HH:MM:SS
 */
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Format ISO timestamp to human readable
 */
export function formatTimestamp(iso: string | null): string {
  if (!iso) return '-';
  
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format bitrate to human readable
 */
export function formatBitrate(bitrateStr: string | undefined): string {
  if (!bitrateStr) return 'Auto';
  
  // Handle formats like "2500k" or "5M"
  const match = bitrateStr.match(/^(\d+)([kKmM])?$/);
  if (!match) return bitrateStr;
  
  const value = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase();
  
  if (unit === 'm') {
    return `${value} Mbps`;
  }
  return `${value} Kbps`;
}

/**
 * Calculate uptime from start timestamp
 */
export function calculateUptime(startedAt: string | null): number {
  if (!startedAt) return 0;
  
  const start = new Date(startedAt);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 1000);
}
