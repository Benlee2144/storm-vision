'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart3, Loader2 } from 'lucide-react';
import { LocationSearch } from '@/components/shared/LocationSearch';
import { CurrentConditions } from '@/components/weather/CurrentConditions';
import { HourlyTimeline } from '@/components/weather/HourlyTimeline';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { useGeolocation } from '@/hooks/useGeolocation';

function ForecastContent() {
  const { location } = useGeolocation();
  const searchParams = useSearchParams();
  const qLat = searchParams.get('lat');
  const qLon = searchParams.get('lon');
  const qName = searchParams.get('name');
  
  const forecastLat = qLat ? parseFloat(qLat) : location?.lat;
  const forecastLon = qLon ? parseFloat(qLon) : location?.lon;
  const forecastName = qName || location?.name;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 page-enter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
              <BarChart3 className="text-[var(--warning)]" size={22} />
            </div>
            Weather Forecast
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Detailed hourly and 7-day forecasts for any US location
          </p>
          <LocationSearch placeholder="Search a city for forecast..." />
        </div>

        {forecastLat && forecastLon ? (
          <div className="space-y-4">
            <CurrentConditions lat={forecastLat} lon={forecastLon} locationName={forecastName || undefined} />
            <HourlyTimeline lat={forecastLat} lon={forecastLon} />
            <DailyForecast lat={forecastLat} lon={forecastLon} />
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌤️</div>
            <h2 className="text-xl font-semibold mb-2">Loading your forecast...</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Allow location access or search for a city above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForecastIndexPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-[var(--primary)] mx-auto" size={32} />
          <p className="text-sm text-[var(--text-secondary)]">Loading forecast...</p>
        </div>
      </div>
    }>
      <ForecastContent />
    </Suspense>
  );
}
