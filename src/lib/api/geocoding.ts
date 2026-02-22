const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  city: string;
  state: string;
  type: string;
}

let lastRequest = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastRequest));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
  return fetch(url, {
    headers: { 'User-Agent': 'StormVision/1.0' },
  });
}

// Simple in-memory cache
const cache = new Map<string, GeocodingResult[]>();

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];
  const cacheKey = query.toLowerCase().trim();
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: 'us',
    limit: '8',
    addressdetails: '1',
  });

  const res = await rateLimitedFetch(`${NOMINATIM_BASE}/search?${params}`);
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
  const data = await res.json();

  const results: GeocodingResult[] = data.map((item: Record<string, unknown>) => ({
    lat: parseFloat(item.lat as string),
    lon: parseFloat(item.lon as string),
    displayName: item.display_name as string,
    city: (item.address as Record<string, string>)?.city
      || (item.address as Record<string, string>)?.town
      || (item.address as Record<string, string>)?.village
      || '',
    state: (item.address as Record<string, string>)?.state || '',
    type: item.type as string,
  }));

  cache.set(cacheKey, results);
  return results;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)![0] || null;

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'json',
    addressdetails: '1',
  });

  const res = await rateLimitedFetch(`${NOMINATIM_BASE}/reverse?${params}`);
  if (!res.ok) return null;
  const item = await res.json();

  const result: GeocodingResult = {
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    displayName: item.display_name,
    city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || '',
    state: item.address?.state || '',
    type: item.type,
  };

  cache.set(cacheKey, [result]);
  return result;
}
