import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL('https://benlee2144.github.io/storm-vision'),
  title: {
    default: 'Storm Vision | Free Live Storm Cams, Radar & Weather Alerts',
    template: '%s | Storm Vision',
  },
  description:
    'The #1 free real-time storm tracking platform with 60,000+ live cameras, animated radar, severe weather alerts, and 7-day forecasts. Track tornadoes, hurricanes, and storms live. No signup required.',
  keywords: [
    'live storm cams', 'free radar', 'weather radar', 'tornado tracker', 'hurricane cam',
    'live weather cameras', 'severe weather alerts', 'storm tracking', 'NWS alerts',
    'live beach cams', 'traffic cameras', 'weather forecast', 'storm chaser live',
    'tornado warning', 'hurricane warning', 'free weather app', 'live webcams weather',
  ],
  authors: [{ name: 'Storm Vision' }],
  creator: 'Storm Vision',
  publisher: 'Storm Vision',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Storm Vision',
    title: 'Storm Vision | Free Live Storm Cams & Real-Time Radar',
    description: '60,000+ live cameras, animated radar, tornado tracking, and severe weather alerts — all free. Every camera. Every storm. Every city.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Storm Vision - Live Storm Cams and Radar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Storm Vision | Free Live Storm Cams & Radar',
    description: 'Every camera. Every storm. Every city. 60K+ live cams. Free.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  other: {
    'google-adsense-account': 'ca-pub-XXXXXXXXXX',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // GitHub Pages SPA redirect handler
              (function(){
                var redirect = sessionStorage.redirect;
                delete sessionStorage.redirect;
                if (redirect && redirect !== location.href) {
                  history.replaceState(null, '', redirect);
                }
                var loc = window.location;
                if (loc.search[1] === '/') {
                  var decoded = loc.search.slice(1).split('&').map(function(s){
                    return s.replace(/~and~/g,'&')
                  }).join('?');
                  var newPath = loc.pathname.slice(0, -1) + decoded + loc.hash;
                  history.replaceState(null, '', newPath);
                }
              })();
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
