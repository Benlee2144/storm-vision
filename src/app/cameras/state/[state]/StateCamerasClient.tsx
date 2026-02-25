'use client';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CameraCard } from '@/components/cameras/CameraCard';
import { STATE_BY_CODE } from '@/lib/constants/states';
import { useStateCameras } from '@/hooks/useCameras';

export default function StateCamerasClient({ stateCode: rawState }: { stateCode: string }) {
  const stateCode = rawState?.toUpperCase();
  const stateInfo = STATE_BY_CODE[stateCode];
  const { data: stateCameras, loading } = useStateCameras(stateCode);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/cameras"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Cameras
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--primary)]/10">
            <Camera className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {stateInfo?.name || stateCode} Cameras
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--primary)] font-semibold data-mono">{stateCameras.length.toLocaleString()}</span> live cameras
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
          </div>
        ) : stateCameras.length === 0 ? (
          <div className="text-center py-16">
            <Camera size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No cameras found for this state</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stateCameras.map((camera, i) => (
              <motion.div
                key={camera.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
              >
                <CameraCard camera={camera} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
