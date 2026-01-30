/**
 * HLS Stream Player component
 */

import { useHLSPlayer } from '../hooks/useHLSPlayer';
import { Spinner } from './ui/Spinner';

interface StreamPlayerProps {
  hlsUrl: string | null;
  title?: string;
  className?: string;
}

export function StreamPlayer({ hlsUrl, title, className = '' }: StreamPlayerProps) {
  const {
    videoRef,
    isLoading,
    error,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    setPlaybackRate,
  } = useHLSPlayer(hlsUrl, { autoPlay: true, muted: true });

  if (!hlsUrl) {
    return (
      <div
        className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}
        style={{ aspectRatio: '16/9' }}
      >
        <p className="text-gray-400">No stream available</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        controls
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <Spinner size="lg" className="mx-auto mb-2" />
            <p>Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Custom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
        {title && (
          <p className="text-white text-sm mb-2 truncate">{title}</p>
        )}
        
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <button
            onClick={() => (isPlaying ? pause() : play())}
            className="text-white hover:text-blue-400 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time display */}
          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>

          {/* Playback speed */}
          <select
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            defaultValue="1"
            className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/30"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
