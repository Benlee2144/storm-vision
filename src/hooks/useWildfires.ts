'use client';
import { useQuery } from '@tanstack/react-query';
import { getActiveWildfires, getWildfirePerimetersGeoJSON } from '@/lib/api/wildfires';

export function useWildfires() {
  return useQuery({
    queryKey: ['wildfires'],
    queryFn: getActiveWildfires,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });
}

export function useWildfirePerimeters() {
  return useQuery({
    queryKey: ['wildfires', 'perimeters'],
    queryFn: getWildfirePerimetersGeoJSON,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });
}
