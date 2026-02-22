'use client';
import { useMemo, useState, useEffect } from 'react';
import { useNationalAlerts } from '@/hooks/useAlerts';
import { matchCamerasToAlerts, getAllStormCameras } from '@/lib/utils/geo';
import { fetchCamerasForStates } from '@/hooks/useCameras';
import type { CameraData } from '@/components/cameras/CameraCard';

export function useStormCams() {
  const { data: alerts, isLoading: alertsLoading, error } = useNationalAlerts();
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);

  // Determine which states have active alerts, then load those state camera files
  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    // Extract state codes from alert area descriptions
    const stateCodesFromAlerts = new Set<string>();
    alerts.forEach((a) => {
      const area = a.properties.areaDesc || '';
      // NWS area descriptions typically contain state abbreviations
      const matches = area.match(/\b[A-Z]{2}\b/g);
      if (matches) {
        matches.forEach((m) => stateCodesFromAlerts.add(m));
      }
    });

    // Common US state codes to filter out non-state matches
    const validStates = new Set([
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
      'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
      'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
      'VA','WA','WV','WI','WY','DC',
    ]);

    const stateCodes = Array.from(stateCodesFromAlerts).filter((c) => validStates.has(c));
    if (stateCodes.length === 0) return;

    setCamerasLoading(true);
    fetchCamerasForStates(stateCodes)
      .then((cams) => setCameras(cams))
      .finally(() => setCamerasLoading(false));
  }, [alerts]);

  const groups = useMemo(() => {
    if (!alerts || cameras.length === 0) return [];
    return matchCamerasToAlerts(cameras, alerts);
  }, [alerts, cameras]);

  const flatCameras = useMemo(() => {
    if (!alerts || cameras.length === 0) return [];
    return getAllStormCameras(cameras, alerts);
  }, [alerts, cameras]);

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
    isLoading: alertsLoading || camerasLoading,
    error,
  };
}
