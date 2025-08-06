import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Route constants
export const ROUTE_PATHS = {
  HOME: "/home",
  ABOUT: "/about",
  PORTFOLIO: "/portfolio",
  TECHNICAL: "/technical",
  CREATIVE: "/creative",
  GUESTBOOK: "/guestbook",
} as const;

export const ROUTE_IDS = {
  HOME: "route_home",
  ABOUT: "route_about",
  PORTFOLIO: "route_portfolio",
  TECHNICAL: "route_technical",
  CREATIVE: "route_creative",
  GUESTBOOK: "route_guestbook",
} as const;

// Route configuration
export const ROUTE_CONFIG = {
  [ROUTE_PATHS.HOME]: {
    id: ROUTE_IDS.HOME,
    name: "Home",
    description: "Welcome to your game!",
    cost: 0,
    icon: "🏠",
    component: "home" as const,
  },
  [ROUTE_PATHS.ABOUT]: {
    id: ROUTE_IDS.ABOUT,
    name: "About",
    description: "Learn more about me",
    cost: 50,
    icon: "👤",
    component: "about" as const,
  },
  [ROUTE_PATHS.PORTFOLIO]: {
    id: ROUTE_IDS.PORTFOLIO,
    name: "Portfolio",
    description: "View my work",
    cost: 100,
    icon: "💼",
    component: "portfolio" as const,
  },
  [ROUTE_PATHS.TECHNICAL]: {
    id: ROUTE_IDS.TECHNICAL,
    name: "Technical",
    description: "Technical details",
    cost: 150,
    icon: "⚙️",
    component: "technical" as const,
  },
  [ROUTE_PATHS.CREATIVE]: {
    id: ROUTE_IDS.CREATIVE,
    name: "Creative",
    description: "Creative projects",
    cost: 200,
    icon: "🎨",
    component: "creative" as const,
  },
  [ROUTE_PATHS.GUESTBOOK]: {
    id: ROUTE_IDS.GUESTBOOK,
    name: "Guestbook",
    description: "Leave a message",
    cost: 250,
    icon: "📝",
    component: "guestbook" as const,
  },
} as const;

// Route definitions - these will be populated from the game store
export const ROUTES = [
  {
    path: ROUTE_PATHS.HOME,
    label: ROUTE_CONFIG[ROUTE_PATHS.HOME].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.HOME].component,
  },
  {
    path: ROUTE_PATHS.ABOUT,
    label: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].component,
  },
  {
    path: ROUTE_PATHS.PORTFOLIO,
    label: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].component,
  },
  {
    path: ROUTE_PATHS.TECHNICAL,
    label: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].component,
  },
  {
    path: ROUTE_PATHS.CREATIVE,
    label: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].component,
  },
  {
    path: ROUTE_PATHS.GUESTBOOK,
    label: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].component,
  },
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
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  setPermissionGranted: (granted: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setEmotionData: (data: EmotionState | null) => void;

  // Complex actions
  navigateToRoute: (route: string) => void;
  toggleOptions: () => void;

  // Route helpers
  getRouteByPath: (path: string) => (typeof ROUTES)[number] | undefined;
  isRouteActive: (path: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentRoute: ROUTE_PATHS.HOME,
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
