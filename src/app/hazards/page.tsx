'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Flame, CloudRain, Globe, ExternalLink,
  ChevronDown, ChevronUp, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  getRecentEarthquakes, getSignificantEarthquakes,
  parseEarthquake, getMagnitudeColor, getMagnitudeLabel,
  type EarthquakeCollection, type Earthquake,
} from '@/lib/api/earthquakes';
import {
  getActiveWildfires, parseWildfire, formatAcres,
  type WildfirePerimeter,
} from '@/lib/api/wildfires';
import { formatTimeAgo } from '@/lib/utils/formatters';

export default function HazardsPage() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [significantQuakes, setSignificantQuakes] = useState<Earthquake[]>([]);
  const [wildfires, setWildfires] = useState<WildfirePerimeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earthquakes' | 'wildfires'>('earthquakes');
  const [quakePeriod, setQuakePeriod] = useState<'hour' | 'day' | 'week'>('day');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [recentRes, sigRes, fireRes] = await Promise.allSettled([
          getRecentEarthquakes(quakePeriod),
          getSignificantEarthquakes(),
          getActiveWildfires(),
        ]);

        if (recentRes.status === 'fulfilled') {
          setEarthquakes(recentRes.value.features.map(parseEarthquake).sort((a, b) => b.magnitude - a.magnitude));
        }
        if (sigRes.status === 'fulfilled') {
          setSignificantQuakes(sigRes.value.features.map(parseEarthquake));
        }
        if (fireRes.status === 'fulfilled') {
          setWildfires(fireRes.value.features.map(parseWildfire).filter((f) => f.acres > 0));
        }
      } catch (e) {
        console.error('Failed to load hazards:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quakePeriod]);

  const bigQuakes = useMemo(() => earthquakes.filter((q) => q.magnitude >= 4.0), [earthquakes]);
  const totalAcresBurning = useMemo(
    () => wildfires.reduce((s, f) => s + f.acres, 0),
    [wildfires]
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
              <Globe className="text-[var(--warning)]" size={22} />
            </div>
            Natural Hazards
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Real-time earthquakes, wildfires, and natural disaster tracking
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Earthquakes"
            value={earthquakes.length.toLocaleString()}
            sub={`Past ${quakePeriod}`}
            color="var(--info)"
            icon={Activity}
          />
          <StatCard
            label="Magnitude 4+"
            value={String(bigQuakes.length)}
            sub="Significant"
            color="var(--warning)"
            icon={Activity}
            pulse={bigQuakes.length > 0}
          />
          <StatCard
            label="Active Fires"
            value={String(wildfires.length)}
            sub="United States"
            color="var(--danger)"
            icon={Flame}
            pulse={wildfires.length > 0}
          />
          <StatCard
            label="Acres Burning"
            value={formatAcres(totalAcresBurning)}
            sub="Total area"
            color="#ff6600"
            icon={Flame}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('earthquakes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'earthquakes'
                ? 'bg-[var(--info)]/15 text-[var(--info)] border border-[var(--info)]/20'
                : 'glass hover:bg-white/5 text-[var(--text-secondary)]'
            }`}
          >
            <Activity size={16} />
            Earthquakes
            <Badge size="sm">{earthquakes.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('wildfires')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'wildfires'
                ? 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/20'
                : 'glass hover:bg-white/5 text-[var(--text-secondary)]'
            }`}
          >
            <Flame size={16} />
            Wildfires
            <Badge size="sm">{wildfires.length}</Badge>
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : activeTab === 'earthquakes' ? (
          <EarthquakeTab
            earthquakes={earthquakes}
            significant={significantQuakes}
            period={quakePeriod}
            onPeriodChange={setQuakePeriod}
          />
        ) : (
          <WildfireTab wildfires={wildfires} />
        )}
      </div>
    </div>
  );
}

function EarthquakeTab({
  earthquakes, significant, period, onPeriodChange,
}: {
  earthquakes: Earthquake[];
  significant: Earthquake[];
  period: 'hour' | 'day' | 'week';
  onPeriodChange: (p: 'hour' | 'day' | 'week') => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? earthquakes : earthquakes.slice(0, 30);

  return (
    <div>
      {/* Period selector */}
      <div className="flex items-center gap-2 mb-4">
        {(['hour', 'day', 'week'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p
                ? 'bg-[var(--info)]/15 text-[var(--info)]'
                : 'bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Past {p === 'hour' ? 'Hour' : p === 'day' ? '24 Hours' : 'Week'}
          </button>
        ))}
      </div>

      {/* Significant earthquakes */}
      {significant.length > 0 && (
        <GlassCard className="mb-4" style={{ borderLeft: '4px solid var(--danger)' }}>
          <h3 className="text-sm font-bold text-[var(--danger)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle size={14} />
            Significant Earthquakes This Week
          </h3>
          <div className="space-y-2">
            {significant.map((q) => (
              <QuakeRow key={q.id} quake={q} featured />
            ))}
          </div>
        </GlassCard>
      )}

      {/* All earthquakes */}
      {earthquakes.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Activity size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Recent Earthquakes</h2>
          <p className="text-[var(--text-secondary)]">No earthquakes detected for this time period.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
              All Earthquakes ({earthquakes.length})
            </h3>
          </div>
          <div className="space-y-1">
            {visible.map((q) => (
              <QuakeRow key={q.id} quake={q} />
            ))}
          </div>
          {earthquakes.length > 30 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 text-sm text-[var(--primary)] hover:underline flex items-center justify-center gap-1"
            >
              {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {earthquakes.length}</>}
            </button>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function QuakeRow({ quake, featured = false }: { quake: Earthquake; featured?: boolean }) {
  const color = getMagnitudeColor(quake.magnitude);
  const label = getMagnitudeLabel(quake.magnitude);

  return (
    <a
      href={quake.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group ${
        featured ? 'bg-white/5' : ''
      }`}
    >
      {/* Magnitude circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm data-mono"
        style={{ background: `${color}20`, color, border: `2px solid ${color}40` }}
      >
        {quake.magnitude.toFixed(1)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{quake.place}</p>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>{formatTimeAgo(new Date(quake.time).toISOString())}</span>
          <span>·</span>
          <span>{quake.depth.toFixed(1)} km deep</span>
          <span>·</span>
          <span style={{ color }}>{label}</span>
        </div>
      </div>
      {quake.tsunami > 0 && (
        <Badge variant="danger" size="sm">TSUNAMI</Badge>
      )}
      {quake.felt && quake.felt > 0 && (
        <span className="text-[10px] text-[var(--text-tertiary)]">{quake.felt} felt</span>
      )}
      <ExternalLink size={12} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 shrink-0" />
    </a>
  );
}

function WildfireTab({ wildfires }: { wildfires: WildfirePerimeter[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? wildfires : wildfires.slice(0, 30);

  if (wildfires.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <Flame size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Wildfires</h2>
        <p className="text-[var(--text-secondary)]">No active wildfires reported.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="space-y-1">
        {visible.map((fire) => (
          <FireRow key={fire.id} fire={fire} />
        ))}
      </div>
      {wildfires.length > 30 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-[var(--primary)] hover:underline flex items-center justify-center gap-1"
        >
          {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {wildfires.length}</>}
        </button>
      )}
    </GlassCard>
  );
}

function FireRow({ fire }: { fire: WildfirePerimeter }) {
  const containmentColor = fire.containment >= 80 ? 'var(--success)' : fire.containment >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-full bg-[var(--danger)]/15 flex items-center justify-center shrink-0">
        <Flame size={18} className="text-[var(--danger)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fire.name}</p>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>{fire.state}</span>
          <span>·</span>
          <span>{formatAcres(fire.acres)}</span>
          {fire.cause !== 'Unknown' && (
            <><span>·</span><span>{fire.cause}</span></>
          )}
        </div>
      </div>
      {/* Containment bar */}
      <div className="w-20 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-[var(--text-tertiary)]">Contained</span>
          <span className="text-[10px] data-mono font-bold" style={{ color: containmentColor }}>
            {fire.containment}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${fire.containment}%`, background: containmentColor }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color, icon: Icon, pulse = false,
}: {
  label: string; value: string; sub: string; color: string; icon: React.ElementType; pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium rounded-2xl p-4"
    >
      <Icon size={16} style={{ color }} className="mb-2 opacity-70" />
      <p className={`text-2xl font-bold data-mono ${pulse ? 'stat-glow' : ''}`} style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">{label}</p>
      <p className="text-[10px] text-[var(--text-tertiary)]">{sub}</p>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <GlassCard>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton variant="circular" className="w-10 h-10" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
