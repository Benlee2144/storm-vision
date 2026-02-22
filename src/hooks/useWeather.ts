'use client';
import { useQuery } from '@tanstack/react-query';
import { getWeather, getAirQuality } from '@/lib/api/openmeteo';

export function useWeather(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => getWeather(lat!, lon!),
    enabled: lat != null && lon != null,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 3,
  });
}

export function useAirQuality(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['air-quality', lat, lon],
    queryFn: () => getAirQuality(lat!, lon!),
    enabled: lat != null && lon != null,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });
}
