'use client';
import { useNationalAlerts } from '@/hooks/useAlerts';
import { getAlertConfig } from '@/lib/constants/alert-types';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function AlertBanner() {
  const { data: alerts } = useNationalAlerts();

  const severeAlerts = (alerts || []).filter((a) => {
    const sev = a.properties.severity;
    return sev === 'Extreme' || sev === 'Severe';
  }).slice(0, 20);

  if (severeAlerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-[var(--danger)]/90 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center h-full animate-ticker whitespace-nowrap">
        {[...severeAlerts, ...severeAlerts].map((alert, i) => {
          const config = getAlertConfig(alert.properties.event);
          return (
            <Link
              key={`${alert.id}-${i}`}
              href={`/alerts`}
              className="inline-flex items-center gap-2 px-6 text-white text-xs font-medium hover:underline"
            >
              <AlertTriangle size={12} style={{ color: config.color }} />
              <span className="font-bold">{alert.properties.event}</span>
              <span className="opacity-80">
                {alert.properties.areaDesc?.split(';')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
