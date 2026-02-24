'use client';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Share2, Maximize2, MapPin, Play, X, ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useFavoritesStore, type FavoriteItem } from '@/stores/useFavoritesStore';
import type { CuratedCam } from '@/data/curated-cams';

interface Props {
  cam: CuratedCam;
  autoPlay?: boolean;
  compact?: boolean;
}

export function CuratedCamCard({ cam, autoPlay = false, compact = false }: Props) {
  const [playing, setPlaying] = useState(autoPlay);
  const [fullscreen, setFullscreen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const fav = isFavorite(cam.id);

  const handleFavorite = useCallback(() => {
    const item: FavoriteItem = {
      id: cam.id,
      type: 'curated',
      name: cam.name,
      city: cam.city,
      stateCode: cam.stateCode,
      addedAt: Date.now(),
    };
    toggleFavorite(item);
  }, [cam, toggleFavorite]);

  const handleShare = useCallback(async () => {
    const url = cam.streamType === 'youtube' && cam.youtubeId
      ? `https://www.youtube.com/watch?v=${cam.youtubeId}`
      : cam.streamUrl;
    const text = `Watch ${cam.name} live on Storm Vision!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: cam.name, text, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
    }
  }, [cam]);

  const handleFullscreen = useCallback(() => {
    setFullscreen((f) => !f);
    setPlaying(true);
  }, []);

  const categoryColors: Record<string, string> = {
    beach: '#30d158',
    skyline: '#00d4ff',
    mountain: '#5e5ce6',
    highway: '#ff9500',
    storm: '#ff3b3b',
    airport: '#708090',
    harbor: '#00b4d8',
    volcano: '#ff4500',
    wildlife: '#2e8b57',
    landmark: '#ffd60a',
    weather_station: '#00d4ff',
  };

  if (compact) {
    return (
      <div className="glass rounded-xl overflow-hidden group hover:border-[var(--border-hover)] transition-all">
        <div
          className="relative aspect-video bg-black cursor-pointer"
          onClick={() => setPlaying(!playing)}
        >
          {playing && cam.streamType === 'youtube' && cam.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${cam.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
              title={cam.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
              <Play size={32} className="text-white/60" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600/80 backdrop-blur-sm text-[9px] text-white font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          </div>
        </div>
        <div className="p-2.5">
          <h4 className="font-medium text-xs truncate">{cam.name}</h4>
          <p className="text-[10px] text-[var(--text-tertiary)] truncate">{cam.city}, {cam.stateCode}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden group hover:border-[var(--border-hover)] transition-all duration-200"
      >
        {/* Video area */}
        <div className="relative aspect-video bg-black">
          {playing && cam.streamType === 'youtube' && cam.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${cam.youtubeId}?autoplay=1&mute=1&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              loading="lazy"
              title={cam.name}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent cursor-pointer"
              onClick={() => setPlaying(true)}
            >
              <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Play size={32} fill="white" className="text-white" />
              </div>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {playing ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600/80 backdrop-blur-sm text-[10px] text-white font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] text-white/80 font-medium">
                {cam.streamType === 'youtube' ? 'YouTube' : cam.streamType.toUpperCase()}
              </span>
            )}
            {cam.stormProne && (
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--danger)]/60 backdrop-blur-sm text-[9px] text-white font-bold">
                STORM ZONE
              </span>
            )}
          </div>

          {/* Top-right action buttons */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleFavorite}
              className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                size={14}
                className={fav ? 'text-red-500 fill-red-500' : 'text-white'}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Share cam"
            >
              <Share2 size={14} className="text-white" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize2 size={14} className="text-white" />
            </button>
          </div>

          {/* Stop button if playing */}
          {playing && (
            <button
              onClick={() => setPlaying(false)}
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm sm:text-base leading-tight">{cam.name}</h4>
            <button
              onClick={handleFavorite}
              className="shrink-0 mt-0.5"
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                size={16}
                className={fav ? 'text-red-500 fill-red-500' : 'text-[var(--text-tertiary)] hover:text-red-400'}
              />
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-1">{cam.description}</p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{cam.city}, {cam.stateCode}</span>
            <Badge
              size="sm"
              className="ml-auto shrink-0"
              style={{ color: categoryColors[cam.category] || 'var(--text-secondary)' }}
            >
              {cam.category}
            </Badge>
          </div>
          {cam.attribution && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 opacity-60">
              Source: {cam.attribution}
            </p>
          )}
        </div>
      </motion.div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
          <div className="absolute top-4 left-4 z-10">
            <h3 className="text-white font-semibold">{cam.name}</h3>
            <p className="text-white/60 text-sm">{cam.city}, {cam.stateCode}</p>
          </div>
          {cam.streamType === 'youtube' && cam.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${cam.youtubeId}?autoplay=1&mute=0&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={cam.name}
            />
          ) : (
            <p className="text-white/50">Stream not available in fullscreen</p>
          )}
        </div>
      )}
    </>
  );
}
