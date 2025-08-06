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

  // Scene state
  sceneMode: SceneMode;

  // 3D Scene objects and states
  showOptions: boolean;
  permissionGranted: boolean;
  isMobile: boolean;

  // Emotion/Blob state
  emotionData: EmotionState | null;

  // Actions
  setCurrentRoute: (route: string) => void;
  setNavigationOpen: (open: boolean) => void;
  setSceneMode: (mode: SceneMode) => void;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
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
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setEmotionData: (data) => set({ emotionData: data }),

      // Complex actions
      navigateToRoute: (route) => {
        // Update current route
        set({ currentRoute: route });

        // Always close options when navigating
        set({ showOptions: false });
      },

      toggleOptions: () => {
        set((state) => ({ showOptions: !state.showOptions }));
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
