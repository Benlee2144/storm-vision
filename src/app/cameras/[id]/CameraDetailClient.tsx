'use client';
import { use } from 'react';
import { ArrowLeft, MapPin, Share2, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { CurrentConditions } from '@/components/weather/CurrentConditions';
import { CameraCard } from '@/components/cameras/CameraCard';
import { useCameraById } from '@/hooks/useCameras';

export default function CameraDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { camera, nearby, loading } = useCameraById(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="text-center max-w-md">
          <Camera size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Camera Not Found</h2>
          <Link href="/cameras" className="text-[var(--primary)] hover:underline text-sm">Browse all cameras</Link>
        </GlassCard>
      </div>
    );
  }

  const embedUrl = camera.streamType === 'youtube_embed'
    ? `https://www.youtube.com/embed/${camera.streamUrl}?autoplay=1&mute=1`
    : camera.streamUrl;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/cameras" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Cameras
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-2xl overflow-hidden glass mb-4">
              {camera.streamType === 'youtube_embed' || camera.streamType === 'iframe' ? (
                <iframe src={embedUrl} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={camera.name} />
              ) : camera.streamType === 'image_refresh' && camera.streamUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={camera.streamUrl} alt={camera.name} className="w-full h-full object-contain" />
              ) : camera.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={camera.thumbnailUrl} alt={camera.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Camera size={64} className="text-[var(--text-tertiary)]" /></div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-1">{camera.name}</h1>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <MapPin size={14} /><span>{camera.city}, {camera.state}</span>
                </div>
                {camera.highway && <p className="text-xs text-[var(--text-tertiary)] mt-1">{camera.highway}</p>}
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Source: {camera.attribution}</p>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="p-2 rounded-xl glass hover:bg-white/10 transition-colors" aria-label="Share">
                <Share2 size={18} className="text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <CurrentConditions lat={camera.latitude} lon={camera.longitude} locationName={`${camera.city}, ${camera.stateCode}`} compact />
            {nearby.length > 0 && (
              <GlassCard>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Nearby Cameras</h3>
                <div className="space-y-2">
                  {nearby.map((cam) => (
                    <Link key={cam.id} href={`/cameras/${cam.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <Camera size={14} className="text-[var(--primary)] shrink-0" />
                      <div className="min-w-0"><p className="text-sm truncate">{cam.name}</p><p className="text-xs text-[var(--text-tertiary)]">{cam.city}</p></div>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
