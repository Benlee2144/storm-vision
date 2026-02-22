'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, AlertTriangle, Camera, Radio, MapPin, Clock,
  ChevronDown, ChevronUp, Eye, Map, CloudLightning, Shield,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { CameraCard } from '@/components/cameras/CameraCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStormCams } from '@/hooks/useStormCams';
import { getAlertConfig } from '@/lib/constants/alert-types';
import { formatTimeAgo, formatDateTime } from '@/lib/utils/formatters';
import type { StormCamGroup } from '@/lib/utils/geo';

export default function StormCamsPage() {
  const {
    groups,
    tornadoWarningCount,
    severeStormCount,
    totalCamerasInDanger,
    isLoading,
  } = useStormCams();

  const tornadoGroups = useMemo(
    () => groups.filter((g) => g.alert.properties.event === 'Tornado Warning'),
    [groups]
  );
  const severeGroups = useMemo(
    () => groups.filter((g) => g.alert.properties.event === 'Severe Thunderstorm Warning'),
    [groups]
  );
  const otherGroups = useMemo(
    () =>
      groups.filter(
        (g) =>
          g.alert.properties.event !== 'Tornado Warning' &&
          g.alert.properties.event !== 'Severe Thunderstorm Warning'
      ),
    [groups]
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Shield className="text-[var(--danger)]" size={28} />
              {totalCamerasInDanger > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--danger)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--danger)]" />
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Storm Cams</h1>
            <Badge variant="danger" pulse={tornadoWarningCount > 0}>LIVE</Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Real-time cameras in active tornado warnings, severe thunderstorm warnings, and dangerous weather zones.
            Auto-refreshes every 30 seconds.
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : totalCamerasInDanger === 0 ? (
          <AllClearState />
        ) : (
          <>
            {/* Threat Dashboard */}
            <GlassCard className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DangerStat
                  icon={<Zap size={22} />}
                  label="Tornado Warnings"
                  count={tornadoWarningCount}
                  cameras={tornadoGroups.reduce((s, g) => s + g.cameras.length, 0)}
                  color="var(--danger)"
                  pulse
                />
                <DangerStat
                  icon={<CloudLightning size={22} />}
                  label="Severe T-Storms"
                  count={severeStormCount}
                  cameras={severeGroups.reduce((s, g) => s + g.cameras.length, 0)}
                  color="var(--warning)"
                  pulse={severeStormCount > 0}
                />
                <DangerStat
                  icon={<Camera size={22} />}
                  label="Cameras in Zones"
                  count={totalCamerasInDanger}
                  color="var(--primary)"
                />
                <DangerStat
                  icon={<Radio size={22} />}
                  label="Warning Zones"
                  count={groups.length}
                  color="var(--info)"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-3">
                <Link
                  href="/radar"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm hover:bg-[var(--primary)]/20 transition-colors"
                >
                  <Map size={14} />
                  View on Radar
                </Link>
                <Link
                  href="/severe"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-[var(--text-secondary)] text-sm hover:bg-white/10 transition-colors"
                >
                  <AlertTriangle size={14} />
                  All Alerts
                </Link>
              </div>
            </GlassCard>

            {/* Tornado Warning Groups — Highest Priority */}
            {tornadoGroups.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} className="text-[var(--danger)]" />
                  <h2 className="text-lg font-bold text-[var(--danger)] uppercase tracking-wide">
                    Tornado Warnings
                  </h2>
                  <Badge variant="danger" pulse>
                    {tornadoGroups.length} {tornadoGroups.length === 1 ? 'zone' : 'zones'}
                  </Badge>
                </div>
                <div className="space-y-6">
                  {tornadoGroups.map((group) => (
                    <WarningCamGroup key={group.alert.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {/* Severe Thunderstorm Groups */}
            {severeGroups.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CloudLightning size={20} className="text-[var(--warning)]" />
                  <h2 className="text-lg font-bold text-[var(--warning)]">
                    Severe Thunderstorm Warnings
                  </h2>
                  <Badge variant="warning">
                    {severeGroups.length} {severeGroups.length === 1 ? 'zone' : 'zones'}
                  </Badge>
                </div>
                <div className="space-y-6">
                  {severeGroups.map((group) => (
                    <WarningCamGroup key={group.alert.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Severe Groups */}
            {otherGroups.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} className="text-[var(--info)]" />
                  <h2 className="text-lg font-bold">Other Severe Warnings</h2>
                  <Badge variant="info">{otherGroups.length}</Badge>
                </div>
                <div className="space-y-6">
                  {otherGroups.map((group) => (
                    <WarningCamGroup key={group.alert.id} group={group} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WarningCamGroup({ group }: { group: StormCamGroup }) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const config = getAlertConfig(group.alert.properties.event);
  const p = group.alert.properties;

  const visibleCams = showAll ? group.cameras : group.cameras.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
      style={{ borderLeft: `4px solid ${config.color}` }}
    >
      {/* Alert Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <AlertTriangle size={20} style={{ color: config.color }} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm" style={{ color: config.color }}>
              {p.event}
            </h3>
            <Badge
              variant={p.severity === 'Extreme' ? 'danger' : p.severity === 'Severe' ? 'warning' : 'caution'}
              size="sm"
              pulse={p.event === 'Tornado Warning'}
            >
              {p.severity}
            </Badge>
            <Badge size="sm">
              <Camera size={10} className="mr-1" />
              {group.cameras.length} {group.cameras.length === 1 ? 'camera' : 'cameras'}
            </Badge>
          </div>

          {p.headline && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-1.5">{p.headline}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {p.areaDesc?.split(';').slice(0, 3).join(', ')}
            </span>
            {p.expires && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Expires {formatTimeAgo(p.expires)}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Camera Grid */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {p.instruction && (
              <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--text-secondary)]">
                <strong className="text-[var(--danger)]">Safety:</strong> {p.instruction.slice(0, 200)}
                {p.instruction.length > 200 ? '...' : ''}
              </div>
            )}

            <div className="px-4 pb-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCams.map((cam) => (
                <CameraCard key={cam.id} camera={cam} showEmbed />
              ))}
            </div>

            {group.cameras.length > 6 && (
              <div className="px-4 pb-4 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                >
                  <Eye size={14} />
                  {showAll
                    ? 'Show fewer'
                    : `Show all ${group.cameras.length} cameras`}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DangerStat({
  icon,
  label,
  count,
  cameras,
  color,
  pulse = false,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  cameras?: number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
      <div className="shrink-0" style={{ color: count > 0 ? color : 'var(--text-tertiary)' }}>
        {icon}
      </div>
      <div>
        <p
          className={`text-2xl font-bold data-mono ${pulse && count > 0 ? 'animate-pulse-primary' : ''}`}
          style={{ color: count > 0 ? color : 'var(--text-tertiary)' }}
        >
          {count}
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
        {cameras !== undefined && cameras > 0 && (
          <p className="text-[10px] text-[var(--text-secondary)]">
            {cameras} {cameras === 1 ? 'cam' : 'cams'} in zone
          </p>
        )}
      </div>
    </div>
  );
}

function AllClearState() {
  return (
    <GlassCard className="text-center py-16">
      <div className="text-6xl mb-4">&#9728;&#65039;</div>
      <h2 className="text-xl font-semibold mb-2">No Active Storm Cameras</h2>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        There are currently no tornado warnings, severe thunderstorm warnings, or other
        dangerous weather alerts with cameras in the affected zones. This page automatically
        activates when storms threaten areas with live cameras.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/severe"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-[var(--text-secondary)] text-sm hover:bg-white/15 transition-colors"
        >
          <AlertTriangle size={16} />
          View All Alerts
        </Link>
        <Link
          href="/cameras"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-[var(--text-secondary)] text-sm hover:bg-white/15 transition-colors"
        >
          <Camera size={16} />
          Browse Cameras
        </Link>
        <Link
          href="/radar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-sm hover:bg-[var(--primary)]/20 transition-colors"
        >
          <Map size={16} />
          Live Radar
        </Link>
      </div>
    </GlassCard>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="glass rounded-2xl p-4 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="glass rounded-xl overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-3 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
