import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  createInitialResolvedFavorites,
  resolveResolvedFavoritesArtwork,
} from "@/3d-objects/socials/favorites";
import type { ResolvedFavoriteEntry } from "@/3d-objects/socials/types";
import type { ThroneId } from "@/3d-objects/socials/data";

interface SocialsStore {
  focusedThrone: ThroneId | null;
  resolvedFavorites: ResolvedFavoriteEntry[];
  favoritesStatus: "idle" | "loading" | "ready";
  setFocused: (id: ThroneId) => void;
  clearFocus: () => void;
  ensureFavoritesLoaded: () => Promise<ResolvedFavoriteEntry[]>;
}

let favoritesLoadPromise: Promise<ResolvedFavoriteEntry[]> | null = null;

export const useSocialsStore = create<SocialsStore>()(
  persist(
    (set, get) => ({
      focusedThrone: null,
      resolvedFavorites: createInitialResolvedFavorites(),
      favoritesStatus: "idle",
      setFocused: (id) => set({ focusedThrone: id }),
      clearFocus: () => set({ focusedThrone: null }),
      ensureFavoritesLoaded: () => {
        const state = get();
        if (state.favoritesStatus === "ready") {
          return Promise.resolve(state.resolvedFavorites);
        }

        if (!favoritesLoadPromise) {
          set({ favoritesStatus: "loading" });
          favoritesLoadPromise = resolveResolvedFavoritesArtwork()
            .then((resolvedFavorites) => {
              set({
                resolvedFavorites,
                favoritesStatus: "ready",
              });
              favoritesLoadPromise = Promise.resolve(resolvedFavorites);
              return resolvedFavorites;
            })
            .catch((error) => {
              favoritesLoadPromise = null;
              set({ favoritesStatus: "idle" });
              throw error;
            });
        }

        return favoritesLoadPromise;
      },
    }),
    {
      name: "socials-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        focusedThrone: state.focusedThrone,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SocialsStore> | undefined;
        return {
          ...currentState,
          ...persisted,
        };
      },
    },
  ),
);
