'use client';
import { Play, Pause, SkipBack, SkipForward, Minus, Plus } from 'lucide-react';
import { useRadarStore } from '@/stores/useRadarStore';

export function RadarControls() {
  const {
    playing, speed, currentFrame, totalFrames, opacity,
    togglePlaying, setSpeed, setCurrentFrame, setOpacity,
  } = useRadarStore();

  const stepFrame = (delta: number) => {
    setCurrentFrame(Math.max(0, Math.min(totalFrames - 1, currentFrame + delta)));
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 sm:gap-3 glass rounded-2xl px-3 sm:px-4 py-2">
      {/* Frame scrubber */}
      <input
        type="range"
        min={0}
        max={Math.max(0, totalFrames - 1)}
        value={currentFrame}
        onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
        className="w-20 sm:w-32 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
        aria-label="Radar frame"
      />

      <button
        onClick={() => stepFrame(-1)}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-secondary)]"
        aria-label="Previous frame"
      >
        <SkipBack size={16} />
      </button>

      <button
        onClick={togglePlaying}
        className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <button
        onClick={() => stepFrame(1)}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-secondary)]"
        aria-label="Next frame"
      >
        <SkipForward size={16} />
      </button>

      {/* Speed control */}
      <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-[var(--border)]">
        <button
          onClick={() => setSpeed(Math.min(1000, speed + 100))}
          className="p-1 rounded hover:bg-white/10 text-[var(--text-tertiary)]"
          aria-label="Slower"
        >
          <Minus size={14} />
        </button>
        <span className="text-[10px] data-mono text-[var(--text-tertiary)] w-8 text-center">
          {speed < 400 ? 'Fast' : speed < 700 ? 'Med' : 'Slow'}
        </span>
        <button
          onClick={() => setSpeed(Math.max(200, speed - 100))}
          className="p-1 rounded hover:bg-white/10 text-[var(--text-tertiary)]"
          aria-label="Faster"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Opacity */}
      <div className="hidden sm:flex items-center gap-1 ml-1 pl-2 border-l border-[var(--border)]">
        <span className="text-[10px] text-[var(--text-tertiary)]">Opacity</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.1}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
          aria-label="Radar opacity"
        />
      </div>
    </div>
  );
}
