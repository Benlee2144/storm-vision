const NHC_BASE = 'https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather/MapServer';

export interface TropicalSystem {
  name: string;
  type: string;
  movement: string;
  pressure: number;
  windSpeed: number;
  category: string;
  lat: number;
  lon: number;
  basin: string;
  stormId: string;
  advisory: string;
  timestamp: string;
}

export async function getActiveTropicalSystems(): Promise<unknown> {
  const url = `${NHC_BASE}/0/query?where=1%3D1&outFields=*&f=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHC API error: ${res.status}`);
  return res.json();
}

export async function getForecastTracks(): Promise<unknown> {
  const url = `${NHC_BASE}/2/query?where=1%3D1&outFields=*&f=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHC API error: ${res.status}`);
  return res.json();
}

export async function getForecastCones(): Promise<unknown> {
  const url = `${NHC_BASE}/3/query?where=1%3D1&outFields=*&f=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHC API error: ${res.status}`);
  return res.json();
}

export function getHurricaneCategory(windMph: number): { category: string; color: string } {
  if (windMph >= 157) return { category: 'CAT 5', color: '#ff00ff' };
  if (windMph >= 130) return { category: 'CAT 4', color: '#ff3333' };
  if (windMph >= 111) return { category: 'CAT 3', color: '#ff6600' };
  if (windMph >= 96) return { category: 'CAT 2', color: '#ff9900' };
  if (windMph >= 74) return { category: 'CAT 1', color: '#ffcc00' };
  if (windMph >= 39) return { category: 'Tropical Storm', color: '#00ccff' };
  return { category: 'Tropical Depression', color: '#80ccff' };
}
