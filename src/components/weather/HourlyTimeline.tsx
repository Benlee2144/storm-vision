'use client';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherDescription } from '@/lib/api/openmeteo';
import { formatTime } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Sun, Moon, Cloud, CloudRain, CloudLightning,
  Snowflake, CloudDrizzle, CloudFog, CloudSun, CloudMoon, Droplets
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  sun: Sun, moon: Moon, cloud: Cloud, 'cloud-sun': CloudSun,
  'cloud-moon': CloudMoon, 'cloud-rain': CloudRain, 'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning, snowflake: Snowflake, 'cloud-fog': CloudFog,
  'cloud-sun-rain': CloudRain, 'cloud-hail': CloudRain,
};

export function HourlyTimeline({ lat, lon }: { lat?: number; lon?: number }) {
  const { data, isLoading } = useWeather(lat, lon);

  if (isLoading) {
    return (
      <GlassCard>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
              <Skeleton className="h-3 w-10" />
              <Skeleton variant="circular" className="h-6 w-6" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!data) return null;

  const now = new Date();
  const startIdx = data.hourly.time.findIndex(
    (t) => new Date(t) >= now
  );
  const hours = data.hourly.time.slice(startIdx, startIdx + 24);

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
        Hourly Forecast
      </h3>
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {hours.map((time, i) => {
          const idx = startIdx + i;
          const temp = Math.round(data.hourly.temperature[idx]);
          const code = data.hourly.weatherCode[idx];
          const isDay = data.hourly.isDay[idx] === 1;
          const precip = data.hourly.precipitationProbability[idx];
          const weather = getWeatherDescription(code, isDay);
          const Icon = iconMap[weather.icon] || Cloud;

          return (
            <div
              key={time}
              className="flex flex-col items-center gap-1.5 min-w-[56px] p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <span className="text-[10px] text-[var(--text-tertiary)] data-mono">
                {i === 0 ? 'Now' : formatTime(time)}
              </span>
              <Icon size={20} className="text-[var(--text-secondary)]" />
              <span className="text-sm font-semibold data-mono">{temp}°</span>
              {precip > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-blue-400">
                  <Droplets size={8} />
                  {precip}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
