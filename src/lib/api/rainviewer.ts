const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

export interface RadarFrame {
  time: number;
  path: string;
}

export interface RainViewerData {
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
  satellite: {
    infrared: RadarFrame[];
  };
  generated: number;
}

export async function getRadarFrames(): Promise<RainViewerData> {
  const res = await fetch(RAINVIEWER_API);
  if (!res.ok) throw new Error(`RainViewer error: ${res.status}`);
  return res.json();
}

export function getRadarTileUrl(
  host: string,
  path: string,
  z: number,
  x: number,
  y: number,
  options: {
    colorScheme?: number;
    smooth?: number;
    snow?: number;
    tileSize?: number;
  } = {}
): string {
  const { colorScheme = 6, smooth = 1, snow = 1, tileSize = 256 } = options;
  return `${host}${path}/${tileSize}/{z}/{x}/{y}/${colorScheme}/${smooth}_${snow}.png`
    .replace('{z}', z.toString())
    .replace('{x}', x.toString())
    .replace('{y}', y.toString());
}

export function getRadarTileTemplate(
  host: string,
  path: string,
  options: {
    colorScheme?: number;
    smooth?: number;
    snow?: number;
    tileSize?: number;
  } = {}
): string {
  const { colorScheme = 6, smooth = 1, snow = 1, tileSize = 256 } = options;
  return `${host}${path}/${tileSize}/{z}/{x}/{y}/${colorScheme}/${smooth}_${snow}.png`;
}

export function getSatelliteTileTemplate(
  host: string,
  path: string,
  tileSize: number = 256
): string {
  return `${host}${path}/${tileSize}/{z}/{x}/{y}/0/0_0.png`;
}

export function formatRadarTime(unixTime: number): string {
  const date = new Date(unixTime * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
