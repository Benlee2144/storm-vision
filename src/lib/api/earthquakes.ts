const USGS_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  url: string;
  tsunami: number;
  sig: number;
  type: string;
  title: string;
  alert: string | null;
  felt: number | null;
  depth: number;
  longitude: number;
  latitude: number;
}

export interface EarthquakeCollection {
  features: Array<{
    id: string;
    properties: {
      mag: number;
      place: string;
      time: number;
      updated: number;
      url: string;
      tsunami: number;
      sig: number;
      type: string;
      title: string;
      alert: string | null;
      felt: number | null;
    };
    geometry: {
      coordinates: [number, number, number];
    };
  }>;
  metadata: {
    generated: number;
    count: number;
    title: string;
  };
}

export async function getRecentEarthquakes(period: 'hour' | 'day' | 'week' = 'day'): Promise<EarthquakeCollection> {
  const res = await fetch(`${USGS_BASE}/all_${period}.geojson`);
  if (!res.ok) throw new Error(`USGS API error: ${res.status}`);
  return res.json();
}

export async function getSignificantEarthquakes(): Promise<EarthquakeCollection> {
  const res = await fetch(`${USGS_BASE}/significant_week.geojson`);
  if (!res.ok) throw new Error(`USGS API error: ${res.status}`);
  return res.json();
}

export function parseEarthquake(feature: EarthquakeCollection['features'][0]): Earthquake {
  return {
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place,
    time: feature.properties.time,
    updated: feature.properties.updated,
    url: feature.properties.url,
    tsunami: feature.properties.tsunami,
    sig: feature.properties.sig,
    type: feature.properties.type,
    title: feature.properties.title,
    alert: feature.properties.alert,
    felt: feature.properties.felt,
    depth: feature.geometry.coordinates[2],
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
  };
}

export function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return '#ff0000';
  if (mag >= 5) return '#ff6600';
  if (mag >= 3) return '#ffcc00';
  if (mag >= 1) return '#66cc00';
  return '#00cc66';
}

export function getMagnitudeLabel(mag: number): string {
  if (mag >= 8) return 'Great';
  if (mag >= 7) return 'Major';
  if (mag >= 6) return 'Strong';
  if (mag >= 5) return 'Moderate';
  if (mag >= 4) return 'Light';
  if (mag >= 3) return 'Minor';
  return 'Micro';
}
