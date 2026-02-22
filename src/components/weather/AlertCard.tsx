'use client';
import { getAlertConfig } from '@/lib/constants/alert-types';
import { formatTimeAgo, formatDateTime } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Clock, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { NWSAlertFeature } from '@/lib/api/nws';

interface Props {
  alert: NWSAlertFeature;
  compact?: boolean;
}

export function AlertCard({ alert, compact = false }: Props) {
  const { properties: p } = alert;
  const config = getAlertConfig(p.event);
  const isExpiring = p.expires && new Date(p.expires).getTime() - Date.now() < 30 * 60 * 1000;

  const severityVariant = p.severity === 'Extreme' ? 'danger'
    : p.severity === 'Severe' ? 'warning'
    : p.severity === 'Moderate' ? 'caution'
    : 'info';

  if (compact) {
    return (
      <Link href="/alerts" className="block">
        <div
          className="flex items-center gap-2.5 p-2.5 rounded-xl glass hover:bg-white/5 transition-colors cursor-pointer"
          style={{ borderLeft: `3px solid ${config.color}` }}
        >
          <AlertTriangle size={14} style={{ color: config.color }} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: config.color }}>{p.event}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
              {p.areaDesc?.split(';')[0]?.trim()}
            </p>
          </div>
          <ChevronRight size={12} className="text-[var(--text-tertiary)] shrink-0" />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/alerts" className="block">
      <div
        className="p-4 rounded-xl glass hover:bg-white/5 transition-all duration-200 group"
        style={{ borderLeft: `4px solid ${config.color}` }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: config.color }} />
            <h4 className="font-semibold text-sm">{p.event}</h4>
          </div>
          <Badge variant={severityVariant} size="sm" pulse={p.severity === 'Extreme'}>
            {p.severity}
          </Badge>
        </div>

        {p.headline && (
          <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
            {p.headline}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {p.areaDesc?.split(';').slice(0, 2).join(', ')}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {p.expires ? (
              isExpiring
                ? `Expires ${formatTimeAgo(p.expires)}`
                : `Until ${formatDateTime(p.expires)}`
            ) : (
              `Issued ${formatTimeAgo(p.sent)}`
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
