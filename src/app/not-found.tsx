'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Custom 404 handler for GitHub Pages SPA.
 * Instead of showing a 404, this component redirects to the
 * correct client-side route. GitHub Pages serves 404.html (which is
 * the Next.js not-found page) for any unknown path, so we just need
 * the client-side router to pick up the real path from the URL.
 */
export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // The URL bar already has the correct path (e.g. /storm-vision/cameras/otcm-123/)
    // We just need to tell Next.js router to navigate there
    router.replace(pathname);
  }, [router, pathname]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin mx-auto" />
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}
