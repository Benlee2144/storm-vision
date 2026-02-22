'use client';
import { useMemo } from 'react';
import { useNationalAlerts } from '@/hooks/useAlerts';
import cameras from '@/data/cameras.json';
import { matchCamerasToAlerts, getAllStormCameras } from '@/lib/utils/geo';
import type { CameraData } from '@/components/cameras/CameraCard';

const allCameras = cameras as CameraData[];

export function useStormCams() {
  const { data: alerts, isLoading, error } = useNationalAlerts();

  const groups = useMemo(() => {
    if (!alerts) return [];
    return matchCamerasToAlerts(allCameras, alerts);
  }, [alerts]);

  const flatCameras = useMemo(() => {
    if (!alerts) return [];
    return getAllStormCameras(allCameras, alerts);
  }, [alerts]);

  const tornadoWarningCount = useMemo(() => {
    if (!alerts) return 0;
    return alerts.filter((a) => a.properties.event === 'Tornado Warning').length;
  }, [alerts]);

  const severeStormCount = useMemo(() => {
    if (!alerts) return 0;
    return alerts.filter((a) => a.properties.event === 'Severe Thunderstorm Warning').length;
  }, [alerts]);

  return {
    groups,
    flatCameras,
    alerts: alerts || [],
    tornadoWarningCount,
    severeStormCount,
    totalCamerasInDanger: flatCameras.length,
    isLoading,
    error,
  };
}
