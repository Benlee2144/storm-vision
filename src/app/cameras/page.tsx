'use client';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, Grid3X3, MapIcon, List, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CameraCard, type CameraData } from '@/components/cameras/CameraCard';
import { StateGrid } from '@/components/cameras/StateGrid';
import { useCameraIndex, useStateCameras } from '@/hooks/useCameras';

type ViewMode = 'grid' | 'states';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'traffic', label: 'Traffic' },
  { key: 'skyline', label: 'Skylines' },
  { key: 'beach', label: 'Beaches' },
  { key: 'mountain', label: 'Mountains' },
  { key: 'landmark', label: 'Landmarks' },
  { key: 'nature', label: 'Nature' },
  { key: 'airport', label: 'Airports' },
];

const PAGE_SIZE = 60;

export default function CamerasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('states');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: index, loading: indexLoading } = useCameraIndex();
  const { data: stateCameras, loading: stateCamsLoading } = useStateCameras(selectedState);

  const cameraCounts = useMemo(() => {
    if (!index) return {};
    const counts: Record<string, number> = {};
    Object.entries(index.states).forEach(([code, info]) => {
      counts[code] = info.count;
    });
    return counts;
  }, [index]);

  const totalCameras = index?.total || 0;
  const stateCount = index ? Object.keys(index.states).length : 0;

  const filteredCameras = useMemo(() => {
    let filtered = stateCameras;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.stateCode.toLowerCase() === q
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }
    return filtered;
  }, [stateCameras, searchQuery, selectedCategory]);

  const handleStateSelect = useCallback((stateCode: string) => {
    setSelectedState(stateCode);
    setViewMode('grid');
    setVisibleCount(PAGE_SIZE);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((v) => v + PAGE_SIZE);
  }, []);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Camera className="text-[var(--primary)]" />
              Live Cameras
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {indexLoading ? 'Loading...' : (
                <>
                  <span className="text-[var(--primary)] font-semibold data-mono">{totalCameras.toLocaleString()}</span> live cameras across <span className="font-semibold">{stateCount} states</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { mode: 'states' as ViewMode, icon: MapIcon, label: 'States' },
              { mode: 'grid' as ViewMode, icon: List, label: 'All' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewMode === mode
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filters — only show when in grid mode */}
        {viewMode === 'grid' && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cameras by city, state, or name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--text-tertiary)] hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {viewMode === 'states' && (
          <StateGrid cameraCounts={cameraCounts} onStateSelect={handleStateSelect} />
        )}

        {viewMode === 'grid' && !selectedState && (
          <div className="text-center py-16">
            <Camera size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] mb-2">Select a state to browse cameras</p>
            <button
              onClick={() => setViewMode('states')}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              View States
            </button>
          </div>
        )}

        {viewMode === 'grid' && selectedState && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setViewMode('states'); setSelectedState(undefined); }}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                &larr; All States
              </button>
              <span className="text-sm text-[var(--text-tertiary)]">
                {stateCamsLoading ? 'Loading...' : `${filteredCameras.length.toLocaleString()} cameras`}
              </span>
            </div>

            {stateCamsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCameras.slice(0, visibleCount).map((camera, i) => (
                    <motion.div
                      key={camera.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    >
                      <CameraCard camera={camera} />
                    </motion.div>
                  ))}
                </div>
                {filteredCameras.length > visibleCount && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      className="px-6 py-2.5 rounded-xl glass hover:bg-white/5 text-sm text-[var(--primary)] font-medium transition-colors"
                    >
                      Load More ({(filteredCameras.length - visibleCount).toLocaleString()} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
