import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CameraControls } from "@react-three/drei";
import {
  CAMERA_Y_POSITION,
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  FUNNY_FISHEYE_ZOOM,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";

export interface CameraView {
  id: string;
  name: string;
  position?: [number, number, number];
  target?: [number, number, number];
  zoom?: number;
  transition?: {
    duration?: number;
    easing?: string;
  };
}

export type CameraViewId =
  | "default"
  | "shop"
  | "upgrades"
  | "phone"
  | "desk"
  | "bookshelf"
  | "computer"
  | "cardbox";

// camera settings for different object views
export const CAMERA_VIEWS: Record<CameraViewId, CameraView> = {
  default: {
    id: "default",
    name: "Default View",
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  },
  shop: {
    id: "shop",
    name: "Shop View",
    position: [0, CAMERA_HEIGHT - 1, VISIBLE_OPTIONS_CAMERA_ZOOM - 2],
    target: [0, CAMERA_Y_POSITION, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  },
  upgrades: {
    id: "upgrades",
    name: "Upgrades View",
  },
  phone: {
    id: "phone",
    name: "Phone View",
  },
  desk: {
    id: "desk",
    name: "Desk View",
    position: [-1, 2, 2],
    target: [-3, -0.3, 0],
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
  bookshelf: {
    id: "bookshelf",
    name: "Bookshelf View",
    position: [1, 1, 1],
    target: [3, 0, -3],
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
  computer: {
    id: "computer",
    name: "Computer View",
    position: [4, 0, 2],
    target: [4, 0, 2],
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
  cardbox: {
    id: "cardbox",
    name: "Cardbox View",
    position: [3, CAMERA_HEIGHT, 2],
    target: [4.5, -1.5, 2],
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
};

export type ViewMode = "fixed" | "object";

interface ViewStore {
  currentView: CameraViewId;
  viewMode: ViewMode;
  isTransitioning: boolean;

  cameraControlsRef: React.RefObject<CameraControls> | null;

  setCurrentView: (viewId: CameraViewId) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraControlsRef: (ref: React.RefObject<CameraControls>) => void;
  transitionToView: (viewId: CameraViewId) => Promise<void>;
  resetToDefaultView: () => Promise<void>;

  getCurrentViewConfig: () => CameraView | null;
  isDefaultView: () => boolean;
  isObjectView: () => boolean;
  getAvailableViews: () => CameraView[];
}

export const useViewStore = create<ViewStore>()(
  devtools(
    (set, get) => ({
      currentView: "default",
      viewMode: "fixed",
      isTransitioning: false,
      cameraControlsRef: null,

      setCurrentView: (viewId) => set({ currentView: viewId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setCameraControlsRef: (ref) => set({ cameraControlsRef: ref }),

      transitionToView: async (viewId: CameraViewId) => {
        const { cameraControlsRef, isTransitioning } = get();

        // prevent multiple transitions
        if (isTransitioning || !cameraControlsRef?.current) {
          return;
        }

        const viewConfig = CAMERA_VIEWS[viewId];
        if (!viewConfig) {
          console.warn(`View "${viewId}" not found`);
          return;
        }

        set({
          isTransitioning: true,
          currentView: viewId,
          viewMode: viewId !== "default" ? "object" : "fixed",
        });

        try {
          if (viewConfig.position && viewConfig.target) {
            const controls = cameraControlsRef.current;

            controls.setLookAt(
              ...viewConfig.position,
              ...viewConfig.target,
              true
            );
          }
        } catch (error) {
          console.error("Camera transition failed:", error);
        } finally {
          set({ isTransitioning: false });
        }
      },

      resetToDefaultView: async () => {
        const { isTransitioning } = get();

        if (isTransitioning) {
          return;
        }

        set({
          currentView: "default",
          viewMode: "fixed",
          isTransitioning: false,
        });
      },

      getCurrentViewConfig: () => {
        const { currentView } = get();
        return CAMERA_VIEWS[currentView] || null;
      },

      isDefaultView: () => {
        return get().currentView === "default";
      },

      isObjectView: () => {
        return get().viewMode === "object";
      },

      getAvailableViews: () => {
        return Object.values(CAMERA_VIEWS);
      },
    }),
    {
      name: "view-store",
    }
  )
);
