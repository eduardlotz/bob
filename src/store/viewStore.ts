import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Vector3 } from "three";
import type { CameraControls } from "@react-three/drei";
import {
  CAMERA_Y_POSITION,
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";

// camera view configuration
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

// predefined camera views
export const CAMERA_VIEWS: Record<string, CameraView> = {
  default: {
    id: "default",
    name: "Default View",
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM], // match blob system positioning
    target: [0, CAMERA_Y_POSITION, 0], // match blob system lookAt target
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  },
  desk: {
    id: "desk",
    name: "Desk View",
    position: [-1, 2, 2], // positioned to view desk from front-right angle
    target: [-3, -0.3, 0], // looking at desk position (FLOOR_Y_POSITION + 1.2 = -1.5 + 1.2 = -0.3)
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
  bookshelf: {
    id: "bookshelf",
    name: "Bookshelf View",
    position: [1, 1, -1], // positioned to view bookshelf from front
    target: [3, -1.5, -3], // looking at bookshelf position (FLOOR_Y_POSITION = -1.5)
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
  computer: {
    id: "computer",
    name: "Computer View",
    position: [-1, 0, -5], // positioned to view computer in portfolio scene
    target: [-3, -1, -8], // looking at computer position
    transition: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
  },
};

// view mode types
export type ViewMode = "blob" | "object";

// view state interface
interface ViewStore {
  // current view state
  currentView: string;
  viewMode: ViewMode;
  isTransitioning: boolean;

  // camera controls reference
  cameraControlsRef: React.RefObject<CameraControls> | null;

  // view management
  setCurrentView: (viewId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraControlsRef: (ref: React.RefObject<CameraControls>) => void;
  transitionToView: (viewId: string) => Promise<void>;
  resetToDefaultView: () => Promise<void>;

  // view helpers
  getCurrentViewConfig: () => CameraView | null;
  isDefaultView: () => boolean;
  isBlobView: () => boolean;
  isObjectView: () => boolean;
  getAvailableViews: () => CameraView[];
}

export const useViewStore = create<ViewStore>()(
  devtools(
    (set, get) => ({
      // initial state
      currentView: "default",
      viewMode: "blob", // start in blob view mode
      isTransitioning: false,
      cameraControlsRef: null,

      // basic setters
      setCurrentView: (viewId) => set({ currentView: viewId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setCameraControlsRef: (ref) => set({ cameraControlsRef: ref }),

      // view transition logic
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
          // perform camera transition with proper promise handling
          const controls = cameraControlsRef.current;

          await controls.setLookAt(
            ...viewConfig.position,
            ...viewConfig.target,
            true // enable smooth transition
          );
        } catch (error) {
          console.error("Camera transition failed:", error);
        } finally {
          set({ isTransitioning: false });
        }
      },

      resetToDefaultView: async () => {
        const { isTransitioning } = get();

        // prevent multiple transitions
        if (isTransitioning) {
          return;
        }

        // switch to blob mode - let BlobHead/HeadNavigation take over camera control
        set({
          currentView: "default",
          viewMode: "blob",
          isTransitioning: false, // no manual transition needed, blob system handles it
        });
      },

      // helper methods
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
