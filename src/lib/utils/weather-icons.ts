/**
 * Map WMO weather codes to emoji + description
 * https://open-meteo.com/en/docs#weathervariables
 */

interface WeatherIcon {
  emoji: string;
  label: string;
}

const DAY_ICONS: Record<number, WeatherIcon> = {
  0: { emoji: '☀️', label: 'Clear sky' },
  1: { emoji: '🌤️', label: 'Mainly clear' },
  2: { emoji: '⛅', label: 'Partly cloudy' },
  3: { emoji: '☁️', label: 'Overcast' },
  45: { emoji: '🌫️', label: 'Foggy' },
  48: { emoji: '🌫️', label: 'Depositing rime fog' },
  51: { emoji: '🌦️', label: 'Light drizzle' },
  53: { emoji: '🌦️', label: 'Moderate drizzle' },
  55: { emoji: '🌧️', label: 'Dense drizzle' },
  56: { emoji: '🌧️', label: 'Freezing drizzle' },
  57: { emoji: '🌧️', label: 'Heavy freezing drizzle' },
  61: { emoji: '🌧️', label: 'Slight rain' },
  63: { emoji: '🌧️', label: 'Moderate rain' },
  65: { emoji: '🌧️', label: 'Heavy rain' },
  66: { emoji: '🌧️', label: 'Freezing rain' },
  67: { emoji: '🌧️', label: 'Heavy freezing rain' },
  71: { emoji: '🌨️', label: 'Slight snow' },
  73: { emoji: '🌨️', label: 'Moderate snow' },
  75: { emoji: '❄️', label: 'Heavy snow' },
  77: { emoji: '🌨️', label: 'Snow grains' },
  80: { emoji: '🌦️', label: 'Slight showers' },
  81: { emoji: '🌧️', label: 'Moderate showers' },
  82: { emoji: '🌧️', label: 'Violent showers' },
  85: { emoji: '🌨️', label: 'Slight snow showers' },
  86: { emoji: '🌨️', label: 'Heavy snow showers' },
  95: { emoji: '⛈️', label: 'Thunderstorm' },
  96: { emoji: '⛈️', label: 'Thunderstorm with hail' },
  99: { emoji: '⛈️', label: 'Severe thunderstorm' },
};

const NIGHT_OVERRIDES: Record<number, WeatherIcon> = {
  0: { emoji: '🌙', label: 'Clear sky' },
  1: { emoji: '🌙', label: 'Mainly clear' },
  2: { emoji: '☁️', label: 'Partly cloudy' },
};

export function getWeatherEmoji(code: number, isDay: boolean = true): string {
  if (!isDay && NIGHT_OVERRIDES[code]) return NIGHT_OVERRIDES[code].emoji;
  return DAY_ICONS[code]?.emoji || '🌡️';
}

export function getWeatherLabel(code: number): string {
  return DAY_ICONS[code]?.label || 'Unknown';
}
