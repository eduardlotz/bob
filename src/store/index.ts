import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Re-export route configuration from centralized config
export {
  ROUTE_PATHS,
  ROUTE_IDS,
  ROUTE_CONFIG,
  ROUTES,
  getRouteLabelByPath,
  getAllRoutes,
} from "./routeConfig";

// Scene related types
export type SceneMode = "home" | "navigation";

export interface EmotionState {
  emotionState: any;
  tapCount: number;
  getEmotionIcon: () => string;
}

// Main app state interface
interface AppStore {
  // Navigation state
  currentRoute: string;
  isNavigationOpen: boolean;
  isOptionsClosing: boolean;

  // Scene state
  sceneMode: SceneMode;

  // 3D Scene objects and states
  showOptions: boolean;
  permissionGranted: boolean;
  isMobile: boolean;

  // Emotion/Blob state
  emotionData: EmotionState | null;
  // dispatch emotion cues to blob
  requestEmotion: (
    emotion:
      | "normal"
      | "happy"
      | "dizzy"
      | "mad"
      | "thinking"
      | "suspicious"
      | "sad",
    durationMs?: number
  ) => void;

  // Actions
  setCurrentRoute: (route: string) => void;
  setNavigationOpen: (open: boolean) => void;
  setSceneMode: (mode: SceneMode) => void;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  closeOptionsWithAnimation: () => void;
  openOptions: () => void;
  setPermissionGranted: (granted: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setEmotionData: (data: EmotionState | null) => void;

  // Complex actions
  navigateToRoute: (route: string) => void;
  toggleOptions: () => void;

  // Route helpers
  getRouteByPath: (path: string) => any;
  isRouteActive: (path: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentRoute: "/home",
      isNavigationOpen: false,
      isOptionsClosing: false,
      sceneMode: "home",
      showOptions: false,
      permissionGranted: false,
      isMobile: false,
      emotionData: null,

      // Basic setters
      setCurrentRoute: (route) => set({ currentRoute: route }),
      setNavigationOpen: (open) => set({ isNavigationOpen: open }),
      setSceneMode: (mode) => set({ sceneMode: mode }),
      setShowOptions: (show) =>
        set({
          showOptions:
            typeof show === "function" ? show(get().showOptions) : show,
        }),
      openOptions: () => set({ showOptions: true, isOptionsClosing: false }),
      closeOptionsWithAnimation: () => {
        // trigger closing flag so animated components can play exit
        set({ isOptionsClosing: true });
        // after a small delay, actually close options and reset closing flag
        setTimeout(() => {
          set({ showOptions: false, isOptionsClosing: false });
        }, 400);
      },
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setEmotionData: (data) => set({ emotionData: data }),
      requestEmotion: (emotion, durationMs) => {
        // store only provides a lightweight signal; HeadNavigation consumes and triggers on change
        set((s) => ({ emotionData: s.emotionData }));
        // use a global event to avoid tight coupling
        try {
          const ev = new CustomEvent("vg-request-emotion", {
            detail: { emotion, durationMs },
          });
          window.dispatchEvent(ev);
        } catch {}
      },

      // Complex actions
      navigateToRoute: (route) => {
        // Update current route
        set({ currentRoute: route });

        // Always close options when navigating
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

      // Route helpers
      getRouteByPath: (path) => {
        const { ROUTES } = require("./routeConfig");
        return ROUTES.find((route: any) => route.path === path);
      },
      isRouteActive: (path) => get().currentRoute === path,
    }),
    {
      name: "app-store",
    }
  )
);

// Export other stores
export * from "./gameStore";
export * from "./questStore";
export * from "./routeStore";
export * from "./viewStore";
