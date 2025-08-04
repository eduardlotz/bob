import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Route definitions
export const ROUTES = [
  { path: "#", label: "Home", component: "home" },
  { path: "#", label: "About me", component: "about" },
  { path: "#", label: "Portfolio", component: "portfolio" },
  { path: "#", label: "Technical", component: "technical" },
  { path: "#", label: "Creative", component: "creative" },
  { path: "#", label: "Guestbook", component: "guestbook" },
] as const;

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
  setShowOptions: (show: boolean) => void;
  setPermissionGranted: (granted: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setEmotionData: (data: EmotionState | null) => void;

  // Complex actions
  navigateToRoute: (route: string) => void;

  // Route helpers
  getRouteByPath: (path: string) => (typeof ROUTES)[number] | undefined;
  isRouteActive: (path: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentRoute: "/",
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
      setShowOptions: (show) => set({ showOptions: show }),
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setEmotionData: (data) => set({ emotionData: data }),

      // Complex actions
      navigateToRoute: (route) => {
        // Update current route
        set({ currentRoute: route });

        // Handle different route behaviors
        if (route === "/") {
          // Home route - set to home mode
          set({
            sceneMode: "home",
            showOptions: false,
          });
        } else {
          // Other routes - just update the route
          set({
            sceneMode: "navigation",
            showOptions: false,
          });
        }
      },

      // Route helpers
      getRouteByPath: (path) => ROUTES.find((route) => route.path === path),
      isRouteActive: (path) => get().currentRoute === path,
    }),
    {
      name: "app-store",
    }
  )
);

// Export route utilities
export const getRouteLabelByPath = (path: string): string => {
  const route = ROUTES.find((r) => r.path === path);
  return route?.label || "Unknown";
};

export const getAllRoutes = () => ROUTES;
