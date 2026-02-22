import { create } from 'zustand';

interface RadarState {
  playing: boolean;
  speed: number;
  currentFrame: number;
  totalFrames: number;
  opacity: number;
  showRadar: boolean;
  showSatellite: boolean;
  showAlerts: boolean;
  showCameras: boolean;
  showStormReports: boolean;
  mapStyle: 'dark' | 'satellite' | 'terrain' | 'light';

  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setSpeed: (speed: number) => void;
  setCurrentFrame: (frame: number) => void;
  setTotalFrames: (total: number) => void;
  setOpacity: (opacity: number) => void;
  toggleRadar: () => void;
  toggleSatellite: () => void;
  toggleAlerts: () => void;
  toggleCameras: () => void;
  toggleStormReports: () => void;
  setMapStyle: (style: 'dark' | 'satellite' | 'terrain' | 'light') => void;
}

export const useRadarStore = create<RadarState>((set) => ({
  playing: true,
  speed: 500,
  currentFrame: 0,
  totalFrames: 0,
  opacity: 0.7,
  showRadar: true,
  showSatellite: false,
  showAlerts: true,
  showCameras: false,
  showStormReports: false,
  mapStyle: 'dark',

  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setTotalFrames: (total) => set({ totalFrames: total }),
  setOpacity: (opacity) => set({ opacity }),
  toggleRadar: () => set((s) => ({ showRadar: !s.showRadar })),
  toggleSatellite: () => set((s) => ({ showSatellite: !s.showSatellite })),
  toggleAlerts: () => set((s) => ({ showAlerts: !s.showAlerts })),
  toggleCameras: () => set((s) => ({ showCameras: !s.showCameras })),
  toggleStormReports: () => set((s) => ({ showStormReports: !s.showStormReports })),
  setMapStyle: (style) => set({ mapStyle: style }),
}));
