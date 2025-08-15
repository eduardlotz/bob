import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "./indexedDB";
import { match } from "ts-pattern";
import { ROUTE_PATHS, ROUTE_IDS, ROUTE_CONFIG } from "./routeConfig";
import { toast } from "sonner";
import {
  setMasterVolume as engineSetMasterVolume,
  setCurrentTapSound as engineSetCurrentTapSound,
  setTapEnabled as engineSetTapEnabled,
  setWorldEnabled as engineSetWorldEnabled,
  setWorldMusic as engineSetWorldMusic,
} from "@/utils/soundSystem";
import { resolveTapSoundForEffect } from "@/utils/sound/configs";
import { getWorldSoundById } from "@/utils/sound/configs";
import { THEME_IDS, THEME_CONFIG } from "./themeConfig";
import { initialUpgrades } from "@/shop-items/upgrades";

export enum GAME_STORE_VERSIONS {
  V1 = 1,
  V2 = 2,
  V3 = 3,
  V4 = 4,
  V5 = 5,
  V6 = 6,
  V7 = 7,
  V8 = 8,
  V9 = 9,
  V10 = 10,
  V11 = 11,
  V12 = 12,
  V13 = 13,
  V14 = 14,
  V15 = 15,
  V16 = 16,
  V17 = 17,
  V18 = 18,
  V19 = 19,
  LATEST = V19,
}

// Constants
const ONE_SECOND_MS = 1000;
const AUTO_TAP_INTERVAL_MS = 1000;
const MAX_PARTICLES_PER_AUTO_TAP = 5;
const PARTICLE_STAGGER_MS = 100;

const PURGE_DATE = new Date("08/15/2025"); // utility to purge states created before this date

// main migration function
function migrateStore(oldState: any, version: GAME_STORE_VERSIONS): any {
  console.log(
    `Migration triggered: oldState version=${oldState.version}, migration version=${version}`
  );
  let migratedState = { ...oldState };

  // Handle case where version field is missing (old saves)
  let currentVersion = oldState.version || 1;

  // Helper function to safely check and transform arrays
  const safeArrayTransform = <T>(
    array: T[] | undefined,
    transform: (item: T, index: number) => T
  ): T[] | undefined => {
    if (!Array.isArray(array)) return array;
    return array.map(transform);
  };

  // Helper function to merge route objects while preserving existing fields
  const mergeRoute = (existingRoute: any, initialRoute: any): any => {
    if (!existingRoute) return initialRoute;
    return {
      ...initialRoute,
      ...existingRoute,
      // Preserve specific fields from existing route unless explicitly overridden
      unlocked: existingRoute.unlocked ?? initialRoute.unlocked,
      purchased: existingRoute.purchased ?? initialRoute.purchased,
    };
  };

  // Migration V1 → V2: Update theme and effect prices
  if (currentVersion < GAME_STORE_VERSIONS.V2) {
    // Update theme prices in a single pass
    migratedState.themes = safeArrayTransform(
      migratedState.themes,
      (theme: any) => {
        if (!theme || typeof theme !== "object") return theme;

        const themeUpdates: Record<string, number> = {
          [THEME_IDS.DARK]: 1000,
          [THEME_IDS.PASTEL]: 2000,
          [THEME_IDS.NEON]: 3000,
        };

        return themeUpdates[theme.id] !== undefined
          ? { ...theme, cost: themeUpdates[theme.id] }
          : theme;
      }
    );

    // Update effect prices in a single pass
    migratedState.upgrades = safeArrayTransform(
      migratedState.upgrades,
      (upgrade: any) => {
        if (!upgrade || typeof upgrade !== "object") return upgrade;

        const effectUpdates: Record<string, number> = {
          tap_effect_confetti: 1500,
          tap_effect_hearts: 2500,
          tap_effect_stars: 3500,
        };

        return effectUpdates[upgrade.id] !== undefined
          ? { ...upgrade, baseCost: effectUpdates[upgrade.id] }
          : upgrade;
      }
    );

    currentVersion = GAME_STORE_VERSIONS.V2;
  }

  // Migration V2 → V3: Fix tap multiplier upgrade levels
  if (currentVersion < GAME_STORE_VERSIONS.V3) {
    migratedState.upgrades = safeArrayTransform(
      migratedState.upgrades,
      (upgrade: any) => {
        if (!upgrade || typeof upgrade !== "object") return upgrade;

        if (
          upgrade.effect?.type === "tapMultiplier" &&
          upgrade.unlocked &&
          upgrade.level > 0
        ) {
          return { ...upgrade, level: 0 };
        }
        return upgrade;
      }
    );

    currentVersion = GAME_STORE_VERSIONS.V3;
  }

  // Migration V3 → V4: Lock "Tap Power" upgrade by default
  if (currentVersion < GAME_STORE_VERSIONS.V4) {
    migratedState.upgrades = safeArrayTransform(
      migratedState.upgrades,
      (upgrade: any) => {
        if (!upgrade || typeof upgrade !== "object") return upgrade;

        if (upgrade.id === "tap_multiplier_1") {
          return { ...upgrade, unlocked: false, level: 0 };
        }
        return upgrade;
      }
    );

    currentVersion = GAME_STORE_VERSIONS.V4;
  }

  // Migration V4 → V5: Ensure routes are properly initialized and persisted
  if (currentVersion < GAME_STORE_VERSIONS.V5) {
    if (!Array.isArray(migratedState.routes)) {
      migratedState.routes = initialRoutes;
    } else {
      // Merge existing routes with initial routes, preserving all existing fields
      const existingRoutes = migratedState.routes;
      migratedState.routes = initialRoutes.map((initialRoute) => {
        const existingRoute = existingRoutes.find(
          (r: any) => r && typeof r === "object" && r.id === initialRoute.id
        );
        return mergeRoute(existingRoute, initialRoute);
      });
    }

    // Initialize lastAutoTapTime if missing
    if (typeof migratedState.lastAutoTapTime !== "number") {
      migratedState.lastAutoTapTime = Date.now();
    }

    currentVersion = GAME_STORE_VERSIONS.V5;
  }

  // Migration V5 → V6: Ensure themes are properly initialized
  if (
    currentVersion < GAME_STORE_VERSIONS.V6 ||
    !migratedState.lastSchemaUpdate ||
    migratedState.lastSchemaUpdate < new Date("2025-08-10")
  ) {
    if (!Array.isArray(migratedState.themes)) {
      migratedState.themes = initialThemes;
    }

    currentVersion = GAME_STORE_VERSIONS.V6;
  }

  // Migration V6 → V7: Add outlineColor and eyeColor to themes
  if (currentVersion < GAME_STORE_VERSIONS.V7) {
    console.log(
      `Migrating from V${currentVersion} to V7: Adding outlineColor and eyeColor to themes`
    );

    migratedState.themes = safeArrayTransform(
      migratedState.themes,
      (theme: any) => {
        if (!theme || typeof theme !== "object") return theme;

        // Check if theme already has the new properties (skip if already migrated)
        if (theme.outlineColor && theme.eyeColor) {
          console.log(
            `Theme ${theme.id} already has outlineColor and eyeColor, skipping`
          );
          return theme;
        }

        // Get the corresponding theme config to get the new colors
        const themeConfig = Object.values(THEME_CONFIG).find(
          (config) => config.id === theme.id
        );

        if (themeConfig) {
          console.log(
            `Migrating theme ${theme.id}: adding outlineColor=${themeConfig.outlineColor}, eyeColor=${themeConfig.eyeColor}`
          );
          return {
            ...theme,
            outlineColor: themeConfig.outlineColor,
            eyeColor: themeConfig.eyeColor,
          };
        }

        // Fallback colors if theme config not found
        console.log(`Migrating theme ${theme.id}: using fallback colors`);
        return {
          ...theme,
          outlineColor: "#000000",
          eyeColor: "#000000",
        };
      }
    );

    currentVersion = GAME_STORE_VERSIONS.V7;
  }

  // Migration V7 → V8: Replace all themes with current configuration
  if (currentVersion < GAME_STORE_VERSIONS.V8) {
    console.log(
      `Migrating from V${currentVersion} to V8: Replacing all themes with current configuration`
    );

    // Get the current active theme ID to preserve it
    const currentThemeId = migratedState.currentTheme?.id || THEME_IDS.DEFAULT;

    // Replace all themes with the current configuration from THEME_CONFIG
    migratedState.themes = Object.values(THEME_CONFIG).map((themeConfig) => ({
      ...themeConfig,
      purchased:
        migratedState.themes?.find((t: any) => t.id === themeConfig.id)
          ?.purchased || false,
      active: themeConfig.id === currentThemeId,
    }));

    // Update current theme reference
    migratedState.currentTheme =
      migratedState.themes.find((t: any) => t.id === currentThemeId) ||
      migratedState.themes[0];

    console.log(
      `V8 Migration: Replaced ${migratedState.themes.length} themes with current configuration`
    );
    console.log(`V8 Migration: Preserved active theme: ${currentThemeId}`);

    currentVersion = GAME_STORE_VERSIONS.V8;
  }

  // Migration V8 → V9: Add lastSchemaUpdate property for manual migration triggers
  if (currentVersion < GAME_STORE_VERSIONS.V9) {
    console.log(
      `Migrating from V${currentVersion} to V9: Adding lastSchemaUpdate property`
    );

    // Set the lastSchemaUpdate to the current date
    migratedState.lastSchemaUpdate = new Date();

    console.log(
      `V9 Migration: Set lastSchemaUpdate to ${migratedState.lastSchemaUpdate}`
    );

    currentVersion = GAME_STORE_VERSIONS.V9;
  }

  // Migration V9 → V10: Ensure soundSystem preferences exist and default to 1.0
  if (currentVersion < GAME_STORE_VERSIONS.V10) {
    const clamp01 = (v: any) => {
      const n = typeof v === "number" ? v : 1;
      return Math.max(0, Math.min(1, n));
    };
    const sound = migratedState.soundSystem || {};
    migratedState.soundSystem = {
      enabled: sound.enabled !== false,
      // Default master to 0 so app starts muted
      masterVolume: clamp01(sound.masterVolume ?? 0),
      tapVolume: clamp01(sound.tapVolume ?? 1),
      worldVolume: clamp01(sound.worldVolume ?? 1),
      uiVolume: clamp01(sound.uiVolume ?? 1),
      tapEnabled: sound.tapEnabled !== false,
      worldEnabled: sound.worldEnabled !== false,
    };
    currentVersion = GAME_STORE_VERSIONS.V10;
  }

  // Migration V10 → V11: Initialize audio selections (ids only)
  if (currentVersion < GAME_STORE_VERSIONS.V11) {
    migratedState.audioSelections = {
      worldMusicId: migratedState.audioSelections?.worldMusicId || "world-lofi",
      tapEffectId:
        migratedState.audioSelections?.tapEffectId || "tap_effect_default",
    };
    currentVersion = GAME_STORE_VERSIONS.V11;
  }

  // Migration V11 → V12: Add audio selections for multi world sounds and tap effect audio id
  if (currentVersion < GAME_STORE_VERSIONS.V12) {
    const now = new Date();
    migratedState.audioSelections = {
      ...(migratedState.audioSelections || {}),
      worldMusicId: migratedState.audioSelections?.worldMusicId || "world-lofi",
      // Multi-select list for layered world sounds; default to only world-lofi
      worldSoundIds:
        Array.isArray(migratedState.audioSelections?.worldSoundIds) &&
        migratedState.audioSelections.worldSoundIds.length > 0
          ? migratedState.audioSelections.worldSoundIds
          : ["world-lofi"],
      // Tap effect audio per selected effect id; default undefined -> use default tap
      tapEffectAudioId:
        migratedState.audioSelections?.tapEffectAudioId || undefined,
    };
    migratedState.lastSchemaUpdate = now;
    currentVersion = GAME_STORE_VERSIONS.V12;
  }

  // Migration V12 → V13: Start with no layered world sounds selected by default
  if (currentVersion < GAME_STORE_VERSIONS.V13) {
    migratedState.audioSelections = {
      ...(migratedState.audioSelections || {}),
      // Avoid auto-playing any world sounds until user unmutes and selects
      worldSoundIds: Array.isArray(migratedState.audioSelections?.worldSoundIds)
        ? migratedState.audioSelections.worldSoundIds
        : [],
    };
    currentVersion = GAME_STORE_VERSIONS.V13;
  }

  // Migration V13 → V14: Introduce textVolume and reduce worldVolume by 0.1
  if (currentVersion < GAME_STORE_VERSIONS.V14) {
    const clamp01 = (v: any) => {
      const n = typeof v === "number" ? v : 1;
      return Math.max(0, Math.min(1, n));
    };
    const sound = migratedState.soundSystem || {};
    const newWorld = clamp01((sound.worldVolume ?? 1) - 0.1);
    migratedState.soundSystem = {
      enabled: sound.enabled !== false,
      masterVolume: clamp01(sound.masterVolume ?? 0),
      tapVolume: clamp01(sound.tapVolume ?? 1),
      worldVolume: newWorld,
      uiVolume: clamp01(sound.uiVolume ?? 1),
      tapEnabled: sound.tapEnabled !== false,
      worldEnabled: sound.worldEnabled !== false,
      textVolume: clamp01(sound.textVolume ?? 0.8),
    };
    currentVersion = GAME_STORE_VERSIONS.V14;
  }

  // Migration V14 → V15: Introduce soundPreferences (enabled/muted) and stop persisting per-type volumes
  if (currentVersion < GAME_STORE_VERSIONS.V15) {
    const sound = migratedState.soundSystem || {};
    migratedState.soundPreferences = {
      enabled: sound.enabled !== false,
      muted: (sound.masterVolume ?? 0) === 0,
    };
    currentVersion = GAME_STORE_VERSIONS.V15;
  }

  // Migration Vx → V16: reset entire store
  if (currentVersion < GAME_STORE_VERSIONS.V16) {
    currentVersion = GAME_STORE_VERSIONS.V16;
  }

  // Migration V16 → V17: decorations in shop
  if (currentVersion < GAME_STORE_VERSIONS.V17) {
    migratedState.decorations = initialDecorations;

    migratedState.soundSystem = { ...migratedState.soundSystem, textVolume: 1 };
    migratedState.upgrades = initialUpgrades;

    currentVersion = GAME_STORE_VERSIONS.V17;
  }

  if (currentVersion < GAME_STORE_VERSIONS.V18) {
    migratedState.themes = initialThemes;

    currentVersion = GAME_STORE_VERSIONS.V18;
  }

  if (currentVersion < GAME_STORE_VERSIONS.V19) {
    migratedState.upgrades = initialUpgrades;

    currentVersion = GAME_STORE_VERSIONS.V19;
  }

  // Set the final version to the latest
  migratedState.version = GAME_STORE_VERSIONS.LATEST;

  return migratedState;
}

// Upgrade types
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  level: number;
  maxLevel: number;
  effect: {
    type:
      | "autoTap"
      | "tapMultiplier"
      | "decoration"
      | "theme"
      | "tapEffect"
      | "environment";
    value: number;
  };
  unlocked: boolean;
  icon: string;
  category: "upgrades" | "effects" | "environment" | "tapEffects";
  selected?: boolean; // For tap effects and environment effects that can be toggled
}

// Decoration types
export interface Decoration {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  enabled: boolean;
  type: "2d" | "3d";
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
  icon: string;
}

// Theme types
export interface Theme {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  active: boolean;
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
}

// Route types

export interface Route {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  unlocked: boolean;
  isLocked?: boolean; // for routes that are not available yet
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

// Game state interface
interface GameStore {
  // Store version for migrations
  version: number;
  lastSchemaUpdate: Date; // Timestamp for manual migration triggers

  // Core game state
  taps: number;
  manualTaps: number;
  manualTapsPerSecond: number;
  tapsPerSecond: number;
  tapMultiplier: number;
  autoTapRate: number;
  isPaused: boolean;
  recentManualTaps: number[];
  lastAutoTapTime: number;

  // Cached computed values for performance
  _cachedTapsPerSecond?: number;
  _cachedTapMultiplier?: number;
  _lastUpgradeHash?: string;

  // shop
  upgrades: Upgrade[];
  decorations: Decoration[];
  themes: Theme[];
  currentTheme: Theme | null;
  routes: Route[];

  // from previous version, might come back
  fisheyeIntensity: number;

  // dev state
  animationsEnabled: boolean;
  statisticsVisible: boolean;

  // sound system
  soundSystem: SoundSystemState;
  soundPreferences?: {
    enabled: boolean;
    muted: boolean;
  };
  audioSelections: {
    worldMusicId: string;
    tapEffectId: string;
    worldSoundIds?: string[];
    tapEffectAudioId?: string; // optional override for selected tap effect
  };

  // Actions
  addTaps: (amount: number) => void;
  addAutoTaps: (amount: number) => void;
  addManualTap: () => void;
  cleanupManualTaps: () => void;
  purchaseUpgrade: (upgradeId: string) => void;
  purchaseDecoration: (decorationId: string) => void;
  purchaseTheme: (themeId: string) => void;
  purchaseRoute: (routeId: string, force?: boolean) => void;
  checkRouteUnlocks: () => void;
  activateTheme: (themeId: string) => void;
  toggleDecoration: (decorationId: string) => void;
  selectTapEffect: (upgradeId: string) => void;
  toggleEnvironmentEffect: (upgradeId: string) => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Dev Actions
  addDevTaps: (amount: number) => void;
  buyAllUpgrades: () => void;
  toggleAnimations: () => void;
  toggleStatistics: () => void;

  // Sound system actions
  setSoundEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setTapVolume: (volume: number) => void;
  setWorldVolume: (volume: number) => void;
  setUIVolume: (volume: number) => void;
  setTextVolume: (volume: number) => void;

  // Audio selection actions
  setWorldMusicId: (id: string) => void;
  setTapEffectId: (id: string) => void;
  setTapEnabled: (enabled: boolean) => void;
  setWorldEnabled: (enabled: boolean) => void;
  setWorldSoundIds?: (ids: string[]) => void;
  toggleWorldSoundId?: (id: string) => void;
  setTapEffectAudioId?: (id?: string) => void;

  // Computed values
  getTotalTapsPerSecond: () => number;
  getTotalTapMultiplier: () => number;
  getAutoTapRate: () => number;
  // Non-caching versions for use during render
  getAutoTapRateUncached: () => number;
  getTotalTapMultiplierUncached: () => number;
  // Cache management
  updateComputedValueCache: () => void;
  canAfford: (cost: number) => boolean;
  calculateOfflineTaps: () => number;
  checkUnlockedRoutes: (routePath: string) => boolean;
}

// room decorations
const initialDecorations: Decoration[] = [
  {
    id: "tree_3d",
    name: "Baum",
    description: "Ein Baum",
    cost: 1000,
    purchased: false,
    enabled: false,
    type: "3d",
    position: [0, -2, -7],
    scale: 0.7,
    rotation: 0,
    color: "#FFD700",
    icon: "🌳",
  },
];

// Initial themes based on config
const initialThemes: Theme[] = Object.values(THEME_CONFIG).map(
  (themeConfig) => ({
    id: themeConfig.id,
    name: themeConfig.name,
    description: themeConfig.description,
    cost: themeConfig.id === THEME_IDS.DEFAULT ? 0 : 50,
    purchased: themeConfig.id === THEME_IDS.DEFAULT,
    active: themeConfig.id === THEME_IDS.DEFAULT,
    colors: themeConfig.colors,
    planetColors: themeConfig.planetColors,
    counterColor: themeConfig.counterColor,
    blobColor: themeConfig.blobColor,
    outlineColor: themeConfig.outlineColor,
    eyeColor: themeConfig.eyeColor,
  })
);

// Initial routes using constants
const initialRoutes: Route[] = [
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

// Helper function to generate upgrade hash for caching
const generateUpgradeHash = (upgrades: Upgrade[]): string => {
  return JSON.stringify(upgrades.map((u) => ({ id: u.id, level: u.level })));
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        version: GAME_STORE_VERSIONS.LATEST,
        lastSchemaUpdate: new Date(),
        taps: 0,
        manualTaps: 0,
        manualTapsPerSecond: 0,
        tapsPerSecond: 0,
        tapMultiplier: 1,
        autoTapRate: 0,
        isPaused: false,
        recentManualTaps: [],
        lastAutoTapTime: Date.now(),

        // Cache properties
        _cachedTapsPerSecond: undefined,
        _cachedTapMultiplier: undefined,
        _lastUpgradeHash: undefined,

        upgrades: initialUpgrades,
        decorations: initialDecorations,
        themes: initialThemes,
        currentTheme: initialThemes[0],
        routes: initialRoutes,
        fisheyeIntensity: 0,
        animationsEnabled: true,
        statisticsVisible: false,

        // Sound system state
        soundSystem: {
          enabled: true,
          masterVolume: 0.0,
          tapVolume: 1.0,
          worldVolume: 0.9,
          uiVolume: 1.0,
          textVolume: 0.8,
          tapEnabled: true,
          worldEnabled: true,
        },
        soundPreferences: { enabled: true, muted: true },

        // Audio selections
        audioSelections: {
          worldMusicId: "world-lofi",
          tapEffectId: "tap_effect_default",
          worldSoundIds: [],
          tapEffectAudioId: undefined,
        },

        // Actions
        addTaps: (amount: number) => {
          set((state) => ({
            taps: state.taps + amount,
            manualTaps: state.manualTaps + amount,
          }));
        },

        addAutoTaps: (amount: number) => {
          set((state) => ({
            taps: state.taps + amount * state.getTotalTapMultiplier(),
            lastAutoTapTime: Date.now(),
          }));
        },

        addManualTap: () => {
          set((state) => {
            const now = Date.now();
            const oneSecondAgo = now - ONE_SECOND_MS;

            // Optimize array operations by pre-allocating
            const recentTaps = state.recentManualTaps || [];
            const filteredTaps: number[] = [];

            // Manual filtering for better performance
            for (let i = recentTaps.length - 1; i >= 0; i--) {
              if (recentTaps[i] > oneSecondAgo) {
                filteredTaps.unshift(recentTaps[i]);
              }
            }

            const newTaps = [...filteredTaps, now];
            const tapMultiplier = state.getTotalTapMultiplier();

            const newState = {
              ...state,
              taps: state.taps + 1 * tapMultiplier, // Apply multiplier to manual taps
              manualTaps: state.manualTaps + 1,
              manualTapsPerSecond: newTaps.length,
              recentManualTaps: newTaps,
            };

            // Check for route unlocks after adding taps using pattern matching
            // Only update routes if there are any changes to prevent unnecessary re-renders
            let hasRouteChanges = false;
            const updatedRoutes = newState.routes.map((route) => {
              const shouldUnlock = match({
                purchased: route.purchased,
                canAfford: newState.canAfford(route.cost),
                unlocked: route.unlocked,
              })
                .with(
                  { purchased: false, canAfford: true, unlocked: false },
                  () => true
                )
                .otherwise(() => false);

              if (shouldUnlock) {
                hasRouteChanges = true;
                return { ...route, unlocked: true };
              }
              return route;
            });

            // Only update state if there are actual changes
            if (hasRouteChanges) {
              return {
                ...newState,
                routes: updatedRoutes,
              };
            }

            return {
              ...newState,
              routes: updatedRoutes,
            };
          });
        },

        // Optimized cleanup with early return
        cleanupManualTaps: () => {
          set((state) => {
            const now = Date.now();
            const recentTaps = state.recentManualTaps || [];
            const oneSecondAgo = now - ONE_SECOND_MS;

            // Early return if no cleanup needed
            if (recentTaps.length === 0) {
              return state;
            }

            const filteredTaps: number[] = [];
            for (let i = recentTaps.length - 1; i >= 0; i--) {
              if (recentTaps[i] > oneSecondAgo) {
                filteredTaps.unshift(recentTaps[i]);
              }
            }

            // Early return if no cleanup needed
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
            if (
              !upgrade ||
              upgrade.level >= upgrade.maxLevel ||
              !state.canAfford(
                upgrade.baseCost *
                  Math.pow(upgrade.costMultiplier, upgrade.level)
              )
            ) {
              return state;
            }

            const cost =
              upgrade.baseCost *
              Math.pow(upgrade.costMultiplier, upgrade.level);

            let updatedUpgrades = state.upgrades.map((u) =>
              u.id === upgradeId ? { ...u, level: u.level + 1 } : u
            );

            // Handle special upgrade types
            if (upgrade.category === "tapEffects") {
              // For tap effects, unlock and select the new one
              updatedUpgrades = updatedUpgrades.map((u) => ({
                ...u,
                unlocked: u.id === upgradeId ? true : u.unlocked,
                selected:
                  u.category === "tapEffects" ? u.id === upgradeId : u.selected,
              }));
            } else if (upgrade.category === "environment") {
              // For environment effects, just unlock them
              updatedUpgrades = updatedUpgrades.map((u) => ({
                ...u,
                unlocked: u.id === upgradeId ? true : u.unlocked,
              }));
            } else {
              // For regular upgrades, update unlocked status based on tap count
              updatedUpgrades = updatedUpgrades.map((u) => {
                if (u.id === "auto_tap_2" && state.taps >= 50) {
                  return { ...u, unlocked: true };
                }
                if (u.id === "tap_multiplier_2" && state.taps >= 200) {
                  return { ...u, unlocked: true };
                }
                // Unlock "Tap Power" when player can afford it
                if (u.id === "tap_multiplier_1" && state.taps >= u.baseCost) {
                  return { ...u, unlocked: true };
                }
                return u;
              });
            }

            // Invalidate cache when upgrades change
            return {
              ...state,
              taps: state.taps - cost,
              upgrades: updatedUpgrades,
              _cachedTapsPerSecond: undefined,
              _cachedTapMultiplier: undefined,
              _lastUpgradeHash: undefined,
            };
          });

          // Update cache after state change
          setTimeout(() => {
            get().updateComputedValueCache();
          }, 0);
        },

        purchaseDecoration: (decorationId: string) => {
          set((state) => {
            const decoration = state.decorations.find(
              (d) => d.id === decorationId
            );
            if (
              !decoration ||
              decoration.purchased ||
              !state.canAfford(decoration.cost)
            ) {
              return state;
            }

            const updatedDecorations = state.decorations.map((d) =>
              d.id === decorationId
                ? { ...d, purchased: true, enabled: true }
                : d
            );

            return {
              ...state,
              taps: state.taps - decoration.cost,
              decorations: updatedDecorations,
            };
          });
        },

        purchaseTheme: (themeId: string) => {
          set((state) => {
            const theme = state.themes.find((t) => t.id === themeId);
            if (!theme || theme.purchased || !state.canAfford(theme.cost)) {
              return state;
            }

            const updatedThemes = state.themes.map((t) =>
              t.id === themeId ? { ...t, purchased: true } : t
            );

            return {
              ...state,
              taps: state.taps - theme.cost,
              themes: updatedThemes,
            };
          });
        },

        purchaseRoute: (routeId: string, force = false) => {
          set((state) => {
            const route = state.routes.find((r) => r.id === routeId);

            return match({
              route,
              canAfford: route ? state.canAfford(route.cost) : false,
              force,
            })
              .with({ force: true }, () => {
                const updatedRoutes = state.routes.map((r) =>
                  r.id === routeId
                    ? { ...r, purchased: true, unlocked: true }
                    : r
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
                      : r
                  );

                  return {
                    ...state,
                    taps: state.taps - route.cost,
                    routes: updatedRoutes,
                  };
                }
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
              !route.isLocked
          );
        },

        activateTheme: (themeId: string) => {
          set((state) => {
            const theme = state.themes.find((t) => t.id === themeId);
            if (!theme || !theme.purchased) {
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

        toggleDecoration: (decorationId: string) => {
          set((state) => {
            const decoration = state.decorations.find(
              (d) => d.id === decorationId
            );
            if (!decoration || !decoration.purchased) {
              return state;
            }

            const updatedDecorations = state.decorations.map((d) =>
              d.id === decorationId ? { ...d, enabled: !d.enabled } : d
            );

            return {
              ...state,
              decorations: updatedDecorations,
            };
          });
        },

        selectTapEffect: (upgradeId: string) => {
          set((state) => {
            const upgrade = state.upgrades.find((u) => u.id === upgradeId);
            if (
              !upgrade ||
              upgrade.category !== "tapEffects" ||
              !upgrade.unlocked
            ) {
              return state;
            }

            // Deselect all tap effects and select the chosen one
            const updatedUpgrades = state.upgrades.map((u) => ({
              ...u,
              selected:
                u.category === "tapEffects" ? u.id === upgradeId : u.selected,
            }));

            // Resolve tap audio from selected effect id with optional override; fall back to defaults
            try {
              const overrideId = get().audioSelections.tapEffectAudioId;
              const cfg = resolveTapSoundForEffect(upgradeId, overrideId);
              if (cfg && cfg.id) {
                if (cfg.filePath)
                  engineSetCurrentTapSound(cfg.id, cfg.filePath);
                else engineSetCurrentTapSound(cfg.id);
              }
            } catch (e) {
              console.error("Error setting current tap sound", e);
              toast.error("Error setting current tap sound");
            }

            return {
              ...state,
              upgrades: updatedUpgrades,
            };
          });
        },

        toggleEnvironmentEffect: (upgradeId: string) => {
          set((state) => {
            const upgrade = state.upgrades.find((u) => u.id === upgradeId);
            if (
              !upgrade ||
              upgrade.category !== "environment" ||
              !upgrade.unlocked
            ) {
              return state;
            }

            const updatedUpgrades = state.upgrades.map((u) =>
              u.id === upgradeId ? { ...u, selected: !u.selected } : u
            );

            return {
              ...state,
              upgrades: updatedUpgrades,
            };
          });
        },

        resetGame: () => {
          set({
            taps: 0,
            manualTaps: 0,
            manualTapsPerSecond: 0,
            tapsPerSecond: 0,
            tapMultiplier: 1,
            autoTapRate: 0,
            isPaused: false,
            recentManualTaps: [],
            upgrades: initialUpgrades,
            decorations: initialDecorations,
            themes: initialThemes,
            currentTheme: initialThemes[0],
            routes: initialRoutes,
            fisheyeIntensity: 0,
            animationsEnabled: true,
            statisticsVisible: false,
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

        // Dev Actions
        addDevTaps: (amount: number) => {
          set((state) => ({
            taps: state.taps + amount,
          }));
        },

        buyAllUpgrades: () => {
          set((state) => {
            const updatedUpgrades = state.upgrades.map((upgrade) => ({
              ...upgrade,
              unlocked: true,
              level: upgrade.maxLevel,
              selected:
                upgrade.category === "tapEffects"
                  ? upgrade.id === "tap_effect_default"
                  : upgrade.selected,
            }));

            const updatedDecorations = state.decorations.map((decoration) => ({
              ...decoration,
              purchased: true,
              enabled: true,
            }));

            const updatedThemes = state.themes.map((theme) => ({
              ...theme,
              purchased: true,
            }));

            const updatedRoutes = state.routes.map((route) => ({
              ...route,
              purchased: true,
            }));

            return {
              ...state,
              upgrades: updatedUpgrades,
              decorations: updatedDecorations,
              themes: updatedThemes,
              routes: updatedRoutes,
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
            const s = useGameStore.getState();
            const cfg = resolveTapSoundForEffect(
              id,
              s.audioSelections.tapEffectAudioId
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
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              tapEnabled: enabled,
            },
          }));
        },
        setWorldEnabled: (enabled: boolean) => {
          set((state) => ({
            ...state,
            soundSystem: {
              ...state.soundSystem,
              worldEnabled: enabled,
            },
          }));
        },

        // Route unlocking logic
        checkRouteUnlocks: () => {
          set((state) => {
            const updatedRoutes = state.routes.map((route) => {
              // Auto-unlock routes when affordable
              if (!route.purchased && state.canAfford(route.cost)) {
                return { ...route, unlocked: true };
              }
              return route;
            });

            return {
              ...state,
              routes: updatedRoutes,
            };
          });
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

          const result = state.upgrades
            .filter((u) => u.effect.type === "autoTap")
            .reduce((total, upgrade) => {
              return total + upgrade.effect.value * upgrade.level;
            }, 0);

          // Cache the result - this is safe because we're not in a React render cycle
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

          const multiplierUpgrades = state.upgrades.filter(
            (u) => u.effect.type === "tapMultiplier"
          );

          if (multiplierUpgrades.length === 0) {
            const result = 1;
            // Cache the result - this is safe because we're not in a React render cycle
            set((s) => ({
              ...s,
              _cachedTapMultiplier: result,
              _lastUpgradeHash: upgradeHash,
            }));
            return result;
          }

          const result = multiplierUpgrades.reduce((total, upgrade) => {
            // Each level of the upgrade applies the multiplier
            // So if you have level 2 of a "double tap power" upgrade (value: 2),
            // you get 2^2 = 4x multiplier
            return total * Math.pow(upgrade.effect.value, upgrade.level);
          }, 1);

          // Cache the result - this is safe because we're not in a React render cycle
          set((s) => ({
            ...s,
            _cachedTapMultiplier: result,
            _lastUpgradeHash: upgradeHash,
          }));

          return result;
        },

        getAutoTapRate: () => {
          const state = get();
          return state.upgrades
            .filter((u) => u.effect.type === "autoTap")
            .reduce((total, upgrade) => {
              return total + upgrade.effect.value * upgrade.level;
            }, 0);
        },

        // Non-caching versions for use during render
        getAutoTapRateUncached: () => {
          const state = get();
          return state.upgrades
            .filter((u) => u.effect.type === "autoTap")
            .reduce((total, upgrade) => {
              return total + upgrade.effect.value * upgrade.level;
            }, 0);
        },

        getTotalTapMultiplierUncached: () => {
          const state = get();
          const multiplierUpgrades = state.upgrades.filter(
            (u) => u.effect.type === "tapMultiplier"
          );

          if (multiplierUpgrades.length === 0) {
            return 1;
          }

          return multiplierUpgrades.reduce((total, upgrade) => {
            return total * Math.pow(upgrade.effect.value, upgrade.level);
          }, 1);
        },

        // Update cache when upgrades change (called from actions, not during render)
        updateComputedValueCache: () => {
          const state = get();
          const upgradeHash = generateUpgradeHash(state.upgrades);

          // Only update if hash changed
          if (state._lastUpgradeHash === upgradeHash) {
            return;
          }

          const tapsPerSecond = state.upgrades
            .filter((u) => u.effect.type === "autoTap")
            .reduce((total, upgrade) => {
              return total + upgrade.effect.value * upgrade.level;
            }, 0);

          const tapMultiplier = state.upgrades
            .filter((u) => u.effect.type === "tapMultiplier")
            .reduce((total, upgrade) => {
              return total * Math.pow(upgrade.effect.value, upgrade.level);
            }, 1);

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

          // Calculate how many taps should have been generated
          const tapsPerSecond = state.getTotalTapsPerSecond();
          const tapMultiplier = state.getTotalTapMultiplier();
          const baseOfflineTaps = Math.floor(
            tapsPerSecond * secondsSinceLastTap
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
        version: GAME_STORE_VERSIONS.LATEST,
        storage: createIndexedDBStorage<GameStore>(),
        migrate: (persistedState: any, version: number) => {
          return migrateStore(persistedState, version);
        },
        partialize: (state) =>
          ({
            version: state.version,
            lastSchemaUpdate: state.lastSchemaUpdate,
            taps: state.taps,
            upgrades: state.upgrades,
            decorations: state.decorations,
            themes: state.themes,
            currentTheme: state.currentTheme,
            routes: state.routes,
            fisheyeIntensity: state.fisheyeIntensity,
            lastAutoTapTime: state.lastAutoTapTime,
            soundSystem: state.soundSystem,
            soundPreferences: state.soundPreferences || {
              enabled: state.soundSystem.enabled,
              muted: state.soundSystem.masterVolume === 0,
            },
            audioSelections: state.audioSelections,
          } as unknown as GameStore),
        onRehydrateStorage: (state) => {
          console.log("Game store rehydrated:", state);

          // Queue storage migration lazily to avoid circular import during init
          import("./migration")
            .then((m) => m.queueStorageMigration())
            .catch((e) =>
              console.error("Failed to queue storage migration", e)
            );

          const needsPurge = new Date(state?.lastSchemaUpdate) < PURGE_DATE;

          // Check if store version migration is needed
          if (
            state &&
            state.version &&
            (state.version < GAME_STORE_VERSIONS.LATEST || needsPurge)
          ) {
            console.log(
              `Store version ${state.version} and last schema update ${state.lastSchemaUpdate} detected, triggering migration to ${GAME_STORE_VERSIONS.LATEST}`
            );
            try {
              const migratedState = migrateStore(
                state,
                GAME_STORE_VERSIONS.LATEST
              );

              // Update the store with migrated data
              useGameStore.setState({
                ...state,
                ...migratedState,
              });

              toast.success(
                `Store migrated from V${state.version} to V${GAME_STORE_VERSIONS.LATEST}`
              );
            } catch (error) {
              console.error("Error during store migration:", error);
              toast.error(
                "Store Migration fehlgeschlagen, manche Inhalte könnten fehlen."
              );
            }
          }

          // Restore enabled/muted preference; keep persisted volumes intact
          try {
            const prefs = state.soundPreferences;
            const enabled = prefs?.enabled ?? true;
            const muted = prefs?.muted ?? false;
            useGameStore.setState((s) => ({
              ...s,
              soundSystem: {
                ...s.soundSystem,
                enabled,
                // do not overwrite persisted masterVolume here; engine will apply mute
              },
              soundPreferences: { enabled, muted },
            }));
            try {
              const current = useGameStore.getState();
              engineSetMasterVolume(
                muted ? 0 : current.soundSystem?.masterVolume || 1
              );
            } catch {}
          } catch {}

          // Sync per-type enable flags and current selections with engine after rehydrate
          try {
            const s = useGameStore.getState();
            engineSetTapEnabled(!!s.soundSystem.tapEnabled);
            engineSetWorldEnabled(!!s.soundSystem.worldEnabled);
            // Apply selected primary world music id to engine without forcing start
            const worldId = s.audioSelections.worldMusicId;
            if (worldId) {
              const track = getWorldSoundById(worldId);
              if (track) engineSetWorldMusic(track.filePath, track.id);
            }
            // Apply currently selected tap effect audio using resolver
            const selectedTap = s.upgrades.find(
              (u) => u.category === "tapEffects" && u.selected
            );
            const cfg = resolveTapSoundForEffect(
              selectedTap?.id || "tap_effect_default",
              s.audioSelections.tapEffectAudioId
            );
            if (cfg && cfg.id) {
              if (cfg.filePath) engineSetCurrentTapSound(cfg.id, cfg.filePath);
              else engineSetCurrentTapSound(cfg.id);
            }
          } catch {}
        },
      }
    ),
    {
      name: "game-store",
    }
  )
);

// Auto-tap effect with improved performance and cleanup
let autoTapInterval: NodeJS.Timeout | null = null;
let particleTimeouts: NodeJS.Timeout[] = [];

export const startAutoTap = () => {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
  }

  // Clear any existing particle timeouts
  particleTimeouts.forEach((timeout) => clearTimeout(timeout));
  particleTimeouts = [];

  autoTapInterval = setInterval(() => {
    const store = useGameStore.getState();

    // Check if game is paused
    if (store.isPaused) {
      return;
    }

    const tapsPerSecond = store.getTotalTapsPerSecond();
    if (tapsPerSecond > 0) {
      store.addAutoTaps(tapsPerSecond);

      // trigger tap effects for auto-taps
      if ((window as any).createTapParticles) {
        const tapCount = Math.min(tapsPerSecond, MAX_PARTICLES_PER_AUTO_TAP);

        // Clear old timeouts before creating new ones
        particleTimeouts.forEach((timeout) => clearTimeout(timeout));
        particleTimeouts = [];

        for (let i = 0; i < tapCount; i++) {
          const timeout = setTimeout(() => {
            (window as any).createTapParticles(-1, 0.5, -1, 1);
          }, i * PARTICLE_STAGGER_MS);
          particleTimeouts.push(timeout);
        }
      }
    }
  }, AUTO_TAP_INTERVAL_MS);
};

export const stopAutoTap = () => {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
    autoTapInterval = null;
  }

  // Clear all particle timeouts
  particleTimeouts.forEach((timeout) => clearTimeout(timeout));
  particleTimeouts = [];
};

// Utility function to manually trigger store migration
export const triggerStoreMigration = () => {
  const store = useGameStore.getState();
  const currentState = {
    version: store.version || 1,
    taps: store.taps,
    upgrades: store.upgrades,
    decorations: store.decorations,
    themes: store.themes,
    currentTheme: store.currentTheme,
    fisheyeIntensity: store.fisheyeIntensity,
  };

  const migratedState = migrateStore(currentState, GAME_STORE_VERSIONS.V9);
  toast.success(`Store migrated to VERSION_${GAME_STORE_VERSIONS.LATEST}`);

  // Update the store with migrated data
  useGameStore.setState({
    ...store,
    ...migratedState,
  });
};

// Utility function to force V9 migration specifically
// check if still needed after all other migrations
export const forceV9Migration = () => {
  const store = useGameStore.getState();

  // Force migration from V8 to V9
  const currentState = {
    version: 8, // Force V8 to trigger V9 migration
    taps: store.taps,
    upgrades: store.upgrades,
    decorations: store.decorations,
    themes: store.themes,
    currentTheme: store.currentTheme,
    fisheyeIntensity: store.fisheyeIntensity,
  };

  const migratedState = migrateStore(currentState, 6);
  toast.success("Forced V7 migration completed");

  // Update the store with migrated data
  useGameStore.setState({
    ...store,
    ...migratedState,
  });
};
