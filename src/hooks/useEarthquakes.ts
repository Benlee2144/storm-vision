'use client';
import { useQuery } from '@tanstack/react-query';
import { getRecentEarthquakes, getSignificantEarthquakes } from '@/lib/api/earthquakes';

export function useEarthquakes(period: 'hour' | 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: ['earthquakes', period],
    queryFn: () => getRecentEarthquakes(period),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useSignificantEarthquakes() {
  return useQuery({
    queryKey: ['earthquakes', 'significant'],
    queryFn: getSignificantEarthquakes,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });
}
