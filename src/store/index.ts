import { create } from "zustand";
import { devtools } from "zustand/middleware";

export {
  ROUTE_PATHS,
  ROUTE_IDS,
  ROUTE_CONFIG,
  ROUTES,
  getRouteLabelByPath,
  getAllRoutes,
} from "./routeConfig";

export type SceneMode = "home" | "navigation";

export interface EmotionState {
  emotionState: any;
  tapCount: number;
  getEmotionIcon: () => string;
}

interface AppStore {
  currentRoute: string;
  isNavigationOpen: boolean;
  isOptionsClosing: boolean;

  sceneMode: SceneMode;

  showOptions: boolean;
  permissionGranted: boolean;
  isMobile: boolean;

  emotionData: EmotionState | null;
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

  setCurrentRoute: (route: string) => void;
  setNavigationOpen: (open: boolean) => void;
  setSceneMode: (mode: SceneMode) => void;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  closeOptionsWithAnimation: () => void;
  openOptions: () => void;
  setPermissionGranted: (granted: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setEmotionData: (data: EmotionState | null) => void;

  navigateToRoute: (route: string) => void;
  toggleOptions: () => void;

  getRouteByPath: (path: string) => any;
  isRouteActive: (path: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      currentRoute: "/home",
      isNavigationOpen: false,
      isOptionsClosing: false,
      sceneMode: "home",
      showOptions: false,
      permissionGranted: false,
      isMobile: false,
      emotionData: null,

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
      // TODO: check if a custom event is better
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
    }
  )
);

export * from "./gameStore";
export * from "./questStore";
export * from "./viewStore";
