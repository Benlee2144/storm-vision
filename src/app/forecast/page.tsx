'use client';
import { BarChart3 } from 'lucide-react';
import { LocationSearch } from '@/components/shared/LocationSearch';
import { CurrentConditions } from '@/components/weather/CurrentConditions';
import { HourlyTimeline } from '@/components/weather/HourlyTimeline';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function ForecastIndexPage() {
  const { location } = useGeolocation();

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
            <BarChart3 className="text-[var(--warning)]" />
            Weather Forecast
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Search for any US city to view detailed forecasts
          </p>
          <LocationSearch placeholder="Search a city for forecast..." />
        </div>

        {location && (
          <div className="space-y-4">
            <CurrentConditions lat={location.lat} lon={location.lon} locationName={location.name} />
            <HourlyTimeline lat={location.lat} lon={location.lon} />
            <DailyForecast lat={location.lat} lon={location.lon} />
          </div>
        )}
      </div>
    </div>
  );
}
