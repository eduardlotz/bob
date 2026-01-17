import { EmotionState } from "@/hooks/useBlobEmotions";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export {
  ROUTE_PATHS,
  ROUTE_IDS,
  ROUTE_CONFIG,
  ROUTES,
  getRouteLabelByPath,
  getAllRoutes,
} from "./config/routes";

export interface EmotionData {
  emotionState: EmotionState;
}

interface AppStore {
  currentRoute: string;
  isNavigationOpen: boolean;
  isOptionsClosing: boolean;

  showOptions: boolean;
  permissionGranted: boolean;
  isMobile: boolean;

  emotionData: EmotionData | null;
  requestEmotion: (emotion: EmotionState, durationMs?: number) => void;

  setCurrentRoute: (route: string) => void;
  setNavigationOpen: (open: boolean) => void;
  setShowOptions: (show: boolean) => void;
  closeOptionsWithAnimation: () => void;
  openOptions: () => void;
  setPermissionGranted: (granted: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setEmotionData: (data: EmotionData | null) => void;

  navigateToRoute: (route: string) => void;
  toggleOptions: () => void;

  getRouteByPath: (path: string) => any;
  isRouteActive: (path: string) => boolean;
}

// TODO: move to coreStore
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      currentRoute: "/home",
      isNavigationOpen: false,
      isOptionsClosing: false,
      showOptions: false,
      permissionGranted: false,
      isMobile: false,
      emotionData: null,

      setCurrentRoute: (route) => set({ currentRoute: route }),
      setNavigationOpen: (open) => set({ isNavigationOpen: open }),
      setShowOptions: (show) => set({ showOptions: show }),
      openOptions: () => set({ showOptions: true, isOptionsClosing: false }),
      closeOptionsWithAnimation: () => {
        // trigger closing flag so navigation can animate out
        // close + reset flag after a small delay
        set({ isOptionsClosing: true });
        setTimeout(() => {
          set({ showOptions: false, isOptionsClosing: false });
        }, 200);
      },
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

        set({ showOptions: false, isOptionsClosing: false });
      },

      toggleOptions: () => {
        const { showOptions } = get();
        if (showOptions) {
          get().closeOptionsWithAnimation();
        } else {
          get().openOptions();
        }
      },

      getRouteByPath: (path) => {
        const { ROUTES } = require("./routeConfig");
        return ROUTES.find((route: any) => route.path === path);
      },
      isRouteActive: (path) => get().currentRoute === path,
    }),
    {
      name: "app-store",
    },
  ),
);

export * from "./core/store";
export * from "./minigames";
export * from "./core/quests";
export * from "./viewStore";
