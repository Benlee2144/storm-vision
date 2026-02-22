'use client';
import { useQuery } from '@tanstack/react-query';
import { getRadarFrames } from '@/lib/api/rainviewer';

export function useRadarFrames() {
  return useQuery({
    queryKey: ['radar-frames'],
    queryFn: getRadarFrames,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
  });
}
