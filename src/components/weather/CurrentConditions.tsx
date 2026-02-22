'use client';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherDescription } from '@/lib/api/openmeteo';
import { formatTemp, formatWind, formatHumidity, degreesToCardinal, getDewpointComfort, getUVDescription } from '@/lib/utils/formatters';
import {
  Thermometer, Droplets, Wind, Eye, Gauge,
  Sun, CloudRain, Snowflake, Cloud, CloudLightning,
  CloudDrizzle, CloudFog, Moon, CloudSun, CloudMoon
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  sun: Sun, moon: Moon, cloud: Cloud, 'cloud-sun': CloudSun,
  'cloud-moon': CloudMoon, 'cloud-rain': CloudRain, 'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning, snowflake: Snowflake, 'cloud-fog': CloudFog,
  'cloud-sun-rain': CloudRain, 'cloud-hail': CloudRain,
};

interface Props {
  lat?: number;
  lon?: number;
  locationName?: string;
  compact?: boolean;
}

export function CurrentConditions({ lat, lon, locationName, compact = false }: Props) {
  const { data, isLoading, error } = useWeather(lat, lon);

  if (isLoading) {
    return (
      <GlassCard className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-end gap-4">
          <Skeleton className="h-20 w-28" />
          <Skeleton variant="circular" className="h-14 w-14" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4" />)}
        </div>
      </GlassCard>
    );
  }

  if (error || !data) {
    return (
      <GlassCard>
        <p className="text-[var(--text-secondary)] text-sm">Unable to load weather data</p>
      </GlassCard>
    );
  }

  const { current } = data;
  const weather = getWeatherDescription(current.weatherCode, current.isDay);
  const WeatherIcon = iconMap[weather.icon] || Cloud;
  const dewpointComfort = getDewpointComfort(current.dewpoint);
  const uvInfo = getUVDescription(current.uvIndex);

  if (compact) {
    return (
      <GlassCard padding="sm" className="flex items-center gap-4">
        <WeatherIcon size={28} className="text-[var(--primary)] shrink-0" />
        <div className="flex items-baseline gap-2">
          <span className="temp-display text-3xl">{formatTemp(current.temperature)}</span>
          <span className="text-[var(--text-secondary)] text-sm">{weather.description}</span>
        </div>
        {locationName && (
          <span className="ml-auto text-[var(--text-tertiary)] text-xs truncate">{locationName}</span>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      {locationName && (
        <p className="text-[var(--text-secondary)] text-sm mb-1">{locationName}</p>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="temp-display text-7xl sm:text-8xl mb-1">
            {Math.round(current.temperature)}
            <span className="text-3xl text-[var(--text-tertiary)]">°F</span>
          </div>
          <p className="text-lg text-[var(--text-secondary)]">{weather.description}</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            Feels like {formatTemp(current.feelsLike)}
          </p>
        </div>
        <WeatherIcon size={64} className="text-[var(--primary)] opacity-80" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <DataItem
          icon={<Droplets size={16} />}
          label="Humidity"
          value={formatHumidity(current.humidity)}
        />
        <DataItem
          icon={<Wind size={16} />}
          label="Wind"
          value={formatWind(current.windSpeed, degreesToCardinal(current.windDirection))}
        />
        <DataItem
          icon={<Thermometer size={16} />}
          label="Dewpoint"
          value={formatTemp(current.dewpoint)}
          subValue={dewpointComfort.label}
          subColor={dewpointComfort.color}
        />
        <DataItem
          icon={<Eye size={16} />}
          label="Visibility"
          value={`${(current.visibility / 1609).toFixed(1)} mi`}
        />
        <DataItem
          icon={<Gauge size={16} />}
          label="Pressure"
          value={`${(current.pressure * 0.02953).toFixed(2)} inHg`}
        />
        <DataItem
          icon={<Sun size={16} />}
          label="UV Index"
          value={current.uvIndex.toString()}
          subValue={uvInfo.label}
          subColor={uvInfo.color}
        />
      </div>
    </GlassCard>
  );
}

function DataItem({ icon, label, value, subValue, subColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  subColor?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-[var(--text-tertiary)] mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
        <p className="text-sm font-medium data-mono">{value}</p>
        {subValue && (
          <p className="text-xs font-medium" style={{ color: subColor }}>{subValue}</p>
        )}
      </div>
    </div>
  );
}
