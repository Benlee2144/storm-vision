'use client';
import { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight, Cloud, Satellite, AlertTriangle, Camera, CloudLightning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadarStore } from '@/stores/useRadarStore';

export function LayerPanel() {
  const [open, setOpen] = useState(false);
  const {
    showRadar, showSatellite, showAlerts, showCameras, showStormReports,
    toggleRadar, toggleSatellite, toggleAlerts, toggleCameras, toggleStormReports,
  } = useRadarStore();

  const layers = [
    { label: 'Radar', icon: Cloud, active: showRadar, toggle: toggleRadar, color: '#00d4ff' },
    { label: 'Satellite', icon: Satellite, active: showSatellite, toggle: toggleSatellite, color: '#8b5cf6' },
    { label: 'Alerts', icon: AlertTriangle, active: showAlerts, toggle: toggleAlerts, color: '#ff3b3b' },
    { label: 'Cameras', icon: Camera, active: showCameras, toggle: toggleCameras, color: '#30d158' },
    { label: 'Storm Reports', icon: CloudLightning, active: showStormReports, toggle: toggleStormReports, color: '#ff9500' },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute top-4 right-4 z-10 p-2.5 glass rounded-xl hover:bg-white/10 transition-colors"
        aria-label="Toggle layer panel"
      >
        <Layers size={20} className="text-[var(--text-secondary)]" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 z-10 w-56 glass rounded-2xl p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Map Layers
              </h4>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-tertiary)]"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {layers.map((layer) => (
                <button
                  key={layer.label}
                  onClick={layer.toggle}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                    layer.active
                      ? 'bg-white/10 text-[var(--text)]'
                      : 'text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <layer.icon size={16} style={{ color: layer.active ? layer.color : undefined }} />
                  <span className="flex-1 text-left">{layer.label}</span>
                  <div
                    className={`w-8 h-4 rounded-full transition-all relative ${
                      layer.active ? 'bg-[var(--primary)]' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                        layer.active ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
