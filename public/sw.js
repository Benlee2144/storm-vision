// Storm Vision Service Worker — caches radar tiles, cam data, and API responses
const CACHE_NAME = 'storm-vision-v1';
const TILE_CACHE = 'storm-vision-tiles-v1';
const API_CACHE = 'storm-vision-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== TILE_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache radar and satellite tiles aggressively (stale-while-revalidate)
  if (url.hostname === 'tilecache.rainviewer.com' || url.pathname.includes('/radar/')) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);

        return cached || networkPromise;
      })
    );
    return;
  }

  // Cache API responses (weather, alerts) for 5 minutes
  if (
    url.hostname === 'api.open-meteo.com' ||
    url.hostname === 'api.weather.gov' ||
    url.hostname === 'api.rainviewer.com'
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          const cachedTime = cached.headers.get('sw-cached-at');
          if (cachedTime && Date.now() - parseInt(cachedTime) < 5 * 60 * 1000) {
            return cached;
          }
        }

        try {
          const response = await fetch(event.request);
          if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set('sw-cached-at', Date.now().toString());
            const clone = new Response(await response.clone().blob(), {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
            cache.put(event.request, clone);
          }
          return response;
        } catch {
          return cached || new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Clean up old tile caches periodically (keep last 500 tiles)
async function cleanTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length > 500) {
    const toDelete = keys.slice(0, keys.length - 500);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'clean-cache') cleanTileCache();
});
