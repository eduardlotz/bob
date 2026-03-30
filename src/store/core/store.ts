import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "../indexedDB";
import { match } from "ts-pattern";
import { ROUTE_PATHS, ROUTE_IDS, ROUTE_CONFIG } from "../config/routes";

import {
  setCurrentTapSound as engineSetCurrentTapSound,
  setMasterVolume as engineSetMasterVolume,
  setTypeVolume as engineSetTypeVolume,
  setTapEnabled as engineSetTapEnabled,
  setWorldEnabled as engineSetWorldEnabled,
  enable as engineEnable,
  disable as engineDisable,
} from "@/utils/soundSystem";
import { resolveTapSoundForEffect } from "@/utils/sound/configs";
import { THEME_IDS, THEME_CONFIG } from "../config/themes";
import { initialTapUpgrades } from "@/shop-items/upgrades";
import { initialTapEffects } from "@/shop-items/tapEffects";
import {
  calculateAutoTapRate,
  calculateTapMultiplier,
  calculateUpgradeCost,
} from "@/shop-items/upgradeMath";
import {
  BlobFormConfig,
  INITIAL_BLOB_FORMS,
  DEFAULT_FORM_PARAMETERS,
} from "@/types/blobForms";
import { initialWeatherEffects } from "@/shop-items/weatherEffects";
import { initialBobItems } from "@/shop-items/bobItems";
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_TAP_VOLUME,
  DEFAULT_TEXT_VOLUME,
  DEFAULT_UI_VOLUME,
  DEFAULT_WORLD_VOLUME,
} from "@/utils/sound/defaults";
import { initialWorlds } from "@/shop-items/worlds";
import { migrateCoreStore } from "./migrations";
import { OrbitForm } from "@/components/FileOrbit";

const ONE_SECOND_MS = 1000;
const AUTO_TAP_INTERVAL_MS = 1000;

export enum GAME_STORE_VERSION {
  V0 = 0,
  V1 = 1000000, // version 1.00.00
  V2 = 1000001, // version 1.00.01
  V3 = 1000002, // version 1.00.02
  V4 = 1000003, // version 1.00.04

  V5 = 100100, // version 1.01.100
  V6 = 100101, // version 1.01.101
  V7 = 100102, // version 1.01.102
  LATEST = V7,
}

// TODO: plan refactor to include component inside item properties
interface BaseItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  cost: number;
  purchased: boolean;
  enabled: boolean;
  unlocked?: boolean;
  preview?: boolean;
}

export interface WeatherEffect extends BaseItem {}

export type ShopItem = WorldItem | TapEffect | BobItem | WeatherEffect;

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  level: number;
  maxLevel: number;
  effect: {
    type: "autoTap" | "tapMultiplier";
    value: number;
  };
  unlocked: boolean;
}

export interface TapEffect extends BaseItem {
  soundId?: string;
  effectId?: number;
}

export type WorldModelId =
  | "default_home"
  | "forest_grove"
  | "forest_meadow"
  | "desert_dunes"
  | "desert_pyramids"
  | "winter_pines"
  | "winter_snowman"
  | "moon_craters"
  | "space_planet"
  | "space_rings";

export type WorldEffectId =
  | "default_grid"
  | "forest_clouds"
  | "forest_fireflies"
  | "forest_rain"
  | "desert_sand"
  | "winter_snow"
  | "winter_sparkles"
  | "moon_glow"
  | "moon_meteors"
  | "space_stars"
  | "space_nebula"
  | "space_dust";

export interface WorldLightingConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  moonGlowIntensity?: number;
  spaceGlowIntensity?: number;
}

export const DEFAULT_WORLD_LIGHTING: WorldLightingConfig = {
  ambientIntensity: 2,
  directionalIntensity: 1.2,
};

export const WEAKER_WORLD_LIGHTING: WorldLightingConfig = {
  ambientIntensity: 1.82,
  directionalIntensity: 1.08,
};

export interface WorldSceneConfig {
  skyColors: [string, string];
  gradientStops: [number, number, number];
  gradientColors: [string, string, string];
  groundColor: string;
  accentColor: string;
  models: WorldModelId[];
  effects: WorldEffectId[];
  starfield?: boolean;
  lighting?: WorldLightingConfig;
}

export interface WorldItem extends BaseItem {
  type: "world";
  icon?: string;
  scene: WorldSceneConfig;
}

export interface DebugCameraSettings {
  truckSpeed: number;
  azimuthRotateSpeed: number;
}

export interface DebugLightSettings {
  ambientIntensityMultiplier: number;
  directionalIntensityMultiplier: number;
  lightAngle: number;
  lightColor: string;
}

export const DEFAULT_DEBUG_CAMERA_SETTINGS: DebugCameraSettings = {
  truckSpeed: 5,
  azimuthRotateSpeed: 0.3,
};

export const DEFAULT_DEBUG_LIGHT_SETTINGS: DebugLightSettings = {
  ambientIntensityMultiplier: 1,
  directionalIntensityMultiplier: 1,
  lightAngle: 0,
  lightColor: "#ffffff",
};

// Bob item types (for wearable items like hats)
export interface BobItem extends BaseItem {
  type: "hat" | "accessory" | "outfit" | "decoration";
  icon: string;
  category: "bob";
  detached?: boolean; // If true, item stays at initial position and doesn't follow head movements
}

const ITEM_NAME_MAP = {
  hat: "Kopf",
  accessory: "Gesicht",
  outfit: "Outfit",
  world: "Welt",
  tapEffect: "Effekt",
  decoration: "Extra",
};

export const getShopItemType = (itemType: keyof typeof ITEM_NAME_MAP) => {
  return ITEM_NAME_MAP[itemType];
};

export interface Theme {
  id: string;
  name: string;
  description: string;
  active: boolean;
  preview: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border?: string;
    cardBackground?: string;
    success?: string;
    danger?: string;
    warning?: string;
  };
  planetColors: string[];
  counterColor: string;
  blobColor: string;
  outlineColor: string;
  eyeColor: string;
  chatColor: string;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  unlocked: boolean;
  isLocked?: boolean; // TODO: replace multiple status props with a single status
  path: string;
  icon: string;
  category: "pages";
}

export interface SoundSystemState {
  enabled: boolean;
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;
  uiVolume: number;
  textVolume: number;
  tapEnabled?: boolean;
  worldEnabled?: boolean;
}

type PreviewMode = "theme" | BobItem["type"] | "tapEffect" | "world";

type QualityMode = "auto" | "low" | "high";

interface GameState {
  version: number;

  taps: number;
  lifetimeTotalTaps: number;
  tapMultiplier: number;
  lastAutoTapTime: number;

  upgrades: Upgrade[];
  worlds: WorldItem[];
  bobItems: BobItem[];
  blobForms: BlobFormConfig[];
  themes: Theme[];
  currentTheme: Theme | null;

  routes: Route[];
  tapEffects: TapEffect[];
  weatherEffects: WeatherEffect[];

  fisheyeIntensity: number;

  soundSystem: SoundSystemState;
  soundPreferences?: {
    enabled: boolean;
    muted: boolean;
  };

  graphicPreferences: {
    qualityMode: QualityMode; // TODO: seperate selected, suggested
    effectsEnabled: boolean;
  };

  audioSelections: {
    worldMusicId: string;
    tapEffectId: string;
    worldSoundIds?: string[];
    tapEffectAudioId?: string; // optional override for selected tap effect
  };

  selectedOrbitForm: OrbitForm;
  debugCameraSettings: DebugCameraSettings;
  debugLightSettings: DebugLightSettings;
}

interface GameCache {
  _cachedTapsPerSecond?: number;
  _cachedTapMultiplier?: number;
  _lastUpgradeHash?: string;
}

interface GameComputed {
  manualTaps: number;
  manualTapsPerSecond: number;
  tapsPerSecond: number;
  autoTapRate: number;
  recentManualTaps: number[];
}

interface GameFlags {
  previewMode: PreviewMode | null;
  customCameraControlsEnabled: boolean;
  animationsEnabled: boolean;
  statisticsVisible: boolean;
  physicsDebugEnabled: boolean;
  viewDebuggerVisible: boolean;
  cameraSettingsOverlayVisible: boolean;
  lightSettingsOverlayVisible: boolean;
  isPaused: boolean;
  isHydrated: boolean;
  isReady: boolean;
  cookiesAccepted: boolean;
}

interface GameStateActions {
  addTaps: (amount: number) => void;

  equipBobItem: (bobItemId: string) => void;
  unequipBobItem: (bobItemId: string) => void;

  selectBlobForm: (blobFormId: string) => void;
  updateBlobFormParameters: (
    blobFormId: string,
    parameters: Partial<import("@/types/blobForms").BlobFormParameters>,
  ) => void;
  resetBlobFormParameters: (blobFormId: string) => void;

  purchaseUpgrade: (upgradeId: string) => void;
  purchaseWorld: (worldId: string) => void;
  purchaseBobItem: (bobItemId: string, forFree?: boolean) => void;
  purchaseRoute: (routeId: string, forFree?: boolean) => void;
  purchaseBlobForm: (blobFormId: string) => void;
  purchaseTapEffect: (effectId: string) => void;

  activateTheme: (themeId: string) => void;
  selectTapEffect: (tapEffectId: string) => void;
  selectWorld: (worldId: string) => void;
  toggleWeatherEffect: (effectId: string) => void;
  resetGame: () => void;

  buyAllUpgrades: () => void;

  setSoundEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setTapVolume: (volume: number) => void;
  setWorldVolume: (volume: number) => void;
  setUIVolume: (volume: number) => void;
  setTextVolume: (volume: number) => void;

  setGraphicsMode: (mode: QualityMode) => void;
  toggleParticleEffects: () => void;
  acceptCookies: () => void;

  setWorldMusicId: (id: string) => void;
  setTapEffectId: (id: string) => void;
  setTapEnabled: (enabled: boolean) => void;
  setWorldEnabled: (enabled: boolean) => void;
  setWorldSoundIds?: (ids: string[]) => void;
  toggleWorldSoundId?: (id: string) => void;
  setTapEffectAudioId?: (id?: string) => void;
  setOrbitForm: (form: OrbitForm) => void;
  updateDebugCameraSettings: (updates: Partial<DebugCameraSettings>) => void;
  resetDebugCameraSettings: () => void;
  updateDebugLightSettings: (updates: Partial<DebugLightSettings>) => void;
  resetDebugLightSettings: () => void;
}

interface GameCacheActions {
  getTotalTapsPerSecond: () => number;
  getTotalTapMultiplier: () => number;
  getAutoTapRate: () => number;
  updateComputedValueCache: () => void;
}

interface GameComputedActions {
  addAutoTaps: (amount: number) => void;
  addManualTap: () => void;
  cleanupManualTaps: () => void;

  getAutoTapRateUncached: () => number;
  getTotalTapMultiplierUncached: () => number;

  canAfford: (cost: number) => boolean;
  calculateOfflineTaps: () => number;
  checkUnlockedRoutes: (routePath: string) => boolean;
}

interface GameFlagsActions {
  previewBobItem: (bobItemId: string) => void;
  previewWorld: (worldId: string) => void;
  previewTapEffect: (effectId: string) => void;
  previewTheme: (themeId: string) => void;
  resetPreview: () => void;

  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameReady: (v: boolean) => void;

  toggleCustomCameraControls: () => void;
  toggleAnimations: () => void;
  toggleStatistics: () => void;
  togglePhysicsDebug: () => void;
  toggleViewDebugger: () => void;
  toggleCameraSettingsOverlay: () => void;
  toggleLightSettingsOverlay: () => void;
}

export type PersistedGameStore = GameState & GameFlags;
export type PersistedGameStoreActions = GameStateActions & GameFlagsActions;
export type RuntimeGameStore = GameCache & GameComputed;
export type RuntimeGameStoreActions = GameCacheActions & GameComputedActions;

export type GameStore = PersistedGameStore &
  PersistedGameStoreActions &
  RuntimeGameStore &
  RuntimeGameStoreActions;

export const initialThemes: Theme[] = Object.values(THEME_CONFIG).map(
  (themeConfig) => ({
    id: themeConfig.id,
    name: themeConfig.name,
    description: themeConfig.description,
    cost: themeConfig.id === THEME_IDS.DEFAULT ? 0 : 50,
    active: themeConfig.id === THEME_IDS.DEFAULT,
    preview: themeConfig.preview,
    colors: themeConfig.colors,
    planetColors: themeConfig.planetColors,
    counterColor: themeConfig.counterColor,
    blobColor: themeConfig.blobColor,
    outlineColor: themeConfig.outlineColor,
    eyeColor: themeConfig.eyeColor,
    chatColor: themeConfig.chatColor,
  }),
);

export const initialRoutes: Route[] = [
  {
    id: ROUTE_IDS.HOME,
    name: ROUTE_CONFIG[ROUTE_PATHS.HOME].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.HOME].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.HOME].cost,
    purchased: true,
    unlocked: true,
    path: ROUTE_PATHS.HOME,
    icon: ROUTE_CONFIG[ROUTE_PATHS.HOME].icon,
    isLocked: false,
    category: "pages",
  },
  {
    id: ROUTE_IDS.ABOUT,
    name: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].cost,
    purchased: false,
    unlocked: false,
    path: ROUTE_PATHS.ABOUT,
    icon: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].icon,
    isLocked: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].isLocked,
    category: "pages",
  },
  {
    id: ROUTE_IDS.PORTFOLIO,
    name: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].cost,
    purchased: false,
    unlocked: false,
    path: ROUTE_PATHS.PORTFOLIO,
    icon: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].icon,
    isLocked: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].isLocked,
    category: "pages",
  },
  {
    id: ROUTE_IDS.TECHNICAL,
    name: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].cost,
    purchased: false,
    unlocked: false,
    path: ROUTE_PATHS.TECHNICAL,
    icon: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].icon,
    isLocked: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].isLocked,
    category: "pages",
  },
  {
    id: ROUTE_IDS.CREATIVE,
    name: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].cost,
    purchased: false,
    unlocked: false,
    path: ROUTE_PATHS.CREATIVE,
    icon: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].icon,
    isLocked: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].isLocked,
    category: "pages",
  },
  {
    id: ROUTE_IDS.GUESTBOOK,
    name: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].cost,
    purchased: false,
    unlocked: false,
    path: ROUTE_PATHS.GUESTBOOK,
    icon: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].icon,
    isLocked: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].isLocked,
    category: "pages",
  },
  {
    id: ROUTE_IDS.MINIGAMES,
    name: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].name,
    description: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].description,
    cost: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].cost,
    purchased: false,
    unlocked: false,
    path: ROUTE_PATHS.MINIGAMES,
    icon: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].icon,
    isLocked: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].isLocked,
    category: "pages",
  },
];

const generateUpgradeHash = (upgrades: Upgrade[]): string => {
  return JSON.stringify(upgrades.map((u) => ({ id: u.id, level: u.level })));
};

const activateWorlds = (worlds: WorldItem[], activeWorldId: string) =>
  worlds.map((world) => ({
    ...world,
    enabled: world.id === activeWorldId,
    preview: false,
  }));

export const initialGameState: GameState = {
  version: GAME_STORE_VERSION.LATEST,

  taps: 0,
  lifetimeTotalTaps: 0,
  tapMultiplier: 1,
  lastAutoTapTime: 0,

  upgrades: initialTapUpgrades,
  worlds: initialWorlds,
  bobItems: initialBobItems,
  tapEffects: initialTapEffects,
  weatherEffects: initialWeatherEffects,
  blobForms: INITIAL_BLOB_FORMS,
  themes: initialThemes,
  currentTheme: initialThemes[0],
  routes: initialRoutes,

  fisheyeIntensity: 0,
  soundSystem: {
    enabled: true,
    masterVolume: DEFAULT_MASTER_VOLUME,
    tapVolume: DEFAULT_TAP_VOLUME,
    worldVolume: DEFAULT_WORLD_VOLUME,
    uiVolume: DEFAULT_UI_VOLUME,
    textVolume: DEFAULT_TEXT_VOLUME,
    tapEnabled: true,
    worldEnabled: true,
  },
  soundPreferences: { enabled: true, muted: false },
  graphicPreferences: {
    qualityMode: "auto",
    effectsEnabled: true,
  },
  audioSelections: {
    worldMusicId: "world-jazz",
    tapEffectId: "tap_effect_default",
    worldSoundIds: [],
    tapEffectAudioId: undefined,
  },
  selectedOrbitForm: "EQUATORIAL_RING",
  debugCameraSettings: DEFAULT_DEBUG_CAMERA_SETTINGS,
  debugLightSettings: DEFAULT_DEBUG_LIGHT_SETTINGS,
};

const initialGameFlags: GameFlags = {
  previewMode: null,
  customCameraControlsEnabled: false,
  animationsEnabled: true,
  statisticsVisible: false,
  physicsDebugEnabled: false,
  viewDebuggerVisible: false,
  cameraSettingsOverlayVisible: false,
  lightSettingsOverlayVisible: false,
  isPaused: false,
  isHydrated: false,
  isReady: false,
  cookiesAccepted: false,
};

const initialGameComputedValues: GameComputed = {
  manualTaps: 0,
  manualTapsPerSecond: 0,
  tapsPerSecond: 0,
  autoTapRate: 0,
  recentManualTaps: [],
};

const partializePersisted = (state: GameStore): PersistedGameStore => ({
  version: state.version,
  taps: state.taps,
  lifetimeTotalTaps: state.lifetimeTotalTaps,
  tapMultiplier: state.tapMultiplier,
  lastAutoTapTime: state.lastAutoTapTime,
  upgrades: state.upgrades,
  worlds: state.worlds,
  bobItems: state.bobItems,
  blobForms: state.blobForms,
  themes: state.themes,
  currentTheme: state.currentTheme,
  routes: state.routes,
  tapEffects: state.tapEffects,
  weatherEffects: state.weatherEffects,
  fisheyeIntensity: state.fisheyeIntensity,
  soundSystem: state.soundSystem,
  soundPreferences: state.soundPreferences,
  audioSelections: state.audioSelections,
  debugCameraSettings: state.debugCameraSettings,
  debugLightSettings: state.debugLightSettings,
  isPaused: state.isPaused,
  isHydrated: false, // reset on reload
  isReady: false, // reset on reload
  customCameraControlsEnabled: state.customCameraControlsEnabled,
  animationsEnabled: state.animationsEnabled,
  statisticsVisible: state.statisticsVisible,
  physicsDebugEnabled: state.physicsDebugEnabled,
  viewDebuggerVisible: state.viewDebuggerVisible,
  cameraSettingsOverlayVisible: state.cameraSettingsOverlayVisible,
  lightSettingsOverlayVisible: state.lightSettingsOverlayVisible,
  previewMode: null, // reset on reload
  graphicPreferences: state.graphicPreferences,
  // selectedOrbitForm: state.selectedOrbitForm,
  selectedOrbitForm: "EQUATORIAL_RING", // TODO: add configs with minMax angles/zooms for other forms or delete select option altogether
  cookiesAccepted: state.cookiesAccepted,
});

// TODO: split storeCreate into groups for better readability
export const useCoreStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialGameState,
        ...initialGameFlags,
        ...initialGameComputedValues,
        setOrbitForm: (form) => set({ selectedOrbitForm: form }),
        updateDebugCameraSettings: (updates) =>
          set((state) => ({
            ...state,
            debugCameraSettings: {
              ...state.debugCameraSettings,
              ...updates,
            },
          })),
        resetDebugCameraSettings: () =>
          set((state) => ({
            ...state,
            debugCameraSettings: DEFAULT_DEBUG_CAMERA_SETTINGS,
          })),
        updateDebugLightSettings: (updates) =>
          set((state) => ({
            ...state,
            debugLightSettings: {
              ...state.debugLightSettings,
              ...updates,
            },
          })),
        resetDebugLightSettings: () =>
          set((state) => ({
            ...state,
            debugLightSettings: DEFAULT_DEBUG_LIGHT_SETTINGS,
          })),

        setGameReady: (gameReady) => set({ isReady: gameReady }),

        addTaps: (amount: number) => {
          set((state) => ({
            taps: state.taps + amount,
            lifetimeTotalTaps: state.lifetimeTotalTaps + amount,
          }));
        },

        addAutoTaps: (amount: number) => {
          set((state) => ({
            taps: state.taps + amount,
            lifetimeTotalTaps:
              state.lifetimeTotalTaps + amount,
            lastAutoTapTime: Date.now(),
          }));
        },
        addManualTap: () => {
          set((state) => ({
            taps: state.taps + 1 * state.getTotalTapMultiplier(),
            manualTaps: state.manualTaps + 1,
            lifetimeTotalTaps:
              state.lifetimeTotalTaps + 1 * state.getTotalTapMultiplier(),
          }));
        },

        cleanupManualTaps: () => {
          set((state) => {
            const now = Date.now();
            const recentTaps = state.recentManualTaps || [];
            const oneSecondAgo = now - ONE_SECOND_MS;

            if (recentTaps.length === 0) {
              return state;
            }

            const filteredTaps: number[] = [];
            for (let i = recentTaps.length - 1; i >= 0; i--) {
              if (recentTaps[i] > oneSecondAgo) {
                filteredTaps.unshift(recentTaps[i]);
              }
            }

            if (filteredTaps.length === recentTaps.length) {
              return state;
            }

            return {
              ...state,
              manualTapsPerSecond: filteredTaps.length,
              recentManualTaps: filteredTaps,
            };
          });
        },

        purchaseUpgrade: (upgradeId: string) => {
          set((state) => {
            const upgrade = state.upgrades.find((u) => u.id === upgradeId);
            const cost = upgrade ? calculateUpgradeCost(upgrade) : 0;

            if (
              !upgrade ||
              upgrade.level >= upgrade.maxLevel ||
              !state.canAfford(cost)
            ) {
              return state;
            }

            let updatedUpgrades = state.upgrades.map((u) =>
              u.id === upgradeId ? { ...u, level: u.level + 1 } : u,
            );

            return {
              ...state,
              taps: state.taps - cost,
              upgrades: updatedUpgrades,
              _cachedTapsPerSecond: undefined,
              _cachedTapMultiplier: undefined,
              _lastUpgradeHash: undefined,
            };
          });

          // update cache after state change
          setTimeout(() => {
            get().updateComputedValueCache();
          }, 0);
        },
        purchaseTapEffect: (effectId: string) => {
          set((state) => {
            const effect = state.tapEffects.find((t) => t.id === effectId);
            if (!effect || !state.canAfford(effect.cost)) {
              return state;
            }

            let updatedTapEffects = state.tapEffects.map((t) =>
              t.id === effectId
                ? { ...t, purchased: true, enabled: true }
                : { ...t, enabled: false },
            );

            return {
              ...state,
              taps: state.taps - effect.cost,
              tapEffects: updatedTapEffects,
              // _cachedTapsPerSecond: undefined,
              // _cachedTapMultiplier: undefined,
              // _lastUpgradeHash: undefined,
            };
          });

          // update cache after state change
          // setTimeout(() => {
          //   get().updateComputedValueCache();
          // }, 0);
        },

        previewTapEffect: (effectId: string) => {
          set((state) => {
            const effect = state.tapEffects.find((t) => t.id === effectId);
            if (!effect) {
              return state;
            }

            let updatedTapEffects = state.tapEffects.map((t) => ({
              ...t,
              preview: t.id === effectId,
            }));

            return {
              ...state,
              tapEffects: updatedTapEffects,
              previewMode: "tapEffect",
            };
          });
        },

        purchaseWorld: (worldId: string) => {
          set((state) => {
            const world = state.worlds.find((entry) => entry.id === worldId);
            if (!world || world.purchased || !state.canAfford(world.cost)) {
              return state;
            }

            const updatedWorlds = activateWorlds(
              state.worlds.map((entry) =>
                entry.id === worldId
                  ? { ...entry, purchased: true }
                  : { ...entry, preview: false },
              ),
              worldId,
            );

            return {
              ...state,
              taps: state.taps - world.cost,
              worlds: updatedWorlds,
              previewMode: null,
            };
          });
        },
        previewWorld: (worldId: string) => {
          set((state) => {
            const world = state.worlds.find((entry) => entry.id === worldId);
            if (!world) {
              return state;
            }

            const updatedWorlds = state.worlds.map((entry) => ({
              ...entry,
              preview: entry.id === worldId,
            }));

            return {
              ...state,
              worlds: updatedWorlds,
              previewMode: "world",
            };
          });
        },

        selectWorld: (worldId: string) => {
          set((state) => {
            const world = state.worlds.find((entry) => entry.id === worldId);
            if (!world || !world.purchased || world.enabled) {
              return state;
            }

            return {
              ...state,
              worlds: activateWorlds(state.worlds, worldId),
              previewMode: null,
            };
          });
        },

        purchaseBobItem: (bobItemId: string, forFree?: boolean) => {
          set((state) => {
            const bobItem = state.bobItems.find((b) => b.id === bobItemId);
            if (
              !bobItem ||
              bobItem.purchased ||
              (!state.canAfford(bobItem.cost) && !forFree)
            ) {
              return state;
            }

            const updatedBobItems = state.bobItems.map((b) =>
              b.id === bobItemId
                ? {
                    ...b,
                    purchased: true,
                    enabled: true,
                    unlocked: true,
                  }
                : {
                    ...b,
                    enabled:
                      b.type === bobItem.type ? b.id === bobItemId : b.enabled,
                  },
            );

            return {
              ...state,
              taps: forFree ? state.taps : state.taps - bobItem.cost,
              bobItems: updatedBobItems,
            };
          });
        },

        equipBobItem: (bobItemId: string) => {
          set((state) => {
            const bobItem = state.bobItems.find((b) => b.id === bobItemId);
            if (!bobItem || !bobItem.purchased) {
              return state;
            }

            // unequip all items of the same type, then equip the selected one
            const updatedBobItems = state.bobItems.map((b) => ({
              ...b,
              enabled: b.type === bobItem.type ? b.id === bobItemId : b.enabled,
            }));

            return {
              ...state,
              bobItems: updatedBobItems,
              preview: false,
            };
          });
        },
        previewBobItem: (bobItemId: string) => {
          set((state) => {
            const bobItem = state.bobItems.find((b) => b.id === bobItemId);
            if (!bobItem) {
              return state;
            }

            // unequip all items of the same type, then equip the selected one
            const updatedBobItems = state.bobItems.map((b) => ({
              ...b,
              preview: b.type === bobItem.type ? b.id === bobItemId : b.preview,
            }));

            return {
              ...state,
              bobItems: updatedBobItems,
              previewMode: bobItem.type,
            };
          });
        },

        unequipBobItem: (bobItemId: string) => {
          set((state) => {
            const bobItem = state.bobItems.find((b) => b.id === bobItemId);
            if (!bobItem || !bobItem.purchased) {
              return state;
            }

            // unequip all items of the same type
            const updatedBobItems = state.bobItems.map((b) => ({
              ...b,
              enabled: b.id === bobItem.id ? false : b.enabled,
            }));

            return {
              ...state,
              bobItems: updatedBobItems,
              preview: true,
            };
          });
        },

        purchaseBlobForm: (blobFormId: string) => {
          set((state) => {
            const blobForm = state.blobForms.find((f) => f.id === blobFormId);
            if (
              !blobForm ||
              blobForm.unlocked ||
              !state.canAfford(blobForm.cost)
            ) {
              return state;
            }

            const updatedBlobForms = state.blobForms.map((f) =>
              f.id === blobFormId ? { ...f, unlocked: true } : f,
            );

            return {
              ...state,
              taps: state.taps - blobForm.cost,
              blobForms: updatedBlobForms,
            };
          });
        },

        selectBlobForm: (blobFormId: string) => {
          set((state) => {
            const blobForm = state.blobForms.find((f) => f.id === blobFormId);
            if (!blobForm || !blobForm.unlocked) {
              return state;
            }

            // deselect all blob forms and select the chosen one
            const updatedBlobForms = state.blobForms.map((f) => ({
              ...f,
              selected: f.id === blobFormId,
            }));

            return {
              ...state,
              blobForms: updatedBlobForms,
            };
          });
        },

        updateBlobFormParameters: (
          blobFormId: string,
          parameters: Partial<import("@/types/blobForms").BlobFormParameters>,
        ) => {
          set((state) => {
            const updatedBlobForms = state.blobForms.map((f) =>
              f.id === blobFormId
                ? { ...f, parameters: { ...f.parameters, ...parameters } }
                : f,
            );

            return {
              ...state,
              blobForms: updatedBlobForms,
            };
          });
        },

        resetBlobFormParameters: (blobFormId: string) => {
          set((state) => {
            const formType =
              blobFormId as import("@/types/blobForms").BlobFormType;
            const defaultParameters = DEFAULT_FORM_PARAMETERS[formType];

            const updatedBlobForms = state.blobForms.map((f) =>
              f.id === blobFormId
                ? { ...f, parameters: { ...defaultParameters } }
                : f,
            );

            return {
              ...state,
              blobForms: updatedBlobForms,
            };
          });
        },

        purchaseRoute: (routeId: string, forFree = false) => {
          set((state) => {
            const route = state.routes.find((r) => r.id === routeId);

            return match({
              route,
              canAfford: route ? state.canAfford(route.cost) : false,
              forFree,
            })
              .with({ forFree: true }, () => {
                const updatedRoutes = state.routes.map((r) =>
                  r.id === routeId
                    ? { ...r, purchased: true, unlocked: true }
                    : r,
                );

                return {
                  ...state,
                  routes: updatedRoutes,
                };
              })
              .with(
                { route: { purchased: false }, canAfford: true },
                ({ route }) => {
                  const updatedRoutes = state.routes.map((r) =>
                    r.id === routeId
                      ? { ...r, purchased: true, unlocked: true }
                      : r,
                  );

                  return {
                    ...state,
                    taps: state.taps - route.cost,
                    routes: updatedRoutes,
                  };
                },
              )
              .otherwise(() => state);
          });
        },

        checkUnlockedRoutes: (routePath: string) => {
          const routes = get().routes;
          return routes.some(
            (route) =>
              route.path === routePath &&
              route.unlocked &&
              route.purchased &&
              !route.isLocked,
          );
        },

        activateTheme: (themeId: string) => {
          set((state) => {
            const theme = state.themes.find((t) => t.id === themeId);
            if (!theme) {
              return state;
            }

            const updatedThemes = state.themes.map((t) => ({
              ...t,
              active: t.id === themeId,
            }));

            return {
              ...state,
              themes: updatedThemes,
              currentTheme: theme,
            };
          });
        },
        previewTheme: (themeId: string) => {
          set((state) => {
            const theme = state.themes.find((t) => t.id === themeId);
            if (!theme) {
              return state;
            }

            const updatedThemes = state.themes.map((t) => ({
              ...t,
              preview: t.id === themeId,
            }));

            return {
              ...state,
              themes: updatedThemes,
              previewMode: "theme",
            };
          });
        },
        resetPreview: () => {
          set((state) => {
            const themes = state.themes.map((t) => ({
              ...t,
              preview: false,
            }));

            const bobItems = state.bobItems.map((b) => ({
              ...b,
              preview: false,
            }));

            const tapEffects = state.tapEffects.map((t) => ({
              ...t,
              preview: false,
            }));

            const worlds = state.worlds.map((world) => ({
              ...world,
              preview: false,
            }));

            return {
              ...state,
              themes,
              bobItems,
              tapEffects,
              worlds,
              previewMode: null,
            };
          });
        },

        selectTapEffect: (tapEffectId: string) => {
          set((state) => {
            const effect = state.tapEffects.find((e) => e.id === tapEffectId);
            if (!effect || !effect.purchased) {
              return state;
            }

            const updatedEffects = state.tapEffects.map((e) =>
              e.id === tapEffectId
                ? { ...e, enabled: !e.enabled }
                : { ...e, enabled: false },
            );

            // TODO: fix individual tap sounds
            // try {
            //   const overrideId = get().audioSelections.tapEffectAudioId;
            //   const cfg = resolveTapSoundForEffect(upgradeId, overrideId);
            //   if (cfg && cfg.id) {
            //     if (cfg.filePath)
            //       engineSetCurrentTapSound(cfg.id, cfg.filePath);
            //     else engineSetCurrentTapSound(cfg.id);
            //   }
            // } catch (e) {
            //   console.error("Error setting current tap sound", e);
            //   toast.error("Error setting current tap sound");
            // }

            return {
              ...state,
              tapEffects: updatedEffects,
            };
          });
        },

        toggleWeatherEffect: (effectId: string) => {
          set((state) => {
            const effect = state.weatherEffects.find((w) => w.id === effectId);
            if (!effect || !effect.purchased) {
              return state;
            }

            const updatedWeatherEffects = state.weatherEffects.map((w) =>
              w.id === effectId ? { ...w, enabled: !w.enabled } : w,
            );

            return {
              ...state,
              weatherEffects: updatedWeatherEffects,
            };
          });
        },

        resetGame: () => {
          set({
            ...initialGameState,
            ...initialGameFlags,
            ...initialGameComputedValues,
            _cachedTapsPerSecond: undefined,
            _cachedTapMultiplier: undefined,
            _lastUpgradeHash: undefined,
          });
        },

        pauseGame: () => {
          set((state) => ({
            ...state,
            isPaused: true,
          }));
        },

        resumeGame: () => {
          set((state) => ({
            ...state,
            isPaused: false,
          }));
        },

        acceptCookies: () => {
          set((state) => ({
            ...state,
            cookiesAccepted: true,
          }));
        },

        toggleParticleEffects: () => {
          set((state) => ({
            ...state,
            graphicPreferences: {
              ...state.graphicPreferences,
              effectsEnabled: !state.graphicPreferences.effectsEnabled,
            },
          }));
        },
        setGraphicsMode: (mode) => {
          set((state) => ({
            ...state,
            graphicPreferences: {
              ...state.graphicPreferences,
              qualityMode: mode,
            },
          }));
        },

        // Dev Actions
        toggleCustomCameraControls: () => {
          set((state) => ({
            ...state,
            customCameraControlsEnabled: !state.customCameraControlsEnabled,
          }));
        },

        buyAllUpgrades: () => {
          set((state) => {
            const activeWorldId =
              state.worlds.find((world) => world.enabled)?.id ??
              initialWorlds[0]?.id;

            const updatedUpgrades = state.upgrades.map((upgrade) => ({
              ...upgrade,
              unlocked: true,
              level: upgrade.maxLevel,
            }));

            const updatedWorlds = state.worlds.map((world) => ({
              ...world,
              purchased: true,
              enabled: world.id === activeWorldId,
              unlocked: true,
              preview: false,
            }));

            const updatedRoutes = state.routes.map((route) => ({
              ...route,
              purchased: true,
              unlocked: true,
            }));

            const updatedBobItems = state.bobItems.map((bobItem) => ({
              ...bobItem,
              purchased: true,
              unlocked: true,
            }));

            const updatedTapEffects = state.tapEffects.map((eff) => ({
              ...eff,
              unlocked: true,
              purchased: true,
            }));

            const updatedBlobForms = state.blobForms.map((blobForm) => ({
              ...blobForm,
              unlocked: true,
            }));

            return {
              ...state,
              upgrades: updatedUpgrades,
              worlds: updatedWorlds,
              tapEffects: updatedTapEffects,
              routes: updatedRoutes,
              bobItems: updatedBobItems,
              blobForms: updatedBlobForms,
              _cachedTapsPerSecond: undefined,
              _cachedTapMultiplier: undefined,
              _lastUpgradeHash: undefined,
            };
          });
        },

        toggleAnimations: () => {
          set((state) => ({
            ...state,
            animationsEnabled: !state.animationsEnabled,
          }));
        },

        toggleStatistics: () => {
          set((state) => ({
            ...state,
            statisticsVisible: !state.statisticsVisible,
          }));
        },
        togglePhysicsDebug: () => {
          set((state) => ({
            ...state,
            physicsDebugEnabled: !state.physicsDebugEnabled,
          }));
        },
        toggleViewDebugger: () => {
          set((state) => ({
            ...state,
            viewDebuggerVisible: !state.viewDebuggerVisible,
          }));
        },
        toggleCameraSettingsOverlay: () => {
          set((state) => ({
            ...state,
            cameraSettingsOverlayVisible: !state.cameraSettingsOverlayVisible,
          }));
        },
        toggleLightSettingsOverlay: () => {
          set((state) => ({
            ...state,
            lightSettingsOverlayVisible: !state.lightSettingsOverlayVisible,
          }));
        },

        // Sound system actions
        setSoundEnabled: (enabled: boolean) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              enabled,
            },
          }));
        },

        setMasterVolume: (volume: number) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              masterVolume: Math.max(0, Math.min(1, volume)),
            },
          }));
        },

        setTapVolume: (volume: number) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              tapVolume: Math.max(0, Math.min(1, volume)),
            },
          }));
        },

        setWorldVolume: (volume: number) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              worldVolume: Math.max(0, Math.min(1, volume)),
            },
          }));
        },

        setUIVolume: (volume: number) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              uiVolume: Math.max(0, Math.min(1, volume)),
            },
          }));
        },

        setTextVolume: (volume: number) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              textVolume: Math.max(0, Math.min(1, volume)),
            },
          }));
        },

        setWorldMusicId: (id: string) => {
          // Deprecated: Primary/secondary handling removed; keep method no-op to avoid runtime errors
          set((state) => ({
            ...state,
            audioSelections: {
              ...state.audioSelections,
              worldMusicId: id,
            },
          }));
        },
        setTapEffectId: (id: string) => {
          set((state) => ({
            ...state,
            audioSelections: {
              ...state.audioSelections,
              tapEffectId: id,
            },
          }));
          // runtime: also resolve and apply audio for the selected tap effect
          try {
            const s = useCoreStore.getState();
            const cfg = resolveTapSoundForEffect(
              id,
              s.audioSelections.tapEffectAudioId,
            );
            if (cfg && cfg.id) {
              if (cfg.filePath) engineSetCurrentTapSound(cfg.id, cfg.filePath);
              else engineSetCurrentTapSound(cfg.id);
            }
          } catch {}
        },
        // Replace or toggle in a set of world sound ids (for layered ambience)
        setWorldSoundIds: (ids: string[]) => {
          set((state) => ({
            ...state,
            audioSelections: {
              ...state.audioSelections,
              worldSoundIds: Array.isArray(ids)
                ? ids
                : state.audioSelections.worldSoundIds,
            },
          }));
        },
        toggleWorldSoundId: (id: string) => {
          set((state) => {
            const current = state.audioSelections.worldSoundIds || [];
            const next = current.includes(id)
              ? current.filter((x) => x !== id)
              : [...current, id];
            return {
              ...state,
              audioSelections: {
                ...state.audioSelections,
                worldSoundIds: next,
              },
            };
          });
        },
        setTapEffectAudioId: (id?: string) => {
          set((state) => ({
            ...state,
            audioSelections: {
              ...state.audioSelections,
              tapEffectAudioId: id,
            },
          }));
        },
        setTapEnabled: (enabled: boolean) => {
          try {
            engineSetTapEnabled(enabled);
          } catch {}
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              tapEnabled: enabled,
            },
          }));
        },
        setWorldEnabled: (enabled: boolean) => {
          try {
            engineSetWorldEnabled(enabled);
          } catch {}
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              worldEnabled: enabled,
            },
          }));
        },
        // Computed values with caching
        getTotalTapsPerSecond: () => {
          const state = get();
          const upgradeHash = generateUpgradeHash(state.upgrades);

          if (
            state._lastUpgradeHash === upgradeHash &&
            state._cachedTapsPerSecond !== undefined
          ) {
            return state._cachedTapsPerSecond;
          }

          const result = calculateAutoTapRate(state.upgrades);

          set((s) => ({
            ...s,
            _cachedTapsPerSecond: result,
            _lastUpgradeHash: upgradeHash,
          }));

          return result;
        },

        getTotalTapMultiplier: () => {
          const state = get();
          const upgradeHash = generateUpgradeHash(state.upgrades);

          if (
            state._lastUpgradeHash === upgradeHash &&
            state._cachedTapMultiplier !== undefined
          ) {
            return state._cachedTapMultiplier;
          }

          const result = calculateTapMultiplier(state.upgrades);

          set((s) => ({
            ...s,
            _cachedTapMultiplier: result,
            _lastUpgradeHash: upgradeHash,
          }));

          return result;
        },

        getAutoTapRate: () => {
          const state = get();
          return calculateAutoTapRate(state.upgrades);
        },

        // TODO: check where the diff between cached and uncached is -> delete
        getAutoTapRateUncached: () => {
          const state = get();
          return calculateAutoTapRate(state.upgrades);
        },

        getTotalTapMultiplierUncached: () => {
          const state = get();
          return calculateTapMultiplier(state.upgrades);
        },

        updateComputedValueCache: () => {
          const state = get();
          const upgradeHash = generateUpgradeHash(state.upgrades);

          if (state._lastUpgradeHash === upgradeHash) {
            return;
          }

          const tapsPerSecond = calculateAutoTapRate(state.upgrades);
          const tapMultiplier = calculateTapMultiplier(state.upgrades);

          set((s) => ({
            ...s,
            _cachedTapsPerSecond: tapsPerSecond,
            _cachedTapMultiplier: tapMultiplier,
            _lastUpgradeHash: upgradeHash,
          }));
        },

        calculateOfflineTaps: () => {
          const state = get();
          const now = Date.now();
          const timeSinceLastTap = now - state.lastAutoTapTime;
          const secondsSinceLastTap = timeSinceLastTap / 1000;

          const tapsPerSecond = state.getTotalTapsPerSecond();
          const tapMultiplier = state.getTotalTapMultiplier();
          const baseOfflineTaps = Math.floor(
            tapsPerSecond * secondsSinceLastTap,
          );
          const offlineTaps = Math.floor(baseOfflineTaps * tapMultiplier);

          return offlineTaps;
        },

        canAfford: (cost: number) => {
          return get().taps >= cost;
        },
      }),
      {
        name: "game-store",
        version: GAME_STORE_VERSION.LATEST,
        storage: createIndexedDBStorage<GameStore>(),
        migrate: migrateCoreStore,
        partialize: (state) => partializePersisted(state) as GameStore,
        onRehydrateStorage: () => (state?: GameStore) => {
          if (!state) return;

          state.isHydrated = true;
          state.isReady = false;

          state._cachedTapsPerSecond = state._cachedTapsPerSecond;
          state._cachedTapMultiplier = state._cachedTapMultiplier;
          state._lastUpgradeHash = state._lastUpgradeHash;
          state.lifetimeTotalTaps = state.lifetimeTotalTaps ?? state.taps ?? 0;

          state.manualTaps = state.manualTaps;
          state.manualTapsPerSecond = 0;
          state.tapsPerSecond = state.getTotalTapsPerSecond();
          state.autoTapRate = state.getAutoTapRate();
          state.tapMultiplier = state.getTotalTapMultiplier();
          state.recentManualTaps = [];

          state.updateComputedValueCache?.();

          const sys = state.soundSystem;

          engineSetMasterVolume(sys.masterVolume);
          engineSetTypeVolume("tap", sys.tapVolume);
          engineSetTypeVolume("world", sys.worldVolume);
          engineSetTypeVolume("ui", sys.uiVolume);
          engineSetTypeVolume("text", (sys as any).textVolume ?? 1);

          if (sys.enabled) {
            engineEnable();
          } else {
            engineDisable();
          }
        },
      },
    ),
    {
      name: "game-store",
    },
  ),
);
