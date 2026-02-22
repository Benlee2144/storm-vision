'use client';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Camera, AlertTriangle, Radio, Eye, Map,
  BarChart3, Shield, ChevronRight,
  Droplets, Wind, Thermometer,
} from 'lucide-react';
import { LocationSearch } from '@/components/shared/LocationSearch';
import { AlertCard } from '@/components/weather/AlertCard';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useAlerts, useNationalAlerts } from '@/hooks/useAlerts';
import { getWeatherDescription } from '@/lib/api/openmeteo';
import { formatTemp, formatWind, degreesToCardinal } from '@/lib/utils/formatters';

const RadarMap = dynamic(
  () => import('@/components/radar/RadarMap').then((m) => m.RadarMap),
  { ssr: false }
);

export default function HomePage() {
  const { location } = useGeolocation();
  const { data: weather } = useWeather(location?.lat, location?.lon);
  const { data: localAlerts } = useAlerts(
    location ? { point: `${location.lat},${location.lon}` } : undefined
  );
  const { data: nationalAlerts } = useNationalAlerts();

  const severeAlerts = (nationalAlerts || []).filter(
    (a) => a.properties.severity === 'Extreme' || a.properties.severity === 'Severe'
  );

  const current = weather?.current;
  const weatherDesc = current ? getWeatherDescription(current.weatherCode, current.isDay) : null;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* FULL-SCREEN RADAR MAP AS BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <RadarMap />
      </div>

      {/* FLOATING SEARCH BAR — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg">
        <LocationSearch
          size="md"
          placeholder="Search any US city, zip, or state..."
          className="shadow-2xl"
        />
      </div>

      {/* FLOATING SEVERE ALERTS — top right */}
      {severeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 z-20 w-80 max-h-[50vh] overflow-y-auto hidden lg:block"
        >
          <div className="glass rounded-2xl p-3 space-y-2 shadow-2xl">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs font-semibold text-[var(--danger)] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12} />
                {severeAlerts.length} Active Warnings
              </span>
              <Link href="/alerts" className="text-[10px] text-[var(--primary)] hover:underline">
                View All
              </Link>
            </div>
            {severeAlerts.slice(0, 5).map((alert) => (
              <AlertCard key={alert.id} alert={alert} compact />
            ))}
          </div>
        </motion.div>
      )}

      {/* FLOATING WEATHER CARD — bottom left */}
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-6 left-4 z-20 hidden lg:block"
        >
          <div className="glass rounded-2xl p-4 w-72 shadow-2xl">
            {location?.name && (
              <p className="text-xs text-[var(--text-secondary)] mb-1 truncate">{location.name}</p>
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="temp-display text-5xl font-light">
                  {Math.round(current.temperature)}
                  <span className="text-xl text-[var(--text-tertiary)]">°F</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {weatherDesc?.description}
                </p>
              </div>
              <div className="text-[var(--primary)] opacity-80">
                <Thermometer size={28} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              <div className="text-center">
                <Wind size={14} className="mx-auto text-[var(--text-tertiary)] mb-0.5" />
                <p className="text-xs data-mono">{formatWind(current.windSpeed, degreesToCardinal(current.windDirection))}</p>
              </div>
              <div className="text-center">
                <Droplets size={14} className="mx-auto text-[var(--text-tertiary)] mb-0.5" />
                <p className="text-xs data-mono">{current.humidity}%</p>
              </div>
              <div className="text-center">
                <Eye size={14} className="mx-auto text-[var(--text-tertiary)] mb-0.5" />
                <p className="text-xs data-mono">{(current.visibility / 1609).toFixed(0)} mi</p>
              </div>
            </div>

            {/* Local alerts under weather */}
            {localAlerts && localAlerts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1.5">
                {localAlerts.slice(0, 3).map((alert) => (
                  <AlertCard key={alert.id} alert={alert} compact />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* FLOATING QUICK NAV — bottom center */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:flex"
      >
        <div className="glass rounded-2xl px-2 py-1.5 flex items-center gap-1 shadow-2xl">
          <QuickNavBtn href="/radar" icon={Map} label="Radar" />
          <QuickNavBtn href="/cameras" icon={Camera} label="Cameras" count="18K+" />
          <QuickNavBtn href="/storm-cams" icon={Shield} label="Storm Cams" />
          <QuickNavBtn href="/severe" icon={AlertTriangle} label="Severe" count={severeAlerts.length > 0 ? String(severeAlerts.length) : undefined} danger />
          <QuickNavBtn href="/forecast" icon={BarChart3} label="Forecast" />
        </div>
      </motion.div>

      {/* FLOATING STATS — bottom right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-6 right-4 z-20 hidden lg:block"
      >
        <div className="glass rounded-2xl px-4 py-3 shadow-2xl">
          <div className="flex items-center gap-5">
            <MiniStat icon={Camera} value="18K+" label="Cameras" />
            <MiniStat icon={Radio} value="50" label="States" />
            <MiniStat icon={Eye} value="24/7" label="Live" />
          </div>
        </div>
      </motion.div>

      {/* MOBILE BOTTOM CARD */}
      <div className="absolute bottom-20 left-2 right-2 z-20 lg:hidden">
        <div className="glass rounded-2xl p-3 shadow-2xl">
          {current && (
            <div className="flex items-center gap-3 mb-3">
              <div>
                <span className="temp-display text-3xl">
                  {Math.round(current.temperature)}°
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{location?.name || 'Loading...'}</p>
                <p className="text-xs text-[var(--text-secondary)]">{weatherDesc?.description}</p>
              </div>
              <Link
                href="/forecast"
                className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          )}
          <div className="grid grid-cols-4 gap-1.5">
            <MobileQuickLink href="/radar" icon={Map} label="Radar" />
            <MobileQuickLink href="/cameras" icon={Camera} label="Cameras" />
            <MobileQuickLink href="/severe" icon={AlertTriangle} label="Severe" />
            <MobileQuickLink href="/forecast" icon={BarChart3} label="Forecast" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickNavBtn({
  href, icon: Icon, label, count, danger,
}: {
  href: string; icon: React.ElementType; label: string; count?: string; danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm"
    >
      <Icon size={16} className={danger && count ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'} />
      <span className="text-[var(--text)]">{label}</span>
      {count && (
        <span className={`text-[10px] font-bold data-mono px-1.5 py-0.5 rounded-full ${
          danger ? 'bg-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--primary)]/15 text-[var(--primary)]'
        }`}>
          {count}
        </span>
      )}
    </Link>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-[var(--primary)]">
        <Icon size={13} />
        <span className="text-sm font-bold data-mono">{value}</span>
      </div>
      <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
    </div>
  );
}

function MobileQuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-white/5 transition-colors">
      <Icon size={18} className="text-[var(--primary)]" />
      <span className="text-[10px] text-[var(--text-secondary)]">{label}</span>
    </Link>
  );
}
