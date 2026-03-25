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
import { useMiniGameStore } from "@/store/minigames";
import { Vector3 } from "three";

export interface CameraView {
  id: string;
  name: string;
  position?: [number, number, number];
  target?: [number, number, number];
  zoom?: number;
  orbit?: CameraOrbitSettings;
  cursorFollow?: {
    strength?: number;
    yScale?: number;
    swayX?: number;
    swayY?: number;
  };
  transition?: {
    duration?: number;
    easing?: string;
  };
  defaultViewMode?: ViewMode;
}

export interface CameraOrbitSettings {
  minPolarAngle?: number;
  maxPolarAngle?: number;
  defaultPolarAngle?: number;
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;
  defaultAzimuthAngle?: number;
  minDistance?: number;
  maxDistance?: number;
  defaultDistance?: number;
}

export interface FocusTarget {
  position: Vector3;
  distance?: number;
}

export type CameraViewId =
  | "default"
  | "upgrades"
  | "about"
  | "portfolio"
  | "minigames"
  | "minigames:slot_machine"
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

const resolveRouteViewId = (route: string): CameraViewId => {
  if (route === ROUTE_PATHS.PORTFOLIO) return "portfolio";
  if (route === ROUTE_PATHS.MINIGAMES) {
    const activeGame = useMiniGameStore.getState().activeGame;
    if (activeGame === "SLOT_MACHINE") return "minigames:slot_machine";
    return "default";
  }
  return "default";
};

const DEFAULT_ORBIT_SETTINGS: Required<
  Pick<
    CameraOrbitSettings,
    | "minPolarAngle"
    | "maxPolarAngle"
    | "minAzimuthAngle"
    | "maxAzimuthAngle"
    | "minDistance"
    | "maxDistance"
  >
> = {
  minPolarAngle: 0.2,
  maxPolarAngle: 2,
  minAzimuthAngle: Number.NEGATIVE_INFINITY,
  maxAzimuthAngle: Number.POSITIVE_INFINITY,
  minDistance: 1,
  maxDistance: 7,
};

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const positionToOrbit = (
  position: [number, number, number],
  target: [number, number, number],
) => {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance === 0) return null;

  return {
    distance,
    polarAngle: Math.acos(clampValue(dy / distance, -1, 1)),
    azimuthAngle: Math.atan2(dx, dz),
  };
};

const orbitToPosition = (
  target: [number, number, number],
  distance: number,
  polarAngle: number,
  azimuthAngle: number,
): [number, number, number] => {
  const radius = Math.sin(polarAngle) * distance;

  return [
    target[0] + radius * Math.sin(azimuthAngle),
    target[1] + Math.cos(polarAngle) * distance,
    target[2] + radius * Math.cos(azimuthAngle),
  ];
};

const resolveOrbitSettings = (viewConfig?: CameraView) => ({
  ...DEFAULT_ORBIT_SETTINGS,
  ...viewConfig?.orbit,
});

const applyOrbitSettingsToControls = (
  controls: CameraControls,
  viewConfig?: CameraView | null,
) => {
  const orbitSettings = resolveOrbitSettings(viewConfig ?? undefined);
  controls.minPolarAngle = orbitSettings.minPolarAngle;
  controls.maxPolarAngle = orbitSettings.maxPolarAngle;
  controls.minAzimuthAngle = orbitSettings.minAzimuthAngle;
  controls.maxAzimuthAngle = orbitSettings.maxAzimuthAngle;
  controls.minDistance = orbitSettings.minDistance;
  controls.maxDistance = orbitSettings.maxDistance;
};

const resolveViewPose = (viewConfig?: CameraView) => {
  if (!viewConfig?.position || !viewConfig.target) return null;
  if (!viewConfig.orbit) {
    return {
      position: viewConfig.position,
      target: viewConfig.target,
    };
  }

  const orbit = resolveOrbitSettings(viewConfig);
  const baseOrbit = positionToOrbit(viewConfig.position, viewConfig.target);

  if (!baseOrbit) {
    return {
      position: viewConfig.position,
      target: viewConfig.target,
    };
  }

  const distance = clampValue(
    viewConfig.orbit.defaultDistance ?? baseOrbit.distance,
    orbit.minDistance,
    orbit.maxDistance,
  );
  const polarAngle = clampValue(
    viewConfig.orbit.defaultPolarAngle ?? baseOrbit.polarAngle,
    orbit.minPolarAngle,
    orbit.maxPolarAngle,
  );
  const azimuthAngle = clampValue(
    viewConfig.orbit.defaultAzimuthAngle ?? baseOrbit.azimuthAngle,
    orbit.minAzimuthAngle,
    orbit.maxAzimuthAngle,
  );

  return {
    position: orbitToPosition(
      viewConfig.target,
      distance,
      polarAngle,
      azimuthAngle,
    ),
    target: viewConfig.target,
  };
};

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
    defaultViewMode: "fixed",
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
  about: {
    id: "about",
    name: "About Me Room View",
    position: [0, CAMERA_HEIGHT + 2, HIDDEN_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION, 0.5],
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
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
    defaultViewMode: "object",
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
    defaultViewMode: "fixed",
  },
  upgrades: {
    id: "upgrades",
    name: "Upgrades View",
    defaultViewMode: "fixed",
  },
  portfolio: {
    id: "portfolio",
    name: "Portfolio Orbit View",
    position: [5, CAMERA_HEIGHT - 0.5, 73],
    target: [0, CAMERA_Y_POSITION - 0.5, 0],
    orbit: {
      minPolarAngle: 1.5725,
      maxPolarAngle: 1.5725,
      minDistance: 3,
      maxDistance: 67,
      defaultDistance: 67,
    },
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
    defaultViewMode: "fixed",
  },
  "minigames:slot_machine": {
    id: "minigames:slot_machine",
    name: "Slot Machine View",
    position: [0, CAMERA_HEIGHT + 1.1, HIDDEN_OPTIONS_CAMERA_ZOOM - 0.4],
    target: [0, CAMERA_Y_POSITION + 1.2, 0],
    defaultViewMode: "fixed",
    cursorFollow: {
      strength: 2.3,
      yScale: 0.4,
      swayX: 0.03,
      swayY: 0.02,
    },
  },
  "phone:home": {
    id: "phone:home",
    name: "Phone View",
    position: [0, CAMERA_HEIGHT, HIDDEN_OPTIONS_CAMERA_ZOOM],
    target: [0, CAMERA_Y_POSITION, 0],
    defaultViewMode: "fixed",
  },
  "phone:debug": {
    id: "phone:debug",
    name: "Debug View",
    defaultViewMode: "fixed",
  },
  "phone:quests": {
    id: "phone:quests",
    name: "Quests View",
    defaultViewMode: "fixed",
  },
  "phone:camera": {
    id: "phone:camera",
    name: "Camera View",
    position: [
      0,
      CAMERA_HEIGHT - 0.75,
      (HIDDEN_OPTIONS_CAMERA_ZOOM + VISIBLE_OPTIONS_CAMERA_ZOOM - 2) / 2,
    ],
    target: [0, CAMERA_Y_POSITION - 0.75, 0],
    orbit: {
      minPolarAngle: 0.85,
      maxPolarAngle: 2.15,
      minDistance: 2,
      maxDistance: 75,
    },
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "object",
  },
  desk: {
    id: "desk",
    name: "Desk View",
    position: [-2.5, 0.5, 1.5],
    target: [-3.5, 0, 1.5],
    transition: {
      duration: 800,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "object",
  },
  bookshelf: {
    id: "bookshelf",
    name: "Bookshelf View",
    position: [2, 1, -3],
    target: [2, 0, -4],
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
  pendingView: CameraViewId | null;
  runtimeViewModeOverride: ViewMode | null;
  runtimeCursorFollowOverride: boolean | null;
  runtimeOrbitOverrides: Partial<
    Pick<
      CameraOrbitSettings,
      | "minPolarAngle"
      | "maxPolarAngle"
      | "minAzimuthAngle"
      | "maxAzimuthAngle"
      | "minDistance"
      | "maxDistance"
    >
  >;

  cameraControlsRef: React.RefObject<CameraControls> | null;

  applyViewModeToControls: (mode: ViewMode) => void;

  setCurrentView: (viewId: CameraViewId) => void;
  setViewMode: (mode: ViewMode) => void;
  setRuntimeViewModeOverride: (mode: ViewMode | null) => void;
  setRuntimeCursorFollowOverride: (enabled: boolean | null) => void;
  setRuntimeOrbitOverrides: (
    overrides: Partial<
      Pick<
        CameraOrbitSettings,
        | "minPolarAngle"
        | "maxPolarAngle"
        | "minAzimuthAngle"
        | "maxAzimuthAngle"
        | "minDistance"
        | "maxDistance"
      >
    >,
  ) => void;
  resetRuntimeOrbitOverrides: () => void;
  setCameraControlsRef: (ref: React.RefObject<CameraControls>) => void;
  syncViewToRoute: (route: string) => void;
  transitionToView: (viewId: CameraViewId) => Promise<void>;
  transitionBack: () => Promise<void>;
  resetToDefaultView: () => Promise<void>;
  resetToPreviousView: () => Promise<void>;

  getCurrentViewConfig: () => CameraView | null;
  isDefaultView: () => boolean;
  isAboutView: () => boolean;
  isCreativeView: () => boolean;
  isPhoneView: () => boolean;
  isObjectView: () => boolean;
  isNavigationView: () => boolean;
  getAvailableViews: () => CameraView[];

  setDefaultViewMode: (mode: ViewMode) => void;
  setCameraEnabled: (enabled: boolean) => void;

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
      pendingView: null,
      runtimeViewModeOverride: null,
      runtimeCursorFollowOverride: null,
      runtimeOrbitOverrides: {},
      cameraControlsRef: null,
      lastFocusPosition: null,

      applyViewModeToControls: (mode: ViewMode) => {
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;
        const currentViewConfig = get().getCurrentViewConfig();
        const focusedImageTitle = get().focusedImageTitle;

        if (mode === "object") {
          const cameraPos = new Vector3();
          controls.getPosition(cameraPos); // current camera world position
          set({ lastFocusPosition: cameraPos.clone() }); // store for later restore

          const target = new Vector3();
          // freeze current orbit center as look-at point
          controls.getTarget(target);
          controls.setTarget(target.x, target.y, target.z, false);

          controls.mouseButtons.left = focusedImageTitle
            ? CameraControlsImpl.ACTION.TRUCK
            : CameraControlsImpl.ACTION.ROTATE;
          controls.mouseButtons.middle = CameraControlsImpl.ACTION.DOLLY;
          controls.mouseButtons.right = CameraControlsImpl.ACTION.TRUCK;
          controls.touches.one = focusedImageTitle
            ? CameraControlsImpl.ACTION.TOUCH_TRUCK
            : CameraControlsImpl.ACTION.TOUCH_ROTATE;
          controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY_TRUCK;
        } else {
          controls.mouseButtons.left = CameraControlsImpl.ACTION.NONE;
          controls.mouseButtons.middle = CameraControlsImpl.ACTION.NONE;
          controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
          controls.touches.one = CameraControlsImpl.ACTION.NONE;
          controls.touches.two = CameraControlsImpl.ACTION.NONE;
        }

        applyOrbitSettingsToControls(controls, currentViewConfig);
      },

      setDefaultViewMode: (mode: ViewMode) =>
        set({ defaultViewMode: mode, viewMode: mode, previousViewMode: mode }),

      setCurrentView: (viewId) => set({ currentView: viewId }),
      setViewMode: (mode) => {
        set({ viewMode: mode });
        get().applyViewModeToControls(mode);
      },
      setRuntimeViewModeOverride: (mode) => {
        const resolvedMode = mode ?? get().defaultViewMode;
        set({
          runtimeViewModeOverride: mode,
          viewMode: resolvedMode,
        });
        get().applyViewModeToControls(resolvedMode);
      },
      setRuntimeCursorFollowOverride: (enabled) =>
        set({ runtimeCursorFollowOverride: enabled }),
      setRuntimeOrbitOverrides: (overrides) => {
        set((state) => ({
          runtimeOrbitOverrides: {
            ...state.runtimeOrbitOverrides,
            ...overrides,
          },
        }));
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;
        applyOrbitSettingsToControls(controls, get().getCurrentViewConfig());
      },
      resetRuntimeOrbitOverrides: () => {
        set({ runtimeOrbitOverrides: {} });
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;
        applyOrbitSettingsToControls(controls, get().getCurrentViewConfig());
      },
      setCameraControlsRef: (ref) => {
        set({ cameraControlsRef: ref });
        if (!ref?.current) return;

        const pendingView = get().pendingView;
        if (pendingView) {
          get().transitionToView(pendingView);
          set({ pendingView: null });
          return;
        }

        const route =
          useAppStore.getState().currentRoute || window.location.pathname;
        if (route) {
          get().syncViewToRoute(route);
        }
      },
      syncViewToRoute: (route) => {
        const viewId = resolveRouteViewId(route);
        const viewConfig = CAMERA_VIEWS[viewId];
        if (!viewConfig) return;

        const desiredMode = viewConfig.defaultViewMode ?? "fixed";
        const { currentView, viewMode, cameraControlsRef, isTransitioning } =
          get();

        if (
          currentView === viewId &&
          viewMode === desiredMode &&
          !isTransitioning
        ) {
          get().applyViewModeToControls(desiredMode);

          const resolvedPose = resolveViewPose(viewConfig);
          if (resolvedPose && cameraControlsRef?.current) {
            cameraControlsRef.current.setLookAt(
              ...resolvedPose.position,
              ...resolvedPose.target,
              false,
            );
          }
          return;
        }

        if (isTransitioning || !cameraControlsRef?.current) {
          set({
            currentView: viewId,
            viewMode: desiredMode,
            defaultViewMode: desiredMode,
            previousViewMode: desiredMode,
            pendingView: viewId,
            runtimeViewModeOverride: null,
            runtimeCursorFollowOverride: null,
            runtimeOrbitOverrides: {},
          });
          return;
        }

        get().transitionToView(viewId);
      },

      transitionToView: async (nextView: CameraViewId) => {
        const { cameraControlsRef, isTransitioning } = get();

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
          defaultViewMode: viewConfig.defaultViewMode ?? state.defaultViewMode,
          runtimeViewModeOverride: null,
          runtimeCursorFollowOverride: null,
          runtimeOrbitOverrides: {},
          isImageFocused: false,
          focusedImageTitle: null,
          lastFocusPosition: null,
          pendingView: null,
        }));

        get().applyViewModeToControls(
          viewConfig.defaultViewMode ?? get().viewMode,
        );

        const finishTransition = () => {
          set({ isTransitioning: false });
          const pendingView = get().pendingView;
          if (pendingView && pendingView !== get().currentView) {
            set({ pendingView: null });
            get().transitionToView(pendingView);
          } else if (pendingView) {
            set({ pendingView: null });
          }
        };

        try {
          const controls = cameraControlsRef.current;
          const resolvedPose = resolveViewPose(viewConfig);

          if (resolvedPose) {
            controls.setLookAt(
              ...resolvedPose.position,
              ...resolvedPose.target,
              true,
            );
            setTimeout(() => finishTransition(), 0);
          } else {
            setTimeout(() => finishTransition(), 0);
          }
        } catch (error) {
          console.error("Camera transition failed:", error);
          setTimeout(() => finishTransition(), 0);
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
          cameraControlsRef,
          lastFocusPosition,
          isImageFocused,
        } = get();

        if (isTransitioning || !cameraControlsRef?.current) {
          return;
        }

        useCoreStore.getState().resetPreview();
        const appStore = useAppStore.getState();
        const currentRoute = appStore.currentRoute;

        // viewMode is set to fixed without transition
        // TODO: fix edge case when going from portfolio -> any other
        const targetView: CameraViewId = resolveRouteViewId(
          currentRoute ?? window.location.pathname,
        );

        const viewConfig = CAMERA_VIEWS[targetView];

        set({
          currentView: targetView,
          viewMode: viewConfig.defaultViewMode ?? "fixed",
          runtimeViewModeOverride: null,
          runtimeCursorFollowOverride: null,
          runtimeOrbitOverrides: {},
          isImageFocused: false,
          focusedImageTitle: null,
          isTransitioning: true,
        });

        get().applyViewModeToControls(
          viewConfig.defaultViewMode ?? get().viewMode,
        );

        try {
          const controls = cameraControlsRef.current;
          const resolvedPose = resolveViewPose(viewConfig);

          if (!viewConfig) {
            console.warn(`"${targetView}" view config missing`);
            return;
          }

          if (isImageFocused && lastFocusPosition && resolvedPose?.target) {
            controls.setLookAt(
              lastFocusPosition.x,
              lastFocusPosition.y,
              lastFocusPosition.z,
              ...resolvedPose.target,
              true,
            );
            setTimeout(() => set({ isTransitioning: false }), 0);
          } else if (resolvedPose) {
            controls.setLookAt(
              ...resolvedPose.position,
              ...resolvedPose.target,
              true,
            );
            setTimeout(() => set({ isTransitioning: false }), 0);
          } else {
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
        const {
          currentView,
          runtimeCursorFollowOverride,
          runtimeOrbitOverrides,
        } = get();
        const viewConfig = CAMERA_VIEWS[currentView];
        if (!viewConfig) return null;

        const mergedViewConfig = {
          ...viewConfig,
          orbit: {
            ...viewConfig.orbit,
            ...runtimeOrbitOverrides,
          },
        };
        if (runtimeCursorFollowOverride === null) return mergedViewConfig;

        return {
          ...mergedViewConfig,
          cursorFollow: runtimeCursorFollowOverride
            ? (viewConfig.cursorFollow ?? {})
            : undefined,
        };
      },

      isDefaultView: () => {
        return get().currentView === "default";
      },
      isAboutView: () => {
        return get().currentView === "about";
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
      setCameraEnabled: (enabled: boolean) => {
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;
        controls.enabled = enabled;
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
