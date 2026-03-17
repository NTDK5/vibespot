import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AppState = {
  preferredCity: string | null;
  setPreferredCity: (city: string | null) => void;

  favoriteVibeIds: string[];
  toggleFavoriteVibe: (id: string) => void;

  recentlyViewedSpotIds: string[];
  addRecentlyViewedSpot: (id: string) => void;

  visitedSpotIds: string[];
  setVisitedSpotIds: (ids: string[]) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      preferredCity: null,
      setPreferredCity: (city) => set({ preferredCity: city }),

      favoriteVibeIds: [],
      toggleFavoriteVibe: (id) => {
        const current = get().favoriteVibeIds;
        const exists = current.includes(id);
        set({
          favoriteVibeIds: exists
            ? current.filter((v) => v !== id)
            : [...current, id],
        });
      },

      recentlyViewedSpotIds: [],
      addRecentlyViewedSpot: (id) => {
        const current = get().recentlyViewedSpotIds;
        if (current[0] === id) return;
        const next = [id, ...current.filter((x) => x !== id)].slice(0, 20);
        set({ recentlyViewedSpotIds: next });
      },

      visitedSpotIds: [],
      setVisitedSpotIds: (ids) => set({ visitedSpotIds: ids }),
    }),
    {
      name: "vibespot-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferredCity: state.preferredCity,
        favoriteVibeIds: state.favoriteVibeIds,
        visitedSpotIds: state.visitedSpotIds,
        recentlyViewedSpotIds: state.recentlyViewedSpotIds,
      }),
    }
  )
);

