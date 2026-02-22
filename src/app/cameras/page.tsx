'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, Grid3X3, MapIcon, List } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CameraCard, type CameraData } from '@/components/cameras/CameraCard';
import { StateGrid } from '@/components/cameras/StateGrid';
import cameraData from '@/data/cameras.json';

type ViewMode = 'grid' | 'states' | 'featured';

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

export default function CamerasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const cameras = cameraData as CameraData[];

  const cameraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cameras.forEach((c) => {
      counts[c.stateCode] = (counts[c.stateCode] || 0) + 1;
    });
    return counts;
  }, [cameras]);

  const filteredCameras = useMemo(() => {
    let filtered = cameras;
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
  }, [cameras, searchQuery, selectedCategory]);

  const featuredCameras = useMemo(
    () => cameras.filter((c) =>
      c.category === 'skyline' || c.category === 'landmark' || c.category === 'beach'
    ).slice(0, 12),
    [cameras]
  );

  const totalActive = cameras.filter((c) => c.isActive).length;
  const stateCount = new Set(cameras.map((c) => c.stateCode)).size;

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
              Currently streaming: <span className="text-[var(--primary)] font-semibold data-mono">{totalActive.toLocaleString()}</span> live cameras across <span className="font-semibold">{stateCount} states</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { mode: 'featured' as ViewMode, icon: Grid3X3, label: 'Featured' },
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

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setViewMode('grid'); }}
              placeholder="Search cameras by city, state, or name..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setSelectedCategory(cat.key); if (cat.key !== 'all') setViewMode('grid'); }}
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

        {/* Content */}
        {viewMode === 'states' && (
          <StateGrid cameraCounts={cameraCounts} />
        )}

        {viewMode === 'featured' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Featured Cameras</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featuredCameras.map((camera) => (
                <motion.div
                  key={camera.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CameraCard camera={camera} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          <div>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Showing {filteredCameras.length} cameras
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCameras.slice(0, 40).map((camera) => (
                <motion.div
                  key={camera.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CameraCard camera={camera} />
                </motion.div>
              ))}
            </div>
            {filteredCameras.length > 40 && (
              <div className="text-center mt-8">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Showing 40 of {filteredCameras.length} cameras. Use search or filters to narrow results.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
