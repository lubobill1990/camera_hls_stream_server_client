/**
 * React Query hooks for streams
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStreams, startStream, stopStream, getStream } from '../lib/api';
import type { Stream } from '../lib/types';

/**
 * Hook for fetching all streams with polling
 */
export function useStreams() {
  const query = useQuery<Stream[], Error>({
    queryKey: ['streams'],
    queryFn: getStreams,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  return {
    streams: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching a single stream
 */
export function useStream(streamId: string | null) {
  const query = useQuery<Stream, Error>({
    queryKey: ['stream', streamId],
    queryFn: () => getStream(streamId!),
    enabled: !!streamId,
    refetchInterval: 2000,
  });

  return {
    stream: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for starting a stream
 */
export function useStartStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      cameraId, 
      options 
    }: { 
      cameraId: string; 
      options?: { bitrate?: number; resolution?: string; frameRate?: number } 
    }) => startStream(cameraId, options),
    onSuccess: () => {
      // Invalidate streams list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
  });
}

/**
 * Hook for stopping a stream
 */
export function useStopStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (streamId: string) => stopStream(streamId),
    onSuccess: () => {
      // Invalidate streams list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
  });
}
