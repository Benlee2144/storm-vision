'use client';
import { GlassCard } from '@/components/ui/GlassCard';
import { Logo } from '@/components/shared/Logo';
import { ExternalLink, Database, Radio, Camera, Cloud } from 'lucide-react';

const dataSources = [
  {
    name: 'National Weather Service (NWS)',
    url: 'https://api.weather.gov',
    icon: Cloud,
    description: 'Forecasts, alerts, and current observations. Free US Government data.',
  },
  {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com',
    icon: Database,
    description: 'High-resolution weather forecasts, air quality data. Free API, no key required.',
  },
  {
    name: 'RainViewer',
    url: 'https://www.rainviewer.com',
    icon: Radio,
    description: 'Animated radar and satellite imagery tiles. Free API.',
  },
  {
    name: 'Storm Prediction Center (SPC)',
    url: 'https://www.spc.noaa.gov',
    icon: Radio,
    description: 'Convective outlooks, storm reports, watches. Free US Government data.',
  },
  {
    name: 'OpenStreetMap / Nominatim',
    url: 'https://nominatim.openstreetmap.org',
    icon: Database,
    description: 'Geocoding and reverse geocoding. Free, open-source.',
  },
  {
    name: 'OpenFreeMap',
    url: 'https://openfreemap.org',
    icon: Database,
    description: 'Free vector map tiles for the interactive radar map.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">About Storm Vision</h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Storm Vision is a free, open-source weather intelligence platform that combines
            real-time radar, severe weather alerts, and live cameras from across the United States.
          </p>
        </div>

        <GlassCard className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            All data is sourced from free, public APIs. No paid services are used.
          </p>
          <div className="space-y-3">
            {dataSources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <source.icon size={18} className="text-[var(--primary)] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{source.name}</span>
                    <ExternalLink size={12} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{source.description}</p>
                </div>
              </a>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Data Freshness</h2>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between"><span>Radar imagery</span><span className="data-mono text-[var(--text-tertiary)]">Every 5 min</span></div>
            <div className="flex justify-between"><span>Weather alerts</span><span className="data-mono text-[var(--text-tertiary)]">Every 60 sec</span></div>
            <div className="flex justify-between"><span>Current conditions</span><span className="data-mono text-[var(--text-tertiary)]">Every 10 min</span></div>
            <div className="flex justify-between"><span>Forecasts</span><span className="data-mono text-[var(--text-tertiary)]">Every 30 min</span></div>
            <div className="flex justify-between"><span>Camera status</span><span className="data-mono text-[var(--text-tertiary)]">Every 5 min</span></div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold mb-3">Privacy</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Storm Vision stores your preferences (theme, saved locations, units) locally
            in your browser using localStorage. No personal data is transmitted to any server.
            Location data is used only to fetch local weather and is never stored remotely.
            All camera streams are loaded directly from their original sources.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
