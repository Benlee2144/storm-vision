'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Map, Camera, AlertTriangle, BarChart3,
  Bell, Shield, Settings, Heart, Globe,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/', icon: Home, label: 'Home', tip: 'Home' },
  { href: '/radar', icon: Map, label: 'Radar', tip: 'Live Radar' },
  { href: '/storm-cams', icon: Shield, label: 'Storm', tip: 'Storm Cams' },
  { href: '/cameras', icon: Camera, label: 'Cameras', tip: 'Live Cameras' },
  { href: '/severe', icon: AlertTriangle, label: 'Severe', tip: 'Severe Weather' },
  { href: '/forecast', icon: BarChart3, label: 'Forecast', tip: 'Forecast' },
  { href: '/alerts', icon: Bell, label: 'Alerts', tip: 'Alerts' },
  { href: '/hazards', icon: Globe, label: 'Hazards', tip: 'Natural Hazards' },
  { href: '/favorites', icon: Heart, label: 'Favs', tip: 'Favorites' },
];

export function IconRail() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full z-40 hidden lg:flex flex-col w-16 glass border-r border-[var(--border)]">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center h-14 border-b border-[var(--border)] group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--info)] flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
          SV
        </div>
      </Link>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col items-center py-3 gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150 group',
                isActive
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-white/5'
              )}
              title={item.tip}
            >
              {isActive && (
                <motion.div
                  layoutId="rail-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--primary)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon size={20} />
              {/* Tooltip on hover */}
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--text)] text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border border-[var(--border)]">
                {item.tip}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2 py-3 border-t border-[var(--border)]">
        <ThemeToggle />
        <Link
          href="/settings"
          className="flex items-center justify-center w-11 h-11 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </Link>
      </div>
    </nav>
  );
}
