import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light';
  tempUnit: 'F' | 'C';
  windUnit: 'mph' | 'kph';
  precipUnit: 'in' | 'mm';
  sidebarCollapsed: boolean;
  notificationsEnabled: boolean;
  audioAlertsEnabled: boolean;
  alertSeverityThreshold: 'extreme' | 'severe' | 'moderate' | 'minor';

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setTempUnit: (unit: 'F' | 'C') => void;
  setWindUnit: (unit: 'mph' | 'kph') => void;
  setPrecipUnit: (unit: 'in' | 'mm') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  setAlertSeverityThreshold: (threshold: 'extreme' | 'severe' | 'moderate' | 'minor') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      tempUnit: 'F',
      windUnit: 'mph',
      precipUnit: 'in',
      sidebarCollapsed: false,
      notificationsEnabled: false,
      audioAlertsEnabled: false,
      alertSeverityThreshold: 'severe',

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTempUnit: (unit) => set({ tempUnit: unit }),
      setWindUnit: (unit) => set({ windUnit: unit }),
      setPrecipUnit: (unit) => set({ precipUnit: unit }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setAudioAlertsEnabled: (enabled) => set({ audioAlertsEnabled: enabled }),
      setAlertSeverityThreshold: (threshold) => set({ alertSeverityThreshold: threshold }),
    }),
    { name: 'storm-vision-settings' }
  )
);
