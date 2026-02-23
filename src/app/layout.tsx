import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'Storm Vision | Real-Time Weather Intelligence & Live Cameras',
    template: '%s | Storm Vision',
  },
  description:
    'The most comprehensive weather platform with real-time radar, severe weather alerts, and thousands of live cameras across every US city. Every camera. Every storm. Every city.',
  keywords: ['weather', 'radar', 'live cameras', 'severe weather', 'tornado warning', 'storm tracking', 'webcams', 'forecast'],
  authors: [{ name: 'Storm Vision' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Storm Vision',
    title: 'Storm Vision | Real-Time Weather Intelligence & Live Cameras',
    description: 'Real-time radar, severe weather alerts, and thousands of live cameras across America.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Storm Vision',
    description: 'Every camera. Every storm. Every city.',
  },
  manifest: '/manifest.json',
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
                // Handle 404.html ?/ redirect
                var loc = window.location;
                if (loc.search[1] === '/') {
                  var decoded = loc.search.slice(1).split('&').map(function(s){
                    return s.replace(/~and~/g,'&')
                  }).join('?');
                  var newPath = loc.pathname.slice(0, -1) + decoded + loc.hash;
                  history.replaceState(null, '', newPath);
                }
              })();
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
