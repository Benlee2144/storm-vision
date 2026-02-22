'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Map, Camera, AlertTriangle, BarChart3, Radio, Eye } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { LocationSearch } from '@/components/shared/LocationSearch';
import { CurrentConditions } from '@/components/weather/CurrentConditions';
import { HourlyTimeline } from '@/components/weather/HourlyTimeline';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { AlertCard } from '@/components/weather/AlertCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAlerts, useNationalAlerts } from '@/hooks/useAlerts';
import { US_STATES } from '@/lib/constants/states';

const quickLinks = [
  { href: '/radar', icon: Map, label: 'Live Radar', desc: 'Animated weather radar', color: 'var(--primary)' },
  { href: '/severe', icon: AlertTriangle, label: 'Severe Weather', desc: 'Warnings & watches', color: 'var(--danger)' },
  { href: '/cameras', icon: Camera, label: 'Live Cameras', desc: 'Thousands of webcams', color: 'var(--success)' },
  { href: '/forecast', icon: BarChart3, label: 'Forecasts', desc: 'Hourly & 7-day', color: 'var(--warning)' },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HomePage() {
  const { location } = useGeolocation();
  const { data: localAlerts } = useAlerts(
    location ? { point: `${location.lat},${location.lon}` } : undefined
  );
  const { data: nationalAlerts } = useNationalAlerts();

  const severeCount = (nationalAlerts || []).filter(
    (a) => a.properties.severity === 'Extreme' || a.properties.severity === 'Severe'
  ).length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[65vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[128px] animate-radar-sweep" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--info)] rounded-full blur-[128px] animate-radar-sweep" style={{ animationDelay: '1.5s' }} />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-3xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="mb-6 flex justify-center">
            <Logo size="lg" />
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Every camera. Every storm.{' '}
            <span className="text-[var(--primary)]">Every city.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-[var(--text-secondary)] text-lg sm:text-xl mb-8 max-w-xl mx-auto">
            Real-time radar, severe weather intelligence, and live cameras across America.
          </motion.p>

          <motion.div variants={fadeUp} className="max-w-lg mx-auto mb-8">
            <LocationSearch size="lg" placeholder="Search any US city, zip code, or state..." />
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 sm:gap-10 text-center">
            <Stat icon={<Camera size={16} />} value="5,000+" label="Live Cameras" />
            <Stat icon={<Radio size={16} />} value={US_STATES.length.toString()} label="States" />
            {severeCount > 0 && (
              <Stat icon={<AlertTriangle size={16} />} value={severeCount.toString()} label="Active Warnings" danger />
            )}
            <Stat icon={<Eye size={16} />} value="24/7" label="Monitoring" />
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Links */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {quickLinks.map((link) => (
              <motion.div key={link.href} variants={fadeUp}>
                <Link href={link.href}>
                  <GlassCard hover padding="md" className="text-center sm:text-left">
                    <div className="inline-flex p-2.5 rounded-xl mb-3" style={{ background: `${link.color}15` }}>
                      <link.icon size={22} style={{ color: link.color }} />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5">{link.label}</h3>
                    <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">{link.desc}</p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Weather + Alerts Grid */}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <CurrentConditions lat={location?.lat} lon={location?.lon} locationName={location?.name} />
              <HourlyTimeline lat={location?.lat} lon={location?.lon} />
              <DailyForecast lat={location?.lat} lon={location?.lon} />
            </div>

            <div className="space-y-4">
              <GlassCard>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Local Alerts
                </h3>
                {localAlerts && localAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {localAlerts.slice(0, 5).map((alert) => (
                      <AlertCard key={alert.id} alert={alert} compact />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">
                    No active alerts for your area
                  </p>
                )}
              </GlassCard>

              {nationalAlerts && nationalAlerts.length > 0 && (
                <GlassCard>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      National Alerts
                    </h3>
                    <Link href="/alerts" className="text-xs text-[var(--primary)] hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {nationalAlerts
                      .filter((a) => a.properties.severity === 'Extreme' || a.properties.severity === 'Severe')
                      .slice(0, 5)
                      .map((alert) => (
                        <AlertCard key={alert.id} alert={alert} compact />
                      ))}
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, danger }: { icon: React.ReactNode; value: string; label: string; danger?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex items-center gap-1.5 ${danger ? 'text-[var(--danger)]' : 'text-[var(--primary)]'}`}>
        {icon}
        <span className="text-lg sm:text-xl font-bold data-mono">{value}</span>
      </div>
      <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
    </div>
  );
}
