import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  state?: string;
  isPrimary?: boolean;
}

interface LocationState {
  currentLocation: { lat: number; lon: number; name: string } | null;
  savedLocations: SavedLocation[];
  locationPermission: 'prompt' | 'granted' | 'denied';

  setCurrentLocation: (loc: { lat: number; lon: number; name: string } | null) => void;
  setLocationPermission: (perm: 'prompt' | 'granted' | 'denied') => void;
  addSavedLocation: (loc: SavedLocation) => void;
  removeSavedLocation: (id: string) => void;
  setPrimaryLocation: (id: string) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentLocation: null,
      savedLocations: [],
      locationPermission: 'prompt',

      setCurrentLocation: (loc) => set({ currentLocation: loc }),
      setLocationPermission: (perm) => set({ locationPermission: perm }),

      addSavedLocation: (loc) =>
        set((state) => ({
          savedLocations: state.savedLocations.length < 10
            ? [...state.savedLocations, loc]
            : state.savedLocations,
        })),

      removeSavedLocation: (id) =>
        set((state) => ({
          savedLocations: state.savedLocations.filter((l) => l.id !== id),
        })),

      setPrimaryLocation: (id) =>
        set((state) => ({
          savedLocations: state.savedLocations.map((l) => ({
            ...l,
            isPrimary: l.id === id,
          })),
        })),
    }),
    { name: 'storm-vision-locations' }
  )
);
