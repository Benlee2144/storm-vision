'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, use } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CurrentConditions } from '@/components/weather/CurrentConditions';
import { HourlyTimeline } from '@/components/weather/HourlyTimeline';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { LocationSearch } from '@/components/shared/LocationSearch';
import { WeatherCardSkeleton } from '@/components/ui/Skeleton';

function ForecastContent({ params }: { params: Promise<{ location: string }> }) {
  const { location } = use(params);
  const searchParams = useSearchParams();
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined;
  const name = location?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/forecast" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] mb-4 transition-colors">
          <ArrowLeft size={16} /> Search another location
        </Link>
        <div className="mb-6">
          <LocationSearch placeholder="Search another city..." className="mb-4" />
        </div>
        {lat && lon ? (
          <div className="space-y-4">
            <CurrentConditions lat={lat} lon={lon} locationName={name} />
            <HourlyTimeline lat={lat} lon={lon} />
            <DailyForecast lat={lat} lon={lon} />
          </div>
        ) : (
          <p className="text-[var(--text-secondary)]">Use the search bar to find a location, or add ?lat=&lon= to the URL.</p>
        )}
      </div>
    </div>
  );
}

export default function ForecastClient({ params }: { params: Promise<{ location: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen px-4 sm:px-6 py-6"><div className="max-w-4xl mx-auto space-y-4"><WeatherCardSkeleton /><WeatherCardSkeleton /></div></div>}>
      <ForecastContent params={params} />
    </Suspense>
  );
}
