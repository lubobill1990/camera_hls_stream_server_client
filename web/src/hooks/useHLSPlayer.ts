/**
 * HLS Player hook using hls.js
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface UseHLSPlayerOptions {
  autoPlay?: boolean;
  muted?: boolean;
}

interface UseHLSPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
}

export function useHLSPlayer(
  hlsUrl: string | null,
  options: UseHLSPlayerOptions = {}
): UseHLSPlayerReturn {
  const { autoPlay = true, muted = false } = options;
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize HLS.js
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    const video = videoRef.current;
    
    // Check for native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.muted = muted;
      
      if (autoPlay) {
        video.play().catch(console.error);
      }
      
      setIsLoading(false);
      return;
    }

    // Use HLS.js for other browsers
    if (!Hls.isSupported()) {
      setError('HLS is not supported in this browser');
      setIsLoading(false);
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
    });

    hlsRef.current = hls;

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setIsLoading(false);
      setError(null);
      
      video.muted = muted;
      
      if (autoPlay) {
        video.play().catch(console.error);
      }
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            setError('Network error - retrying...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            setError('Media error - recovering...');
            hls.recoverMediaError();
            break;
          default:
            setError(`Fatal error: ${data.details}`);
            break;
        }
      }
    });

    // Cleanup
    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl, autoPlay, muted]);

  // Update time tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const play = useCallback(() => {
    videoRef.current?.play().catch(console.error);
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  return {
    videoRef,
    isLoading,
    isPlaying,
    error,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    setPlaybackRate,
  };
}
