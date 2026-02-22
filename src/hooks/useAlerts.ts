'use client';
import { useQuery } from '@tanstack/react-query';
import { getActiveAlerts, type NWSAlertFeature } from '@/lib/api/nws';

export function useAlerts(params?: { area?: string; point?: string }) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => getActiveAlerts(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}

export function useNationalAlerts() {
  return useQuery({
    queryKey: ['alerts', 'national'],
    queryFn: () => getActiveAlerts(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}

export function useSevereAlerts() {
  return useQuery({
    queryKey: ['alerts', 'severe'],
    queryFn: async () => {
      const alerts = await getActiveAlerts();
      return alerts.filter((a: NWSAlertFeature) => {
        const event = a.properties.event.toLowerCase();
        return event.includes('tornado') ||
          event.includes('severe thunderstorm') ||
          event.includes('flash flood') ||
          event.includes('hurricane') ||
          event.includes('typhoon');
      });
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2,
  });
}
