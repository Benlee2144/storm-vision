'use client';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Logo } from '@/components/shared/Logo';
import { ExternalLink, Database, Radio, Camera, Cloud, Zap, Shield, Globe, Clock } from 'lucide-react';

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
    icon: Zap,
    description: 'Convective outlooks, storm reports, watches. Free US Government data.',
  },
  {
    name: 'OpenStreetMap / Nominatim',
    url: 'https://nominatim.openstreetmap.org',
    icon: Globe,
    description: 'Geocoding and reverse geocoding. Free, open-source.',
  },
  {
    name: 'OpenFreeMap',
    url: 'https://openfreemap.org',
    icon: Database,
    description: 'Free vector map tiles for the interactive radar map.',
  },
];

const stats = [
  { value: '50K+', label: 'Live Cameras', icon: Camera },
  { value: '50', label: 'States Covered', icon: Globe },
  { value: '24/7', label: 'Real-Time Data', icon: Clock },
  { value: '100%', label: 'Free & Open', icon: Shield },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 page-enter">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Logo size="lg" />
              <div className="absolute -inset-4 bg-[var(--primary)]/10 rounded-full blur-xl -z-10" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Weather Intelligence,{' '}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--info)] bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-base leading-relaxed">
            Storm Vision combines real-time radar, severe weather alerts, and the largest
            collection of live cameras across the United States — all in one platform.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          initial="initial"
          animate="animate"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="glass-premium rounded-2xl p-4 text-center"
            >
              <stat.icon size={20} className="mx-auto text-[var(--primary)] mb-2 opacity-70" />
              <p className="text-2xl font-bold data-mono stat-glow text-[var(--primary)]">{stat.value}</p>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Data Sources */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <GlassCard className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Data Sources</h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-5">
              Powered entirely by free, public APIs. No paid services required.
            </p>
            <div className="space-y-1">
              {dataSources.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                    <source.icon size={16} className="text-[var(--primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{source.name}</span>
                      <ExternalLink size={11} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{source.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Refresh Rates */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <GlassCard className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[var(--primary)]" />
              Data Freshness
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Radar imagery', value: 'Every 5 min', color: 'var(--success)' },
                { label: 'Weather alerts', value: 'Every 60 sec', color: 'var(--danger)' },
                { label: 'Current conditions', value: 'Every 10 min', color: 'var(--primary)' },
                { label: 'Forecasts', value: 'Every 30 min', color: 'var(--warning)' },
                { label: 'Camera status', value: 'Every 5 min', color: 'var(--info)' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <span className="text-xs data-mono text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded-md">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Privacy */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <GlassCard>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield size={18} className="text-[var(--success)]" />
              Privacy First
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Storm Vision stores your preferences locally in your browser. No personal data
              is transmitted to any server. Location data is used only to fetch local weather
              and is never stored remotely. All camera streams load directly from their
              original sources. No tracking. No cookies. No ads.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
