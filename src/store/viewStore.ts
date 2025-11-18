import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CameraControls } from "@react-three/drei";
import {
  CAMERA_Y_POSITION,
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";

export interface CameraView {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  zoom?: number;
  transition?: {
    duration?: number;
    easing?: string;
  };
}

// camera settings for different object views
export const CAMERA_VIEWS: Record<string, CameraView> = {
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
    position: [-1, 1, -5],
    target: [-3, 1, -8],
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
};

export type ViewMode = "blob" | "object";

interface ViewStore {
  currentView: string;
  viewMode: ViewMode;
  isTransitioning: boolean;

  cameraControlsRef: React.RefObject<CameraControls> | null;

  setCurrentView: (viewId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraControlsRef: (ref: React.RefObject<CameraControls>) => void;
  transitionToView: (viewId: string) => Promise<void>;
  resetToDefaultView: () => Promise<void>;

  getCurrentViewConfig: () => CameraView | null;
  isDefaultView: () => boolean;
  isBlobView: () => boolean;
  isObjectView: () => boolean;
  getAvailableViews: () => CameraView[];
}

export const useViewStore = create<ViewStore>()(
  devtools(
    (set, get) => ({
      currentView: "default",
      viewMode: "blob",
      isTransitioning: false,
      cameraControlsRef: null,

      setCurrentView: (viewId) => set({ currentView: viewId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setCameraControlsRef: (ref) => set({ cameraControlsRef: ref }),

      transitionToView: async (viewId: string) => {
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
          viewMode: viewId === "default" ? "blob" : "object",
        });

        try {
          const controls = cameraControlsRef.current;

          await controls.setLookAt(
            ...viewConfig.position,
            ...viewConfig.target,
            true
          );
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
          viewMode: "blob",
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

      isBlobView: () => {
        return get().viewMode === "blob";
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
