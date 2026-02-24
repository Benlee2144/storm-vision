'use client';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { IconRail } from './IconRail';
import { MobileNav } from './MobileNav';
import { AlertTicker } from '@/components/weather/AlertTicker';

/**
 * AppShell manages the layout: thin icon rail on desktop, bottom nav on mobile.
 * Full-bleed pages (home, radar) get no padding; content pages get sidebar offset.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useSettingsStore();

  // These pages are full-bleed map views — no margin/padding
  const isFullBleed = pathname === '/' || pathname === '/radar' || pathname === '/radar/';

  return (
    <>
      <AlertTicker />
      <IconRail />
      <MobileNav />
      <main
        className={
          isFullBleed
            ? 'min-h-screen lg:ml-16'
            : 'min-h-screen lg:ml-16 pb-20 lg:pb-0'
        }
      >
        {children}
      </main>
    </>
  );
}
