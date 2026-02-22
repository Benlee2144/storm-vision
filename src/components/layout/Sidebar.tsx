'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Map, Camera, AlertTriangle, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSettingsStore } from '@/stores/useSettingsStore';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/radar', icon: Map, label: 'Live Radar' },
  { href: '/cameras', icon: Camera, label: 'Live Cameras' },
  { href: '/severe', icon: AlertTriangle, label: 'Severe Weather' },
  { href: '/forecast', icon: BarChart3, label: 'Forecast' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full z-40 hidden lg:flex flex-col glass border-r border-[var(--border)] sidebar-transition"
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16">
        <Link href="/">
          <Logo collapsed={sidebarCollapsed} />
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white/5'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--primary)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon size={20} className={clsx(isActive && 'text-[var(--primary)]')} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-2 border-t border-[var(--border)]">
        <div className={clsx('flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between px-1')}>
          <ThemeToggle />
          {!sidebarCollapsed && (
            <Link
              href="/about"
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
            >
              <Settings size={18} />
            </Link>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
