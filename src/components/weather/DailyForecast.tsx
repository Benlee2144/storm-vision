'use client';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherDescription } from '@/lib/api/openmeteo';
import { formatDayOfWeek, formatPrecipChance } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Sun, Moon, Cloud, CloudRain, CloudLightning,
  Snowflake, CloudDrizzle, CloudFog, CloudSun, Droplets, Wind
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  sun: Sun, moon: Moon, cloud: Cloud, 'cloud-sun': CloudSun,
  'cloud-rain': CloudRain, 'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning, snowflake: Snowflake, 'cloud-fog': CloudFog,
  'cloud-sun-rain': CloudRain, 'cloud-hail': CloudRain, 'cloud-moon': Moon,
};

export function DailyForecast({ lat, lon }: { lat?: number; lon?: number }) {
  const { data, isLoading } = useWeather(lat, lon);

  if (isLoading) {
    return (
      <GlassCard>
        <Skeleton className="h-5 w-32 mb-4" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton variant="circular" className="h-6 w-6" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </GlassCard>
    );
  }

  if (!data) return null;

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
        7-Day Forecast
      </h3>
      <div className="divide-y divide-[var(--border)]">
        {data.daily.time.map((date, i) => {
          const weather = getWeatherDescription(data.daily.weatherCode[i]);
          const Icon = iconMap[weather.icon] || Cloud;
          const high = Math.round(data.daily.temperatureMax[i]);
          const low = Math.round(data.daily.temperatureMin[i]);
          const precip = data.daily.precipitationProbabilityMax[i];
          const windMax = Math.round(data.daily.windSpeedMax[i]);

          // Temperature bar visualization
          const allHighs = data.daily.temperatureMax;
          const allLows = data.daily.temperatureMin;
          const rangeMin = Math.min(...allLows);
          const rangeMax = Math.max(...allHighs);
          const range = rangeMax - rangeMin || 1;
          const barLeft = ((low - rangeMin) / range) * 100;
          const barWidth = ((high - low) / range) * 100;

          return (
            <div
              key={date}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm w-10 text-[var(--text-secondary)] data-mono">
                {i === 0 ? 'Today' : formatDayOfWeek(date)}
              </span>
              <Icon size={20} className="text-[var(--text-secondary)] shrink-0" />
              {precip > 10 && (
                <div className="flex items-center gap-0.5 text-xs text-blue-400 w-10 shrink-0">
                  <Droplets size={10} />
                  {formatPrecipChance(precip)}
                </div>
              )}
              {precip <= 10 && <div className="w-10 shrink-0" />}
              <span className="text-sm data-mono w-8 text-right text-[var(--text-tertiary)]">{low}°</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 relative mx-1">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 via-[var(--primary)] to-orange-400"
                  style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 4)}%` }}
                />
              </div>
              <span className="text-sm data-mono w-8 font-medium">{high}°</span>
              <div className="flex items-center gap-1 text-[var(--text-tertiary)] w-14 justify-end">
                <Wind size={12} />
                <span className="text-xs data-mono">{windMax}</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
