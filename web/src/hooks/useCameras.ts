/**
 * React Query hook for cameras
 */

import { useQuery } from '@tanstack/react-query';
import { getCameras } from '../lib/api';
import type { CameraDevice } from '../lib/types';

export function useCameras() {
  const query = useQuery<CameraDevice[], Error>({
    queryKey: ['cameras'],
    queryFn: getCameras,
    staleTime: 5000,
    refetchInterval: 10000, // Refresh camera list every 10 seconds
  });

  return {
    cameras: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
