import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CameraControls } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import {
  CAMERA_Y_POSITION,
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
  HEAD_CAMERA_POSES,
  BOB_CAMERA_POSE,
  LOADING_CAMERA_POSE,
  PHOTO_CAMERA_POSE,
} from "@/store/config/camera";
import { ROUTE_PATHS } from "./config/routes";
import { useAppStore } from "./core/app";
import { useCoreStore } from "./core/store";
import { connectNavigationMenu } from "./core/navigationMenuController";
import { useMiniGameStore } from "@/store/minigames";
import { Vector3 } from "three";
import { getSelectedBlobForm, getBlobFormType, getBlobFormHalfSize, getBobGroundOffset } from "@/types/blobForms";
import { useBobEditor } from "./bobEditor";
import { getBobEditorFraming } from "./config/bobEditorFraming";
import { getPhotoCameraFraming } from "./config/photoCameraFraming";

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
  | "loading"
  | "upgrades"
  | "about"
  | "portfolio"
  | "minigames"
  | "minigames:slot_machine"
  | "navigation"
  | "phone:home"
  | "phone:bob"
  | "shop:preview"
  | "phone:debug"
  | "phone:quests"
  | "phone:options"
  | "phone:camera"
  | "phone:photo"
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
  if (viewConfig?.id === "phone:photo") {
    const state = useCoreStore.getState();
    const selected = getSelectedBlobForm(state.blobForms);
    return getPhotoCameraFraming(window.innerWidth, window.innerHeight,
      state.graphicPreferences.fisheyeEnabled,
      getBobGroundOffset(getBlobFormType(selected.id), selected.parameters));
  }
  if (viewConfig?.id === "loading") {
    const selected = getSelectedBlobForm(useCoreStore.getState().blobForms);
    const form = getBlobFormType(selected.id);
    const halfSize = getBlobFormHalfSize(form, selected.parameters);
    const y = getBobGroundOffset(form, selected.parameters);
    const distance = Math.max(LOADING_CAMERA_POSE.position[2], Math.max(...halfSize) * 4);
    const height = y + LOADING_CAMERA_POSE.position[1];
    const slope = (LOADING_CAMERA_POSE.position[1] - LOADING_CAMERA_POSE.target[1]) / LOADING_CAMERA_POSE.position[2];
    return {
      position: [0, height, distance] as [number, number, number],
      target: [0, height - distance * slope, 0] as [number, number, number],
    };
  }
  if (viewConfig?.id === "phone:bob") {
    const mobile = window.innerWidth <= 1000 || window.innerHeight <= 600;
    const selected = getSelectedBlobForm(useCoreStore.getState().blobForms);
    return getBobEditorFraming(window.innerWidth, window.innerHeight, mobile, useCoreStore.getState().graphicPreferences.fisheyeEnabled, null, getBlobFormHalfSize(getBlobFormType(selected.id), selected.parameters));
  }
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
  loading: {
    id: "loading",
    name: "Loading View",
    ...LOADING_CAMERA_POSE,
    orbit: { minDistance: 0.1, maxDistance: 1000 },
    defaultViewMode: "fixed",
  },
  default: {
    id: "default",
    name: "Default View",
    ...HEAD_CAMERA_POSES.default,
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "fixed",
  },
  navigation: {
    id: "navigation",
    name: "Navigation/Menu View",
    ...HEAD_CAMERA_POSES.navigation,
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
  "phone:bob": {
    id: "phone:bob",
    name: "Bob View",
    ...BOB_CAMERA_POSE,
    transition: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
    defaultViewMode: "fixed",
  },
  "shop:preview": {
    id: "shop:preview",
    name: "Shop Preview",
    ...BOB_CAMERA_POSE,
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
      minPolarAngle: 1.57,
      maxPolarAngle: 1.58,
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
  "phone:photo": {
    id: "phone:photo",
    name: "Photo Camera View",
    ...PHOTO_CAMERA_POSE,
    orbit: {
      minPolarAngle: 0.35,
      maxPolarAngle: 2.15,
      minDistance: 2,
      maxDistance: 75,
    },
    defaultViewMode: "object",
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
  loadingCameraActive: boolean;
  loadingCameraView: "default" | "loading";
  beginLoadingCamera: (animate?: boolean, options?: { initial?: boolean }) => Promise<void>;
  holdLoadingCamera: () => void;
  finishLoadingCamera: (route: string) => void;

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

let loadingCameraSettings: { controls: CameraControls; smoothTime: number } | null = null;

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
      loadingCameraActive: false,
      loadingCameraView: "loading",
      lastFocusPosition: null,

      beginLoadingCamera: async (animate = true, { initial = false } = {}) => {
        if (get().loadingCameraActive) return;
        const controls = get().cameraControlsRef?.current;
        if (controls) loadingCameraSettings = { controls, smoothTime: controls.smoothTime };
        const loadingCameraView = initial ? "default" : "loading";
        set({
          loadingCameraActive: true, loadingCameraView, currentView: loadingCameraView, viewMode: "fixed",
          isTransitioning: false, pendingView: null,
          runtimeViewModeOverride: null, runtimeCursorFollowOverride: null,
          runtimeOrbitOverrides: {}, isImageFocused: false, focusedImageTitle: null,
        });
        useBobEditor.setState({ screenOffset: { x: 0, y: 0 } });
        if (!controls) return;
        controls.cancel();
        if (!initial) controls.smoothTime = 0.12;
        get().applyViewModeToControls("fixed");
        controls.setFocalOffset(0, 0, 0, animate);
        const pose = resolveViewPose(CAMERA_VIEWS[loadingCameraView])!;
        const ready = controls.setLookAt(...pose.position, ...pose.target, animate);
        if (!animate) controls.update(0);
        await ready;
      },
      holdLoadingCamera: () => {
        if (!get().loadingCameraActive || get().loadingCameraView === "default") return;
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;
        get().applyViewModeToControls("fixed");
        controls.setFocalOffset(0, 0, 0, false);
        const pose = resolveViewPose(CAMERA_VIEWS[get().loadingCameraView])!;
        controls.setLookAt(...pose.position, ...pose.target, false);
        controls.update(0);
      },
      finishLoadingCamera: (route) => {
        if (!get().loadingCameraActive) return;
        const initial = get().loadingCameraView === "default";
        const destination = resolveRouteViewId(route);
        if (loadingCameraSettings) loadingCameraSettings.controls.smoothTime = loadingCameraSettings.smoothTime;
        loadingCameraSettings = null;
        set({ loadingCameraActive: false, loadingCameraView: "loading", isTransitioning: false, pendingView: null });
        // Initial follow is already running at the default view. Reapplying its
        // neutral pose here would interrupt the cursor target on the last frame.
        if (!initial || get().currentView !== destination) void get().transitionToView(destination);
      },

      applyViewModeToControls: (mode: ViewMode) => {
        const controls = get().cameraControlsRef?.current;
        if (!controls) return;
        const currentViewConfig = get().getCurrentViewConfig();
        const focusedImageTitle = get().focusedImageTitle;

        if (mode === "object" && get().currentView !== "phone:bob") {
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
          controls.mouseButtons.wheel = CameraControlsImpl.ACTION.DOLLY;
          controls.touches.one = focusedImageTitle
            ? CameraControlsImpl.ACTION.TOUCH_TRUCK
            : CameraControlsImpl.ACTION.TOUCH_ROTATE;
          controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY_TRUCK;
        } else {
          controls.mouseButtons.left = CameraControlsImpl.ACTION.NONE;
          controls.mouseButtons.middle = CameraControlsImpl.ACTION.NONE;
          controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
          controls.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
          controls.touches.one = CameraControlsImpl.ACTION.NONE;
          controls.touches.two = CameraControlsImpl.ACTION.NONE;
        }

        applyOrbitSettingsToControls(controls, currentViewConfig);
      },

      setDefaultViewMode: (mode: ViewMode) =>
        set({ defaultViewMode: mode, viewMode: mode, previousViewMode: mode }),

      setCurrentView: (viewId) => get().loadingCameraActive ? set({ pendingView: viewId }) : set({ currentView: viewId }),
      setViewMode: (mode) => {
        if (get().loadingCameraActive) return;
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

        const route =
          useAppStore.getState().currentRoute || window.location.pathname;
        if (route) {
          get().syncViewToRoute(route);
          set({ pendingView: null });
        }
      },
      syncViewToRoute: (route) => {
        const viewId = resolveRouteViewId(route);
        if (get().loadingCameraActive) { set({ pendingView: viewId }); return; }
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
        if (get().loadingCameraActive) { set({ pendingView: nextView }); return; }
        const { cameraControlsRef, isTransitioning } = get();

        // Keep the latest requested view when a panel changes during a zoom.
        if (isTransitioning) {
          set({ pendingView: nextView });
          return;
        }
        if (!cameraControlsRef?.current) return;

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
          if (get().loadingCameraActive) return;
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
            applyOrbitSettingsToControls(
              controls,
              get().getCurrentViewConfig(),
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
        if (get().loadingCameraActive) return;
        const {
          isTransitioning,
          cameraControlsRef,
          lastFocusPosition,
          isImageFocused,
        } = get();

        if (isTransitioning) {
          set({ pendingView: resolveRouteViewId(useAppStore.getState().currentRoute) });
          return;
        }
        if (!cameraControlsRef?.current) return;

        useCoreStore.getState().resetPreview();
        const appStore = useAppStore.getState();
        const currentRoute = appStore.currentRoute;

        // viewMode is set to fixed without transition
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
        if (get().loadingCameraActive) return;
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

// Explicit view changes dismiss the menu. A menu-only close holds its camera
// pose until the exit finishes, so zooming back cannot enlarge fading buttons.
const disconnectNavigationMenu = connectNavigationMenu(useAppStore, useViewStore);
if (import.meta.hot) import.meta.hot.dispose(disconnectNavigationMenu);
