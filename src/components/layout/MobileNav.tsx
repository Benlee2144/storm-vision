'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Camera, Bell, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/radar', icon: Map, label: 'Radar' },
  { href: '/cameras', icon: Camera, label: 'Cameras' },
  { href: '/favorites', icon: Heart, label: 'Favorites' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-[var(--border)]">
      <div className="flex items-center justify-around h-[var(--mobile-nav-height)] px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px]',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)]'
              )}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -inset-1.5 bg-[var(--primary)]/10 rounded-lg"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon size={22} className="relative" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
