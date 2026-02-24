'use client';
import { useState } from 'react';
import { useNationalAlerts } from '@/hooks/useAlerts';
import { getAlertConfig } from '@/lib/constants/alert-types';
import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

export function AlertTicker() {
  const { data: alerts } = useNationalAlerts();
  const [dismissed, setDismissed] = useState(false);

  const severeAlerts = (alerts || []).filter((a) => {
    const sev = a.properties.severity;
    return sev === 'Extreme' || sev === 'Severe';
  }).slice(0, 30);

  if (severeAlerts.length === 0 || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-[var(--danger)]/90 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center h-full">
        <div className="flex items-center h-full animate-ticker whitespace-nowrap">
          {[...severeAlerts, ...severeAlerts].map((alert, i) => {
            const config = getAlertConfig(alert.properties.event);
            return (
              <Link
                key={`${alert.id}-${i}`}
                href="/alerts"
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
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss alerts ticker"
        >
          <X size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
