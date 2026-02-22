const BASE = 'https://api.open-meteo.com/v1/forecast';
const AQ_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  dewpoint: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  cloudCover: number;
  visibility: number;
  uvIndex: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface HourlyForecast {
  time: string[];
  temperature: number[];
  feelsLike: number[];
  humidity: number[];
  precipitationProbability: number[];
  precipitation: number[];
  weatherCode: number[];
  windSpeed: number[];
  windDirection: number[];
  windGusts: number[];
  cloudCover: number[];
  visibility: number[];
  uvIndex: number[];
  isDay: number[];
}

export interface DailyForecast {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  precipitationProbabilityMax: number[];
  precipitationSum: number[];
  windSpeedMax: number[];
  windGustsMax: number[];
  windDirectionDominant: number[];
  sunrise: string[];
  sunset: string[];
  uvIndexMax: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl',
      'surface_pressure', 'wind_speed_10m', 'wind_direction_10m',
      'wind_gusts_10m', 'visibility', 'dew_point_2m', 'uv_index', 'is_day',
    ].join(','),
    hourly: [
      'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
      'precipitation_probability', 'precipitation', 'weather_code',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
      'cloud_cover', 'visibility', 'uv_index', 'is_day',
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'precipitation_probability_max', 'precipitation_sum',
      'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
      'sunrise', 'sunset', 'uv_index_max',
    ].join(','),
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '7',
    forecast_hours: '48',
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  return {
    current: {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      dewpoint: data.current.dew_point_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      pressure: data.current.pressure_msl,
      cloudCover: data.current.cloud_cover,
      visibility: data.current.visibility,
      uvIndex: data.current.uv_index,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      time: data.current.time,
    },
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      feelsLike: data.hourly.apparent_temperature,
      humidity: data.hourly.relative_humidity_2m,
      precipitationProbability: data.hourly.precipitation_probability,
      precipitation: data.hourly.precipitation,
      weatherCode: data.hourly.weather_code,
      windSpeed: data.hourly.wind_speed_10m,
      windDirection: data.hourly.wind_direction_10m,
      windGusts: data.hourly.wind_gusts_10m,
      cloudCover: data.hourly.cloud_cover,
      visibility: data.hourly.visibility,
      uvIndex: data.hourly.uv_index,
      isDay: data.hourly.is_day,
    },
    daily: {
      time: data.daily.time,
      weatherCode: data.daily.weather_code,
      temperatureMax: data.daily.temperature_2m_max,
      temperatureMin: data.daily.temperature_2m_min,
      precipitationProbabilityMax: data.daily.precipitation_probability_max,
      precipitationSum: data.daily.precipitation_sum,
      windSpeedMax: data.daily.wind_speed_10m_max,
      windGustsMax: data.daily.wind_gusts_10m_max,
      windDirectionDominant: data.daily.wind_direction_10m_dominant,
      sunrise: data.daily.sunrise,
      sunset: data.daily.sunset,
      uvIndexMax: data.daily.uv_index_max,
    },
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
  };
}

export interface AirQuality {
  aqi: number;
  pm10: number;
  pm25: number;
  co: number;
  no2: number;
  ozone: number;
  time: string;
}

export async function getAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone',
  });
  const res = await fetch(`${AQ_BASE}?${params}`);
  if (!res.ok) throw new Error(`Air quality error: ${res.status}`);
  const data = await res.json();
  return {
    aqi: data.current.us_aqi,
    pm10: data.current.pm10,
    pm25: data.current.pm2_5,
    co: data.current.carbon_monoxide,
    no2: data.current.nitrogen_dioxide,
    ozone: data.current.ozone,
    time: data.current.time,
  };
}

// WMO Weather Code to description/icon mapping
export function getWeatherDescription(code: number, isDay: boolean = true): { description: string; icon: string } {
  const map: Record<number, { description: string; dayIcon: string; nightIcon: string }> = {
    0: { description: 'Clear sky', dayIcon: 'sun', nightIcon: 'moon' },
    1: { description: 'Mainly clear', dayIcon: 'sun', nightIcon: 'moon' },
    2: { description: 'Partly cloudy', dayIcon: 'cloud-sun', nightIcon: 'cloud-moon' },
    3: { description: 'Overcast', dayIcon: 'cloud', nightIcon: 'cloud' },
    45: { description: 'Fog', dayIcon: 'cloud-fog', nightIcon: 'cloud-fog' },
    48: { description: 'Rime fog', dayIcon: 'cloud-fog', nightIcon: 'cloud-fog' },
    51: { description: 'Light drizzle', dayIcon: 'cloud-drizzle', nightIcon: 'cloud-drizzle' },
    53: { description: 'Moderate drizzle', dayIcon: 'cloud-drizzle', nightIcon: 'cloud-drizzle' },
    55: { description: 'Dense drizzle', dayIcon: 'cloud-drizzle', nightIcon: 'cloud-drizzle' },
    61: { description: 'Slight rain', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    63: { description: 'Moderate rain', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    65: { description: 'Heavy rain', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    66: { description: 'Light freezing rain', dayIcon: 'cloud-hail', nightIcon: 'cloud-hail' },
    67: { description: 'Heavy freezing rain', dayIcon: 'cloud-hail', nightIcon: 'cloud-hail' },
    71: { description: 'Slight snow', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    73: { description: 'Moderate snow', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    75: { description: 'Heavy snow', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    77: { description: 'Snow grains', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    80: { description: 'Slight rain showers', dayIcon: 'cloud-sun-rain', nightIcon: 'cloud-rain' },
    81: { description: 'Moderate rain showers', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    82: { description: 'Violent rain showers', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    85: { description: 'Slight snow showers', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    86: { description: 'Heavy snow showers', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    95: { description: 'Thunderstorm', dayIcon: 'cloud-lightning', nightIcon: 'cloud-lightning' },
    96: { description: 'Thunderstorm w/ hail', dayIcon: 'cloud-lightning', nightIcon: 'cloud-lightning' },
    99: { description: 'Thunderstorm w/ heavy hail', dayIcon: 'cloud-lightning', nightIcon: 'cloud-lightning' },
  };

  const entry = map[code] || { description: 'Unknown', dayIcon: 'cloud', nightIcon: 'cloud' };
  return {
    description: entry.description,
    icon: isDay ? entry.dayIcon : entry.nightIcon,
  };
}
