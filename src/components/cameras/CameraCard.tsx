'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, Play, X, RefreshCw, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Hls from 'hls.js';

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
  const [playing, setPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: '100px' }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const src = getImageUrl();
    if (src) setImgSrc(src);
  }, [isVisible, camera]);

  // Auto-refresh image every 15 seconds
  useEffect(() => {
    if (!isVisible || playing || camera.streamType !== 'image_refresh' || !imgSrc) return;
    const interval = setInterval(() => {
      const base = getImageUrl();
      if (base) {
        const sep = base.includes('?') ? '&' : '?';
        setImgSrc(`${base}${sep}_t=${Date.now()}`);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isVisible, camera.streamType, imgSrc, playing]);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  function getImageUrl(): string {
    if (camera.streamType === 'image_refresh' && camera.streamUrl) {
      return camera.streamUrl;
    }
    if (camera.thumbnailUrl) return camera.thumbnailUrl;
    if (camera.streamUrl && /\.(jpg|jpeg|png|gif|bmp)/i.test(camera.streamUrl)) {
      return camera.streamUrl;
    }
    return '';
  }

  const handlePlay = useCallback(() => {
    if (camera.streamType === 'hls' && camera.streamUrl) {
      setPlaying(true);
      setTimeout(() => {
        if (!videoRef.current) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hlsRef.current = hls;
          hls.loadSource(camera.streamUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, () => {
            setPlaying(false);
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS
          videoRef.current.src = camera.streamUrl;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } else if (camera.streamType === 'image_refresh') {
      // For image cameras, start rapid refresh (every 2 seconds) to simulate live
      setPlaying(true);
    }
  }, [camera]);

  const handleStop = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setPlaying(false);
  }, []);

  // Rapid refresh when "playing" an image camera
  useEffect(() => {
    if (!playing || camera.streamType !== 'image_refresh') return;
    const interval = setInterval(() => {
      const base = getImageUrl();
      if (base) {
        const sep = base.includes('?') ? '&' : '?';
        setImgSrc(`${base}${sep}_t=${Date.now()}`);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [playing, camera.streamType]);

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
      {/* Camera view */}
      <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={playing ? handleStop : handlePlay}>
        {/* HLS video player */}
        {playing && camera.streamType === 'hls' && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            autoPlay
            playsInline
          />
        )}

        {/* Image view (thumbnail or rapid-refresh) */}
        {(!playing || camera.streamType === 'image_refresh') && isVisible && imgSrc && !imgError ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={camera.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        ) : !playing && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
            <Camera size={28} className="text-[var(--text-tertiary)]" />
          </div>
        )}

        {/* Play overlay (when not playing) */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Play size={24} fill="white" className="text-white" />
            </div>
          </div>
        )}

        {/* Stop button (when playing) */}
        {playing && (
          <div className="absolute top-2 right-2 z-10">
            <button className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
              <X size={14} className="text-white" />
            </button>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {playing ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600/80 backdrop-blur-sm text-[9px] text-white font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          ) : camera.streamType === 'hls' ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[9px] text-[var(--danger)] font-medium uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" /> Stream
            </span>
          ) : camera.streamType === 'image_refresh' ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[9px] text-[var(--success)] font-medium uppercase">
              <RefreshCw size={8} /> Live
            </span>
          ) : null}
        </div>

        {/* Active dot */}
        {!playing && (
          <div className="absolute top-2 right-2">
            <div className={`w-2 h-2 rounded-full ${camera.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'}`}>
              {camera.isActive && <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-ping" />}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
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
    </div>
  );
}
