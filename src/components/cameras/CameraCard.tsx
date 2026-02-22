'use client';
import { useRef, useState, useEffect } from 'react';
import { Camera, MapPin, ExternalLink, Play } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export interface CameraData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  stateCode: string;
  source: string;
  category: string;
  streamType: string;
  streamUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  attribution: string;
  highway?: string;
  direction?: string;
}

interface Props {
  camera: CameraData;
  showEmbed?: boolean;
}

export function CameraCard({ camera, showEmbed = false }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPlayer, setShowPlayer] = useState(showEmbed);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: '100px' }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const getEmbedUrl = () => {
    if (camera.streamType === 'youtube_embed') {
      return `https://www.youtube.com/embed/${camera.streamUrl}?autoplay=1&mute=1`;
    }
    return camera.streamUrl;
  };

  const categoryColors: Record<string, string> = {
    traffic: 'var(--warning)',
    skyline: 'var(--primary)',
    beach: 'var(--success)',
    mountain: 'var(--info)',
    airport: 'var(--text-secondary)',
    landmark: 'var(--caution)',
    nature: 'var(--success)',
    weather_station: 'var(--primary)',
  };

  return (
    <div ref={cardRef} className="glass rounded-xl overflow-hidden group hover:border-[var(--border-hover)] transition-all duration-200">
      {/* Thumbnail / Player */}
      <div className="relative aspect-video bg-black/20">
        {isVisible && showPlayer && camera.streamType === 'youtube_embed' ? (
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            loading="lazy"
            title={camera.name}
          />
        ) : isVisible && camera.thumbnailUrl ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={camera.thumbnailUrl}
              alt={camera.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <button
              onClick={() => setShowPlayer(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                <Play size={24} fill="white" className="text-white" />
              </div>
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
            <Camera size={32} className="text-[var(--text-tertiary)]" />
            {isVisible && !showPlayer && (
              <button
                onClick={() => setShowPlayer(true)}
                className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition-colors"
              >
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                  <Play size={24} className="text-white" />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${camera.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'}`}>
            {camera.isActive && (
              <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-ping" />
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <Link href={`/cameras/${camera.id}`}>
        <div className="p-3">
          <h4 className="font-medium text-sm truncate mb-1">{camera.name}</h4>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <MapPin size={12} />
            <span className="truncate">{camera.city}, {camera.stateCode}</span>
            <Badge size="sm" className="ml-auto" style={{ color: categoryColors[camera.category] || 'var(--text-secondary)' }}>
              {camera.category}
            </Badge>
          </div>
          {camera.highway && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{camera.highway}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
