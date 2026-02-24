'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, Camera } from 'lucide-react';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { CURATED_CAMS } from '@/data/curated-cams';
import { CuratedCamCard } from '@/components/cameras/CuratedCamCard';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const { favorites, clearAll } = useFavoritesStore();

  const curatedFavs = useMemo(() => {
    return favorites
      .filter((f) => f.type === 'curated')
      .map((f) => CURATED_CAMS.find((c) => c.id === f.id))
      .filter(Boolean) as typeof CURATED_CAMS;
  }, [favorites]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Heart className="text-red-500" />
              Favorites
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              <span className="text-[var(--primary)] font-semibold data-mono">{favorites.length}</span> saved cameras
            </p>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Heart size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Favorites Yet</h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
              Browse live cameras and tap the heart icon to save your favorites here.
              They&apos;ll be available offline and load instantly.
            </p>
            <Link
              href="/cameras"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors"
            >
              <Camera size={16} />
              Browse Cameras
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curatedFavs.map((cam, i) => (
              <motion.div
                key={cam.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
              >
                <CuratedCamCard cam={cam} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
