'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Droplets, Snowflake, Wind, Flame } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { AlertCard } from '@/components/weather/AlertCard';
import { useNationalAlerts } from '@/hooks/useAlerts';
import { getAlertConfig } from '@/lib/constants/alert-types';
import { formatTimeAgo } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SevereWeatherPage() {
  const { data: alerts, isLoading } = useNationalAlerts();

  const categorized = useMemo(() => {
    if (!alerts) return { warnings: [], watches: [], advisories: [], statements: [] };

    const warnings = alerts.filter((a) =>
      a.properties.event.toLowerCase().includes('warning')
    );
    const watches = alerts.filter((a) =>
      a.properties.event.toLowerCase().includes('watch')
    );
    const advisories = alerts.filter((a) =>
      a.properties.event.toLowerCase().includes('advisory')
    );
    const statements = alerts.filter(
      (a) =>
        !a.properties.event.toLowerCase().includes('warning') &&
        !a.properties.event.toLowerCase().includes('watch') &&
        !a.properties.event.toLowerCase().includes('advisory')
    );

    return { warnings, watches, advisories, statements };
  }, [alerts]);

  const stats = useMemo(() => {
    if (!alerts) return [];
    const eventCounts: Record<string, number> = {};
    alerts.forEach((a) => { eventCounts[a.properties.event] = (eventCounts[a.properties.event] || 0) + 1; });
    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [alerts]);

  const tornadoWarnings = (alerts || []).filter((a) => a.properties.event === 'Tornado Warning');
  const severeStorms = (alerts || []).filter((a) => a.properties.event === 'Severe Thunderstorm Warning');

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/10 flex items-center justify-center">
              <AlertTriangle className="text-[var(--danger)]" size={22} />
            </div>
            Severe Weather Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Real-time severe weather tracking across the United States
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-xl p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* National Summary */}
            <GlassCard className="mb-6">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                Current Threat Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ThreatStat
                  icon={<Zap size={20} />}
                  label="Tornado Warnings"
                  count={tornadoWarnings.length}
                  color="var(--danger)"
                  pulse={tornadoWarnings.length > 0}
                />
                <ThreatStat
                  icon={<AlertTriangle size={20} />}
                  label="Severe T-Storm"
                  count={severeStorms.length}
                  color="var(--warning)"
                  pulse={severeStorms.length > 0}
                />
                <ThreatStat
                  icon={<Droplets size={20} />}
                  label="Flood Warnings"
                  count={(alerts || []).filter((a) => a.properties.event.includes('Flood') && a.properties.event.includes('Warning')).length}
                  color="#00cc66"
                />
                <ThreatStat
                  icon={<Snowflake size={20} />}
                  label="Winter Warnings"
                  count={(alerts || []).filter((a) => (a.properties.event.includes('Winter') || a.properties.event.includes('Blizzard') || a.properties.event.includes('Ice')) && a.properties.event.includes('Warning')).length}
                  color="var(--info)"
                />
              </div>

              {stats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex flex-wrap gap-2">
                    {stats.map(([event, count]) => {
                      const config = getAlertConfig(event);
                      return (
                        <span
                          key={event}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                          style={{ background: `${config.color}15`, color: config.color }}
                        >
                          <span className="font-bold data-mono">{count}</span>
                          {event}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Tornado Warnings - Priority */}
            {tornadoWarnings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--danger)] flex items-center gap-2 mb-3">
                  <Zap size={20} />
                  ACTIVE TORNADO WARNINGS
                  <Badge variant="danger" pulse>{tornadoWarnings.length}</Badge>
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {tornadoWarnings.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            )}

            {/* All Warnings */}
            {categorized.warnings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  Active Warnings
                  <Badge variant="warning">{categorized.warnings.length}</Badge>
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {categorized.warnings.slice(0, 20).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
                {categorized.warnings.length > 20 && (
                  <p className="text-sm text-[var(--text-tertiary)] mt-3 text-center">
                    + {categorized.warnings.length - 20} more warnings
                  </p>
                )}
              </div>
            )}

            {/* Watches */}
            {categorized.watches.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  Active Watches
                  <Badge variant="caution">{categorized.watches.length}</Badge>
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {categorized.watches.slice(0, 12).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Advisories */}
            {categorized.advisories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  Advisories
                  <Badge variant="info">{categorized.advisories.length}</Badge>
                </h2>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {categorized.advisories.slice(0, 12).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} compact />
                  ))}
                </div>
              </div>
            )}

            {(alerts?.length || 0) === 0 && (
              <GlassCard className="text-center py-12">
                <div className="text-5xl mb-4">&#9728;&#65039;</div>
                <h2 className="text-xl font-semibold mb-2">All Clear</h2>
                <p className="text-[var(--text-secondary)]">
                  No severe weather alerts active across the United States
                </p>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ThreatStat({
  icon, label, count, color, pulse = false,
}: {
  icon: React.ReactNode; label: string; count: number; color: string; pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
      <div className="shrink-0" style={{ color }}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold data-mono ${pulse && count > 0 ? 'animate-pulse-primary' : ''}`} style={{ color: count > 0 ? color : 'var(--text-tertiary)' }}>
          {count}
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
