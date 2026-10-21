import type { EmotionState } from "@/hooks/useBlobEmotions";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ROUTE_PATHS, ROUTES } from "../config/routes";

import { createNavigationMenuState, type NavigationMenuState } from "./navigationMenu";

export interface EmotionData {
  emotionState: EmotionState;
}

interface AppStore extends NavigationMenuState {
  currentRoute: string;

  permissionGranted: boolean;
  isMobile: boolean;

  emotionData: EmotionData | null;
  requestEmotion: (emotion: EmotionState, durationMs?: number) => void;

  setCurrentRoute: (route: string) => void;
  setPermissionGranted: (granted: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setEmotionData: (data: EmotionData | null) => void;

  navigateToRoute: (route: string) => void;

  getRouteByPath: (path: string) => any;
  isRouteActive: (path: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...createNavigationMenuState(set, get),
      currentRoute:
        typeof window !== "undefined"
          ? window.location.pathname
          : ROUTE_PATHS.HOME,
      permissionGranted: false,
      isMobile: false,
      emotionData: null,

      setCurrentRoute: (route) =>
        set((state) =>
          state.currentRoute === route ? state : { currentRoute: route },
        ),
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setEmotionData: (data) => set({ emotionData: data }),
      // TODO: check if a custom event is better
      requestEmotion: (emotion, durationMs) => {
        // store only provides a lightweight signal; HeadNavigation consumes and triggers on change
        set((s) => ({ emotionData: s.emotionData }));
        // use a global event to avoid tight coupling
        try {
          const ev = new CustomEvent("bob-emotion", {
            detail: { emotion, durationMs },
          });
          window.dispatchEvent(ev);
        } catch {}
      },

      navigateToRoute: (route) => {
        set({ currentRoute: route });

        get().setShowOptions(false);
      },

      getRouteByPath: (path) => ROUTES.find((route) => route.path === path),
      isRouteActive: (path) => get().currentRoute === path,
    }),
    {
      name: "app-store",
    },
  ),
);

