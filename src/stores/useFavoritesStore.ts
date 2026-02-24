import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteItem {
  id: string;
  type: 'curated' | 'dot'; // curated cam vs DOT camera
  name: string;
  city?: string;
  stateCode?: string;
  addedAt: number;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (item) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === item.id)) return state;
          return { favorites: [...state.favorites, item] };
        }),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      toggleFavorite: (item) => {
        const state = get();
        if (state.favorites.some((f) => f.id === item.id)) {
          set({ favorites: state.favorites.filter((f) => f.id !== item.id) });
        } else {
          set({ favorites: [...state.favorites, item] });
        }
      },

      clearAll: () => set({ favorites: [] }),
    }),
    { name: 'storm-vision-favorites' }
  )
);
