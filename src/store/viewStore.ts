import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CameraControls } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import {
  CAMERA_Y_POSITION,
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";
import { ROUTE_PATHS, useAppStore, useCoreStore } from ".";
import { Vector3 } from "three";

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
  defaultViewMode?: ViewMode;
}

export interface FocusTarget {
  position: Vector3;
  distance?: number;
}

export type CameraViewId =
  | "default"
  | "upgrades"
  | "portfolio"
  | "minigames"
  | "navigation"
  | "phone:home"
  | "phone:shop"
  | "phone:debug"
  | "phone:quests"
  | "phone:options"
  | "phone:camera"
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
  navigation: {
    id: "navigation",
    name: "Navigation/Menu View",
    position: [0, CAMERA_HEIGHT - 1.5, VISIBLE_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "fixed",
  },
  "phone:shop": {
    id: "phone:shop",
    name: "Shop View",
    position: [0, CAMERA_HEIGHT - 1.5, VISIBLE_OPTIONS_CAMERA_ZOOM - 2],
    target: [0, CAMERA_Y_POSITION - 1.5, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  },
  "phone:options": {
    id: "phone:options",
    name: "Shop View",
    position: [0, CAMERA_HEIGHT - 0.5, VISIBLE_OPTIONS_CAMERA_ZOOM - 1],
    target: [0, CAMERA_Y_POSITION - 0.5, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  },
  "phone:camera": {
    id: "phone:camera",
    name: "Camera View",
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION - 1, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  },
  upgrades: {
    id: "upgrades",
    name: "Upgrades View",
  },
  portfolio: {
    id: "portfolio",
    name: "Portfolio Orbit View",
    position: [5, CAMERA_HEIGHT - 0.5, 73],
    target: [0, CAMERA_Y_POSITION - 0.5, 0],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "object",
  },
  minigames: {
    id: "minigames",
    name: "Minigames View",
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION, 0],
  },
  "phone:home": {
    id: "phone:home",
    name: "Phone View",
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION, 0],
  },
  "phone:debug": {
    id: "phone:debug",
    name: "Debug View",
  },
  "phone:quests": {
    id: "phone:quests",
    name: "Quests View",
  },
  desk: {
    id: "desk",
    name: "Desk View",
    position: [-2.5, 0.5, 0],
    target: [-3.5, 0.4, 0],
    transition: {
      duration: 800,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "object",
  },
  bookshelf: {
    id: "bookshelf",
    name: "Bookshelf View",
    position: [1.75, 0.5, -1],
    target: [3.75, 0.5, -4],
    transition: {
      duration: 550,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "object",
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
    defaultViewMode: "object",
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
    defaultViewMode: "object",
  },
};

export type ViewMode = "fixed" | "object";

interface ViewStore {
  currentView: CameraViewId;
  previousView: CameraViewId;

  defaultViewMode: ViewMode; // default for current scene
  viewMode: ViewMode; // currently active
  previousViewMode: ViewMode;
  isTransitioning: boolean;

  cameraControlsRef: React.RefObject<CameraControls> | null;

  applyViewModeToControls: (mode: ViewMode) => void;

  setCurrentView: (viewId: CameraViewId) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraControlsRef: (ref: React.RefObject<CameraControls>) => void;
  transitionToView: (viewId: CameraViewId) => Promise<void>;
  transitionBack: () => Promise<void>;
  resetToDefaultView: () => Promise<void>;
  resetToPreviousView: () => Promise<void>;

  getCurrentViewConfig: () => CameraView | null;
  isDefaultView: () => boolean;
  isCreativeView: () => boolean;
  isPhoneView: () => boolean;
  isObjectView: () => boolean;
  isNavigationView: () => boolean;
  getAvailableViews: () => CameraView[];

  setDefaultViewMode: (mode: ViewMode) => void;

  focusOnTarget: (target: FocusTarget) => Promise<void>;
  isImageFocused: boolean;
  focusedImageTitle: string | null;
  lastFocusPosition: Vector3 | null;

  focusOnImage: (title: string) => void;
  clearImageFocus: () => void;
}

export const useViewStore = create<ViewStore>()(
  devtools(
    (set, get) => ({
      currentView: "default",
      previousView: "default",
      defaultViewMode: "fixed",
      viewMode: "fixed",
      previousViewMode: "fixed",
      isTransitioning: false,
      cameraControlsRef: null,
      lastFocusPosition: null,

      applyViewModeToControls: (mode: ViewMode) => {
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;

        // TODO: apply all view mode rules here like cursor or camera controls
        if (mode === "object") {
          const cameraPos = new Vector3();
          controls.getPosition(cameraPos); // current camera world position
          set({ lastFocusPosition: cameraPos.clone() }); // store for later restore

          const target = new Vector3();
          // freeze current orbit center as look-at point
          controls.getTarget(target);
          controls.setTarget(target.x, target.y, target.z, true);

          // if (get().isImageFocused) {
          //   controls.minDistance = 2;
          // } else if (get().currentView === "portfolio")
          //   controls.minDistance = 62;
          // else controls.minDistance = 4;

          controls.mouseButtons.left = get().focusedImageTitle
            ? CameraControlsImpl.ACTION.TRUCK
            : CameraControlsImpl.ACTION.ROTATE;
        } else {
          // restore default target
          controls.saveState();
          controls.reset();
        }
      },

      setDefaultViewMode: (mode: ViewMode) =>
        set({ defaultViewMode: mode, viewMode: mode, previousViewMode: mode }),

      setCurrentView: (viewId) => set({ currentView: viewId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setCameraControlsRef: (ref) => set({ cameraControlsRef: ref }),

      transitionToView: async (nextView: CameraViewId) => {
        const {
          previousView,
          cameraControlsRef,
          isTransitioning,
          viewMode,
          defaultViewMode,
        } = get();

        // prevent multiple transitions
        if (isTransitioning || !cameraControlsRef?.current) {
          return;
        }

        const viewConfig = CAMERA_VIEWS[nextView];
        if (!viewConfig) {
          console.warn(`"${nextView}" view config missing`);
          return;
        }

        set((state) => ({
          previousView: state.currentView,
          isTransitioning: true,
          currentView: nextView,
          previousViewMode: state.viewMode,
          viewMode: viewConfig.defaultViewMode ?? state.viewMode,
          // defaultViewMode: viewConfig.defaultViewMode ?? state.defaultViewMode,
          isImageFocused: false,
          focusedImageTitle: null,
          lastFocusPosition: null,
        }));

        get().applyViewModeToControls(
          viewConfig.defaultViewMode ?? get().viewMode,
        );

        try {
          const controls = cameraControlsRef.current;

          if (viewConfig.position && viewConfig.target) {
            controls.setLookAt(
              ...viewConfig.position,
              ...viewConfig.target,
              true,
            );
            setTimeout(() => set({ isTransitioning: false }), 0);
          }
        } catch (error) {
          console.error("Camera transition failed:", error);
          setTimeout(() => set({ isTransitioning: false }), 0);
        }
      },

      transitionBack: async () => {
        set((state) => ({
          currentView: state.previousView,
          previousView: state.currentView,
        }));
      },

      resetToDefaultView: async () => {
        const {
          isTransitioning,
          currentView,
          cameraControlsRef,
          lastFocusPosition,
        } = get();

        if (isTransitioning || !cameraControlsRef?.current) {
          return;
        }

        useCoreStore.getState().resetPreview();
        const appStore = useAppStore.getState();
        const currentRoute = appStore.currentRoute;

        // viewMode is set to fixed without transition
        // TODO: fix edge case when going from portfolio -> any other
        const targetView: CameraViewId =
          currentRoute === ROUTE_PATHS.PORTFOLIO ? "portfolio" : "default";

        const viewConfig = CAMERA_VIEWS[targetView];

        set({
          currentView: targetView,
          viewMode: viewConfig.defaultViewMode ?? "fixed",
          isImageFocused: false,
          focusedImageTitle: null,
          isTransitioning: true,
        });

        get().applyViewModeToControls(
          viewConfig.defaultViewMode ?? get().viewMode,
        );

        try {
          const controls = cameraControlsRef.current;

          // reset controls here because on mobile the reset does not work in the reset function (???)
          controls.mouseButtons.left = CameraControlsImpl.ACTION.ROTATE;
          controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;

          // currently only two different defaults (creative -> "orbit view" & rest -> "fixed view")
          const viewConfig =
            CAMERA_VIEWS[
              currentRoute === ROUTE_PATHS.PORTFOLIO ? "portfolio" : "default"
            ];

          if (!viewConfig) {
            console.warn(`"${currentView}" view config missing`);
            return;
          }

          // set polar small angles for portfolio vs bigger for rest
          if (currentRoute === ROUTE_PATHS.PORTFOLIO) {
            controls.minPolarAngle = 1.55;
            controls.maxPolarAngle = 1.6;
            controls.minDistance = 2.5;
            controls.maxDistance = 72.5;
          } else {
            controls.maxPolarAngle = 2;
            controls.minPolarAngle = 0.2;
            controls.minDistance = 1;
            controls.maxDistance = 7;
          }

          if (
            currentRoute === ROUTE_PATHS.PORTFOLIO &&
            lastFocusPosition &&
            viewConfig.target
            // &&
            // !get().isNavigationView()
          ) {
            const target = new Vector3(0, 0, 0);
            controls.getTarget(target); // keep current target, or optionally restore previous target if you store it

            controls.setLookAt(
              lastFocusPosition.x,
              lastFocusPosition.y,
              lastFocusPosition.z,
              ...viewConfig.target,
              true,
            );
            setTimeout(() => set({ isTransitioning: false }), 0);
          } else if (viewConfig.position && viewConfig.target) {
            controls.setLookAt(
              ...viewConfig.position,
              ...viewConfig.target,
              true,
            );
            setTimeout(() => set({ isTransitioning: false }), 0);
          }
        } catch (error) {
          console.error("Camera transition failed:", error);
          setTimeout(() => set({ isTransitioning: false }), 0);
        }
      },
      resetToPreviousView: async () => {
        const { isTransitioning, previousView, previousViewMode } = get();

        if (isTransitioning || !previousView) {
          return;
        }

        set({
          currentView: previousView,
          viewMode: previousViewMode,
          isTransitioning: false,
        });

        get().applyViewModeToControls(previousViewMode);
      },

      getCurrentViewConfig: () => {
        const { currentView } = get();
        return CAMERA_VIEWS[currentView] || null;
      },

      isDefaultView: () => {
        return get().currentView === "default";
      },
      isCreativeView: () => {
        return get().currentView === "portfolio";
      },

      isPhoneView: () => {
        return get().currentView.startsWith("phone:");
      },

      isObjectView: () => {
        return get().viewMode === "object";
      },

      isNavigationView: () => {
        return get().currentView === "navigation";
      },

      getAvailableViews: () => {
        return Object.values(CAMERA_VIEWS);
      },

      focusOnTarget: async ({ position, distance = 12 }) => {
        const { cameraControlsRef, isTransitioning } = get();
        if (isTransitioning || !cameraControlsRef?.current) return;

        set({
          isTransitioning: true,
          viewMode: "object",
          // currentView: "portfolio",
        });

        get().applyViewModeToControls("object");

        try {
          const controls = cameraControlsRef.current;

          const dir = position.clone().normalize().multiplyScalar(distance);
          const camPos = dir.add(position);

          controls.setLookAt(
            camPos.x,
            camPos.y,
            camPos.z,
            position.x,
            position.y,
            position.z,
            true,
          );

          controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
          controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
        } finally {
          set({ isTransitioning: false });
        }
      },
      isImageFocused: false,
      focusedImageTitle: null,

      focusOnImage: (title) =>
        set({
          isImageFocused: true,
          focusedImageTitle: title,
        }),

      clearImageFocus: () => {
        const { isTransitioning, cameraControlsRef, lastFocusPosition } = get();
        if (
          isTransitioning ||
          !cameraControlsRef?.current ||
          !lastFocusPosition
        )
          return;

        const controls = cameraControlsRef.current;

        // move camera back to stored lastFocusPosition
        const target = new Vector3();
        controls.getTarget(target); // keep current target, or optionally restore previous target if you store it

        controls.setLookAt(
          lastFocusPosition.x,
          lastFocusPosition.y,
          lastFocusPosition.z,
          target.x,
          target.y,
          target.z,
          true,
        );

        set({
          isImageFocused: false,
          focusedImageTitle: null,
        });

        controls.mouseButtons.left = CameraControlsImpl.ACTION.ROTATE;
        controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
      },
    }),
    {
      name: "view-store",
    },
  ),
);
