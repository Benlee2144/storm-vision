'use client';
import { useRef, useState, useEffect } from 'react';
import { Camera, MapPin, Play, RefreshCw } from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
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

  // Set initial image source based on stream type
  useEffect(() => {
    if (!isVisible) return;
    const src = getImageUrl();
    if (src) setImgSrc(src);
  }, [isVisible, camera]);

  // Auto-refresh image every 15 seconds for image_refresh cameras
  useEffect(() => {
    if (!isVisible || camera.streamType !== 'image_refresh' || !imgSrc) return;

    const interval = setInterval(() => {
      const base = getImageUrl();
      if (base) {
        // Add cache-busting timestamp
        const sep = base.includes('?') ? '&' : '?';
        setImgSrc(`${base}${sep}_t=${Date.now()}`);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isVisible, camera.streamType, imgSrc]);

  function getImageUrl(): string {
    // For image_refresh cameras, use the stream URL as the image
    if (camera.streamType === 'image_refresh' && camera.streamUrl) {
      return camera.streamUrl;
    }
    // For HLS or other streams, use the thumbnail
    if (camera.thumbnailUrl) {
      return camera.thumbnailUrl;
    }
    // Fallback to streamUrl if it looks like an image
    if (camera.streamUrl && /\.(jpg|jpeg|png|gif|bmp)/i.test(camera.streamUrl)) {
      return camera.streamUrl;
    }
    return '';
  }

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

  const hasStream = camera.streamType === 'hls' || (camera.streamType === 'image_refresh' && camera.streamUrl);

  return (
    <div ref={cardRef} className="glass rounded-xl overflow-hidden group hover:border-[var(--border-hover)] transition-all duration-200">
      {/* Thumbnail with auto-refresh */}
      <a href={camera.streamUrl || camera.thumbnailUrl || "#"} target="_blank" rel="noopener noreferrer">
        <div className="relative aspect-video bg-black/20 overflow-hidden">
          {isVisible && imgSrc && !imgError ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={camera.name}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
                onError={() => setImgError(true)}
              />
              {/* Play/view overlay on hover */}
              {hasStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
              <Camera size={28} className="text-[var(--text-tertiary)]" />
            </div>
          )}

          {/* Status + live badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {camera.isActive && camera.streamType === 'image_refresh' && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[9px] text-[var(--success)] font-medium uppercase">
                <RefreshCw size={8} /> Live
              </span>
            )}
            {camera.streamType === 'hls' && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[9px] text-[var(--danger)] font-medium uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" /> Stream
              </span>
            )}
          </div>

          {/* Status dot */}
          <div className="absolute top-2 right-2">
            <div className={`w-2 h-2 rounded-full ${camera.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'}`}>
              {camera.isActive && (
                <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-ping" />
              )}
            </div>
          </div>
        </div>
      </a>

      {/* Info */}
      <a href={camera.streamUrl || camera.thumbnailUrl || "#"} target="_blank" rel="noopener noreferrer">
        <div className="p-3">
          <h4 className="font-medium text-sm truncate mb-1">{camera.name}</h4>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{camera.city ? `${camera.city}, ` : ''}{camera.stateCode}</span>
            <Badge size="sm" className="ml-auto shrink-0" style={{ color: categoryColors[camera.category] || 'var(--text-secondary)' }}>
              {camera.category}
            </Badge>
          </div>
          {camera.highway && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1 truncate">{camera.highway}</p>
          )}
        </div>
      </a>
    </div>
  );
}
