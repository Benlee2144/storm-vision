'use client';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, Grid3X3, MapIcon, List, Star, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CameraGridSkeleton } from '@/components/ui/Skeleton';
import { CameraCard, type CameraData } from '@/components/cameras/CameraCard';
import { CuratedCamCard } from '@/components/cameras/CuratedCamCard';
import { StateGrid } from '@/components/cameras/StateGrid';
import { CommunitySubmit } from '@/components/shared/CommunitySubmit';
import { useCameraIndex, useStateCameras } from '@/hooks/useCameras';
import { getFeaturedCams, getStormProneCams, searchCuratedCams, getCamCategoryStats, type CamCategory } from '@/data/curated-cams';

type ViewMode = 'featured' | 'grid' | 'states';

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
  const [viewMode, setViewMode] = useState<ViewMode>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [curatedFilter, setCuratedFilter] = useState<CamCategory | 'all' | 'storm'>('all');

  const { data: index, loading: indexLoading } = useCameraIndex();
  const { data: stateCameras, loading: stateCamsLoading } = useStateCameras(selectedState);

  const featured = useMemo(() => getFeaturedCams(), []);
  const stormProne = useMemo(() => getStormProneCams(), []);
  const categoryStats = useMemo(() => getCamCategoryStats(), []);

  const filteredCurated = useMemo(() => {
    let cams = searchQuery ? searchCuratedCams(searchQuery) : undefined;
    if (curatedFilter === 'all') cams = cams || searchCuratedCams('');
    else if (curatedFilter === 'storm') cams = (cams || searchCuratedCams('')).filter((c) => c.stormProne);
    else cams = (cams || searchCuratedCams('')).filter((c) => c.category === curatedFilter);
    return cams;
  }, [searchQuery, curatedFilter]);

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
                  <span className="text-[var(--primary)] font-semibold data-mono">{totalCameras.toLocaleString()}</span> DOT cameras + curated live streams across <span className="font-semibold">{stateCount} states</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { mode: 'featured' as ViewMode, icon: Star, label: 'Featured' },
              { mode: 'states' as ViewMode, icon: MapIcon, label: 'States' },
              { mode: 'grid' as ViewMode, icon: List, label: 'DOT Cams' },
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

        {/* ═══ FEATURED VIEW: Curated YouTube & Storm cams ═══ */}
        {viewMode === 'featured' && (
          <div>
            {/* Category filter bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-thin">
              <button
                onClick={() => setCuratedFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  curatedFilter === 'all' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:bg-white/5'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCuratedFilter('storm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  curatedFilter === 'storm' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'text-[var(--text-tertiary)] hover:bg-white/5'
                }`}
              >
                <Zap size={10} /> Storm Zones
              </button>
              {categoryStats.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => setCuratedFilter(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                    curatedFilter === category ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:bg-white/5'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search for curated cams */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live cams by city, state, or type..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              />
            </div>

            {/* Curated cams grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredCurated.map((cam, i) => (
                <motion.div
                  key={cam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <CuratedCamCard cam={cam} />
                </motion.div>
              ))}
            </div>

            {filteredCurated.length === 0 && (
              <GlassCard className="text-center py-12 mb-8">
                <Camera size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No cameras match your search</p>
              </GlassCard>
            )}

            {/* Community submit */}
            <CommunitySubmit className="mb-4" />
          </div>
        )}

        {/* ═══ STATES VIEW ═══ */}
        {viewMode === 'states' && (
          <StateGrid cameraCounts={cameraCounts} onStateSelect={handleStateSelect} />
        )}

        {/* ═══ GRID VIEW: DOT cameras by state ═══ */}
        {viewMode === 'grid' && (
          <>
            {/* Search + Filters */}
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

            {!selectedState ? (
              <div className="text-center py-16">
                <Camera size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] mb-2">Select a state to browse DOT cameras</p>
                <button
                  onClick={() => setViewMode('states')}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  View States
                </button>
              </div>
            ) : (
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
                  <CameraGridSkeleton count={12} />
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
          </>
        )}
      </div>
    </div>
  );
}
