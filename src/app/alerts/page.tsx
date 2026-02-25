'use client';
import { useState, useMemo } from 'react';
import { Bell, Search, Filter } from 'lucide-react';
import { AlertCard } from '@/components/weather/AlertCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNationalAlerts } from '@/hooks/useAlerts';
import { getAlertConfig } from '@/lib/constants/alert-types';

const severityFilters = ['All', 'Extreme', 'Severe', 'Moderate', 'Minor'];
const typeFilters = ['All', 'Tornado', 'Thunderstorm', 'Flood', 'Winter', 'Wind', 'Heat', 'Fire'];

export default function AlertsPage() {
  const { data: alerts, isLoading } = useNationalAlerts();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    let filtered = alerts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.properties.event.toLowerCase().includes(q) ||
          a.properties.areaDesc?.toLowerCase().includes(q) ||
          a.properties.headline?.toLowerCase().includes(q)
      );
    }

    if (severityFilter !== 'All') {
      filtered = filtered.filter((a) => a.properties.severity === severityFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter((a) =>
        a.properties.event.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    // Sort by priority
    return filtered.sort((a, b) => {
      const ac = getAlertConfig(a.properties.event);
      const bc = getAlertConfig(b.properties.event);
      return ac.priority - bc.priority;
    });
  }, [alerts, searchQuery, severityFilter, typeFilter]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between page-header">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
                <Bell className="text-[var(--warning)]" size={22} />
              </div>
              Active Alerts
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              <span className="text-[var(--primary)] font-semibold data-mono">{alerts?.length || 0}</span> active alerts nationwide
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by event, area, or description..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-tertiary)]">Severity:</span>
            {severityFilters.map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  severityFilter === s
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--text-tertiary)] hover:bg-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-tertiary)]">Type:</span>
            <div className="flex gap-1 overflow-x-auto">
              {typeFilters.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    typeFilter === t
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--text-tertiary)] hover:bg-white/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-xl p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredAlerts.length > 0 ? (
          <>
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              Showing {filteredAlerts.length} alerts
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {filteredAlerts.slice(0, 50).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </>
        ) : (
          <GlassCard className="text-center py-12">
            <Bell size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery || severityFilter !== 'All' || typeFilter !== 'All'
                ? 'No Matching Alerts'
                : 'All Clear'}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {searchQuery || severityFilter !== 'All' || typeFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'No active weather alerts nationwide'}
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
