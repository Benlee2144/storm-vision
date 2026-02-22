import { formatDistanceToNow, format } from 'date-fns';

export function formatTemp(temp: number | null | undefined, unit: 'F' | 'C' = 'F'): string {
  if (temp == null) return '--';
  const rounded = Math.round(temp);
  return `${rounded}°${unit}`;
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function formatWind(speed: number | null | undefined, direction?: string | number | null, unit: 'mph' | 'kph' = 'mph'): string {
  if (speed == null) return '--';
  const dir = typeof direction === 'number' ? degreesToCardinal(direction) : direction || '';
  return `${dir ? dir + ' ' : ''}${Math.round(speed)} ${unit}`;
}

export function degreesToCardinal(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

export function formatPressure(pressure: number | null | undefined): string {
  if (pressure == null) return '--';
  return `${pressure.toFixed(2)} inHg`;
}

export function formatVisibility(miles: number | null | undefined): string {
  if (miles == null) return '--';
  if (miles >= 10) return '10+ mi';
  return `${miles.toFixed(1)} mi`;
}

export function formatHumidity(humidity: number | null | undefined): string {
  if (humidity == null) return '--';
  return `${Math.round(humidity)}%`;
}

export function formatPrecipChance(chance: number | null | undefined): string {
  if (chance == null) return '--';
  return `${Math.round(chance)}%`;
}

export function formatTimeAgo(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'unknown';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    return format(new Date(date), 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

export function formatTime(date: string | Date): string {
  try {
    return format(new Date(date), 'h:mm a');
  } catch {
    return '';
  }
}

export function formatDayOfWeek(date: string | Date): string {
  try {
    return format(new Date(date), 'EEE');
  } catch {
    return '';
  }
}

export function getDewpointComfort(dewpoint: number): { label: string; color: string } {
  if (dewpoint < 50) return { label: 'Comfortable', color: '#30d158' };
  if (dewpoint < 55) return { label: 'Pleasant', color: '#30d158' };
  if (dewpoint < 60) return { label: 'Noticeable', color: '#ffd60a' };
  if (dewpoint < 65) return { label: 'Sticky', color: '#ff9500' };
  if (dewpoint < 70) return { label: 'Uncomfortable', color: '#ff6b35' };
  if (dewpoint < 75) return { label: 'Oppressive', color: '#ff3b3b' };
  return { label: 'Miserable', color: '#d70015' };
}

export function getUVDescription(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: '#30d158' };
  if (uv <= 5) return { label: 'Moderate', color: '#ffd60a' };
  if (uv <= 7) return { label: 'High', color: '#ff9500' };
  if (uv <= 10) return { label: 'Very High', color: '#ff3b3b' };
  return { label: 'Extreme', color: '#d70015' };
}

export function getAQIDescription(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: 'Good', color: '#30d158' };
  if (aqi <= 100) return { label: 'Moderate', color: '#ffd60a' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#ff9500' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ff3b3b' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8b008b' };
  return { label: 'Hazardous', color: '#800000' };
}

export function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

export function pascalsToInHg(pascals: number): number {
  return pascals * 0.00029530;
}

export function mpsToMph(mps: number): number {
  return mps * 2.237;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}
