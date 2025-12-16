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
  setWorldMusic as engineSetWorldMusic,
} from "@/utils/soundSystem";
import {
  resolveTapSoundForEffect,
  tryGetWorldSoundById,
} from "@/utils/sound/configs";
import { getWorldSoundById } from "@/utils/sound/configs";
import { THEME_IDS, THEME_CONFIG } from "./themeConfig";
import { initialTapUpgrades } from "@/shop-items/upgrades";
import { initialTapEffects } from "@/shop-items/tapEffects";
import {
  BlobFormConfig,
  INITIAL_BLOB_FORMS,
  DEFAULT_FORM_PARAMETERS,
} from "@/types/blobForms";
import { initialWeatherEffects } from "@/shop-items/weatherEffects";

export enum GAME_STORE_VERSIONS {
  V1 = 1,
  LATEST = V1,
}

// Constants
const ONE_SECOND_MS = 1000;
const AUTO_TAP_INTERVAL_MS = 1000;

const PURGE_DATE = new Date("12/16/2025"); // utility to purge states created before this date

// main migration function
function migrateStore(oldState: any, version: GAME_STORE_VERSIONS): any {
  console.log(
    `Migration triggered: oldState version=${oldState.version}, migration version=${version}`
  );
  let migratedState = { ...oldState };

  let currentVersion = oldState.version || GAME_STORE_VERSIONS.V1;

  currentVersion = GAME_STORE_VERSIONS.LATEST;
  migratedState.version = GAME_STORE_VERSIONS.LATEST;

  return migratedState;
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
}

export interface WeatherEffect extends BaseItem {}

export type ShopItem = DecorationItem | TapEffect | BobItem | WeatherEffect;

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
  category: "upgrades" | "effects" | "environment" | "tapEffects";
}

export interface TapEffect extends BaseItem {
  soundId?: string;
}

// Decoration types
export interface DecorationItem extends BaseItem {
  type: "2d" | "3d";
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
  icon: string;
}

// Bob item types (for wearable items like hats)
export interface BobItem extends BaseItem {
  type: "hat" | "accessory" | "outfit" | "decoration";
  icon: string;
  category: "bob";
  detached?: boolean; // If true, item stays at initial position and doesn't follow head movements
}

const ITEM_NAME_MAP = {
  hat: "Kopfbedeckung",
  accessory: "Special",
  "3d": "3D Deko",
  tapEffects: "Tap Effekt",
  decoration: "Dekoration",
};

export const getShopItemType = (itemType: keyof typeof ITEM_NAME_MAP) => {
  return ITEM_NAME_MAP[itemType];
};

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

interface GameStore {
  version: number;
  lastSchemaUpdate: Date; // Timestamp for manual migration triggers

  taps: number;
  manualTaps: number;
  manualTapsPerSecond: number;
  tapsPerSecond: number;
  tapMultiplier: number;
  autoTapRate: number;
  isPaused: boolean;
  recentManualTaps: number[];
  lastAutoTapTime: number;

  _cachedTapsPerSecond?: number;
  _cachedTapMultiplier?: number;
  _lastUpgradeHash?: string;

  upgrades: Upgrade[];
  decorations: DecorationItem[];
  bobItems: BobItem[];
  blobForms: BlobFormConfig[];
  themes: Theme[];
  currentTheme: Theme | null;
  routes: Route[];
  tapEffects: TapEffect[];
  weatherEffects: WeatherEffect[];

  fisheyeIntensity: number;

  customCameraControlsEnabled: boolean;
  animationsEnabled: boolean;
  statisticsVisible: boolean;

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

  addTaps: (amount: number) => void;
  addAutoTaps: (amount: number) => void;
  addManualTap: () => void;
  cleanupManualTaps: () => void;
  equipBobItem: (bobItemId: string) => void;
  unequipBobItem: (bobItemId: string) => void;
  selectBlobForm: (blobFormId: string) => void;
  updateBlobFormParameters: (
    blobFormId: string,
    parameters: Partial<import("@/types/blobForms").BlobFormParameters>
  ) => void;
  resetBlobFormParameters: (blobFormId: string) => void;

  purchaseUpgrade: (upgradeId: string) => void;
  purchaseDecoration: (decorationId: string) => void;
  purchaseBobItem: (bobItemId: string) => void;
  purchaseTheme: (themeId: string) => void;
  purchaseRoute: (routeId: string, force?: boolean) => void;
  purchaseBlobForm: (blobFormId: string) => void;
  purchaseTapEffect: (effectId: string) => void;

  activateTheme: (themeId: string) => void;
  selectTapEffect: (tapEffectId: string) => void;
  toggleDecoration: (decorationId: string) => void;
  toggleWeatherEffect: (effectId: string) => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  toggleCustomCameraControls: () => void;
  addDevTaps: (amount: number) => void;
  buyAllUpgrades: () => void;
  toggleAnimations: () => void;
  toggleStatistics: () => void;

  setSoundEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setTapVolume: (volume: number) => void;
  setWorldVolume: (volume: number) => void;
  setUIVolume: (volume: number) => void;
  setTextVolume: (volume: number) => void;

  setWorldMusicId: (id: string) => void;
  setTapEffectId: (id: string) => void;
  setTapEnabled: (enabled: boolean) => void;
  setWorldEnabled: (enabled: boolean) => void;
  setWorldSoundIds?: (ids: string[]) => void;
  toggleWorldSoundId?: (id: string) => void;
  setTapEffectAudioId?: (id?: string) => void;

  getTotalTapsPerSecond: () => number;
  getTotalTapMultiplier: () => number;
  getAutoTapRate: () => number;

  getAutoTapRateUncached: () => number;
  getTotalTapMultiplierUncached: () => number;

  updateComputedValueCache: () => void;
  canAfford: (cost: number) => boolean;
  calculateOfflineTaps: () => number;
  checkUnlockedRoutes: (routePath: string) => boolean;
}

export const initialDecorations: DecorationItem[] = [
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

export const initialBobItems: BobItem[] = [
  {
    id: "builderHelmet",
    name: "Schutzhelm",
    description: "Jo wir schaffen das!",
    cost: 100,
    purchased: false,
    enabled: false,
    type: "hat",
    icon: "👨‍🍳",
    category: "bob",
  },
  {
    id: "krustyKrabHat",
    name: "Arbeitskleidung",
    description: "Ist da die Krosse Krabbe?",
    cost: 100,
    purchased: false,
    enabled: false,
    type: "hat",
    icon: "👨‍🍳",
    category: "bob",
  },
  {
    id: "afroHair",
    name: "Afro",
    description: "Happy little accidents",
    cost: 100,
    purchased: false,
    enabled: false,
    type: "hat",
    icon: "👨‍🎨",
    category: "bob",
  },
  {
    id: "chickenLittleGlasses",
    name: "Nasenfahrrad",
    description: "Eddie's Brille",
    cost: 100,
    purchased: false,
    enabled: false,
    type: "accessory",
    icon: "🤓",
    category: "bob",
  },
  {
    id: "simsPlumbob",
    name: "Plumbob",
    description: "Sul Sul",
    cost: 50,
    purchased: false,
    enabled: false,
    type: "decoration",
    icon: "💎",
    category: "bob",
    detached: true,
  },
];

export const initialThemes: Theme[] = Object.values(THEME_CONFIG).map(
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

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
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

        _cachedTapsPerSecond: undefined,
        _cachedTapMultiplier: undefined,
        _lastUpgradeHash: undefined,

        upgrades: initialTapUpgrades,
        decorations: initialDecorations,
        bobItems: initialBobItems,
        tapEffects: initialTapEffects,
        weatherEffects: initialWeatherEffects,
        blobForms: INITIAL_BLOB_FORMS,
        themes: initialThemes,
        currentTheme: initialThemes[0],
        routes: initialRoutes,
        fisheyeIntensity: 0,
        animationsEnabled: true,
        statisticsVisible: false,
        customCameraControlsEnabled: true,

        soundSystem: {
          enabled: true,
          masterVolume: 1.0,
          tapVolume: 1.0,
          worldVolume: 0.9,
          uiVolume: 1.0,
          textVolume: 0.8,
          tapEnabled: true,
          worldEnabled: true,
        },
        soundPreferences: { enabled: true, muted: false },

        audioSelections: {
          worldMusicId: "world-lofi",
          tapEffectId: "tap_effect_default",
          worldSoundIds: [],
          tapEffectAudioId: undefined,
        },

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

            const recentTaps = state.recentManualTaps || [];
            const filteredTaps: number[] = [];

            for (let i = recentTaps.length - 1; i >= 0; i--) {
              if (recentTaps[i] > oneSecondAgo) {
                filteredTaps.unshift(recentTaps[i]);
              }
            }

            const newTaps = [...filteredTaps, now];
            const tapMultiplier = state.getTotalTapMultiplier();

            const newState = {
              ...state,
              taps: state.taps + 1 * tapMultiplier,
              manualTaps: state.manualTaps + 1,
              manualTapsPerSecond: newTaps.length,
              recentManualTaps: newTaps,
            };

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
              t.id === effectId ? { ...t, purchased: true } : t
            );

            return {
              ...state,
              taps: state.taps - effect.cost,
              tapEffects: updatedTapEffects,
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

        purchaseBobItem: (bobItemId: string) => {
          set((state) => {
            const bobItem = state.bobItems.find((b) => b.id === bobItemId);
            if (
              !bobItem ||
              bobItem.purchased ||
              !state.canAfford(bobItem.cost)
            ) {
              return state;
            }

            const updatedBobItems = state.bobItems.map((b) =>
              b.id === bobItemId ? { ...b, purchased: true } : b
            );

            return {
              ...state,
              taps: state.taps - bobItem.cost,
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
              f.id === blobFormId ? { ...f, unlocked: true } : f
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
          parameters: Partial<import("@/types/blobForms").BlobFormParameters>
        ) => {
          set((state) => {
            const updatedBlobForms = state.blobForms.map((f) =>
              f.id === blobFormId
                ? { ...f, parameters: { ...f.parameters, ...parameters } }
                : f
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
                : f
            );

            return {
              ...state,
              blobForms: updatedBlobForms,
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

        // TODO: use better names (force means for free?)
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

        selectTapEffect: (tapEffectId: string) => {
          set((state) => {
            const effect = state.tapEffects.find((e) => e.id === tapEffectId);
            if (!effect || !effect.enabled) {
              return state;
            }

            const updatedEffects = state.tapEffects.map((e) =>
              e.id === tapEffectId ? { ...e, enabled: !e.enabled } : e
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
              w.id === effectId ? { ...w, enabled: !w.enabled } : w
            );

            return {
              ...state,
              weatherEffects: updatedWeatherEffects,
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
            upgrades: initialTapUpgrades,
            decorations: initialDecorations,
            themes: initialThemes,
            bobItems: initialBobItems,
            blobForms: INITIAL_BLOB_FORMS,
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
        toggleCustomCameraControls: () => {
          set((state) => ({
            ...state,
            customCameraControlsEnabled: !state.customCameraControlsEnabled,
          }));
        },
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

            const updatedBobItems = state.bobItems.map((bobItem) => ({
              ...bobItem,
              purchased: true,
            }));

            const updatedBlobForms = state.blobForms.map((blobForm) => ({
              ...blobForm,
              unlocked: true,
            }));

            return {
              ...state,
              upgrades: updatedUpgrades,
              decorations: updatedDecorations,
              themes: updatedThemes,
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
            set((s) => ({
              ...s,
              _cachedTapMultiplier: result,
              _lastUpgradeHash: upgradeHash,
            }));
            return result;
          }

          const result = multiplierUpgrades.reduce((total, upgrade) => {
            return total * Math.pow(upgrade.effect.value, upgrade.level);
          }, 1);

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

        updateComputedValueCache: () => {
          const state = get();
          const upgradeHash = generateUpgradeHash(state.upgrades);

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
            bobItems: state.bobItems,
            themes: state.themes,
            currentTheme: state.currentTheme,
            routes: state.routes,
            blobForms: state.blobForms,
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

          import("./migration")
            .then((m) => m.queueStorageMigration())
            .catch((e) =>
              console.error("Failed to queue storage migration", e)
            );

          // TODO: check safer purge method or if even needed
          const needsPurge = new Date(state?.lastSchemaUpdate) < PURGE_DATE;

          if (needsPurge) {
            try {
              useGameStore.setState(state);

              toast.success(
                `Store migrated from V${state.version} to V${GAME_STORE_VERSIONS.LATEST}`
              );

              setTimeout(() => {
                try {
                  import("./messageStore").then((messageStore) => {
                    messageStore.useMessageStore.setState({
                      isHydrated: true,
                      repeatFlags: {},
                      seenThisSession: {},
                    });
                    console.log(
                      "Re-hydrated message store and cleared repeat flags after game store migration"
                    );
                  });
                } catch (e) {
                  console.warn("Failed to re-hydrate message store:", e);
                }
              }, 100);
            } catch (error) {
              console.error("Error during store migration:", error);
              toast.error(
                "Store Migration fehlgeschlagen, manche Inhalte könnten fehlen."
              );
            }
          }

          try {
            const prefs = state.soundPreferences;
            const enabled = prefs?.enabled ?? true;
            const muted = prefs?.muted ?? false;
            useGameStore.setState((s) => ({
              ...s,
              soundSystem: {
                ...s.soundSystem,
                enabled,
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

          try {
            const s = useGameStore.getState();
            engineSetTapEnabled(!!s.soundSystem.tapEnabled);
            const worldId = s.audioSelections.worldMusicId;
            if (worldId) {
              const track = tryGetWorldSoundById(worldId);
              if (track) engineSetWorldMusic(track.filePath, track.id);
            }
            const selectedTap = s.tapEffects.find((u) => u.enabled);
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

let autoTapInterval: NodeJS.Timeout | null = null;

export const startAutoTap = () => {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
  }

  autoTapInterval = setInterval(() => {
    const store = useGameStore.getState();

    if (store.isPaused) {
      return;
    }

    const tapsPerSecond = store.getTotalTapsPerSecond();
    if (tapsPerSecond > 0) {
      store.addAutoTaps(tapsPerSecond);

      // trigger tap effects for auto-taps
      // TODO: use hook instead of global functions
      if ((window as any).createTapParticles) {
        (window as any).createTapParticles(0, 0, 0, 15);
      }
    }
  }, AUTO_TAP_INTERVAL_MS);
};

export const stopAutoTap = () => {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
    autoTapInterval = null;
  }
};

// manually trigger store migration in dev tools
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

  const migratedState = migrateStore(currentState, GAME_STORE_VERSIONS.LATEST);
  toast.success(`Store migrated to VERSION_${GAME_STORE_VERSIONS.LATEST}`);

  useGameStore.setState({
    ...store,
    ...migratedState,
  });
};
