import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { persist } from "zustand/middleware";
import { THEME_CONFIG } from "./upgradesConfig";

// Constants
const ONE_SECOND_MS = 1000;
const AUTO_TAP_INTERVAL_MS = 1000;
const MAX_PARTICLES_PER_AUTO_TAP = 5;
const PARTICLE_STAGGER_MS = 100;

// Store version for migrations
const STORE_VERSION = 4;

// Migration functions
function migrateStore(oldState: any, version: number): any {
  let migratedState = { ...oldState };

  // Migration from version 1 to 2
  if (version < 2) {
    // Update theme prices
    if (migratedState.themes) {
      migratedState.themes = migratedState.themes.map((theme: any) => {
        if (theme.id === "dark") {
          return { ...theme, cost: 1000 };
        } else if (theme.id === "pastel") {
          return { ...theme, cost: 2000 };
        } else if (theme.id === "neon") {
          return { ...theme, cost: 3000 };
        }
        return theme;
      });
    }

    // Update effect prices
    if (migratedState.upgrades) {
      migratedState.upgrades = migratedState.upgrades.map((upgrade: any) => {
        if (upgrade.id === "tap_effect_confetti") {
          return { ...upgrade, baseCost: 1500 };
        } else if (upgrade.id === "tap_effect_hearts") {
          return { ...upgrade, baseCost: 2500 };
        } else if (upgrade.id === "tap_effect_stars") {
          return { ...upgrade, baseCost: 3500 };
        }
        return upgrade;
      });
    }
  }

  // Migration from version 2 to 3
  if (version < 3) {
    // Fix tap multiplier upgrades that might have incorrect levels
    if (migratedState.upgrades) {
      migratedState.upgrades = migratedState.upgrades.map((upgrade: any) => {
        if (
          upgrade.effect?.type === "tapMultiplier" &&
          upgrade.unlocked &&
          upgrade.level > 0
        ) {
          return { ...upgrade, level: 0 };
        }
        return upgrade;
      });
    }
  }

  // Migration from version 3 to 4
  if (version < 4) {
    // Lock the "Tap Power" upgrade by default and reset its level
    if (migratedState.upgrades) {
      migratedState.upgrades = migratedState.upgrades.map((upgrade: any) => {
        if (upgrade.id === "tap_multiplier_1") {
          return { ...upgrade, unlocked: false, level: 0 };
        }
        return upgrade;
      });
    }
  }

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
  font: string;
  icon: string;
}

// Game state interface
interface GameStore {
  // Core game state
  taps: number;
  manualTaps: number;
  manualTapsPerSecond: number;
  tapsPerSecond: number;
  tapMultiplier: number;
  autoTapRate: number;
  isPaused: boolean;
  recentManualTaps: number[];

  // Cached computed values for performance
  _cachedTapsPerSecond?: number;
  _cachedTapMultiplier?: number;
  _lastUpgradeHash?: string;

  // Upgrades
  upgrades: Upgrade[];

  // Decorations
  decorations: Decoration[];

  // Themes
  themes: Theme[];
  currentTheme: Theme | null;

  // Fisheye slider
  fisheyeIntensity: number;

  // Dev state
  animationsEnabled: boolean;
  statisticsVisible: boolean;

  // Actions
  addTaps: (amount: number) => void;
  addAutoTaps: (amount: number) => void;
  addManualTap: () => void;
  cleanupManualTaps: () => void;
  purchaseUpgrade: (upgradeId: string) => void;
  purchaseDecoration: (decorationId: string) => void;
  purchaseTheme: (themeId: string) => void;
  activateTheme: (themeId: string) => void;
  toggleDecoration: (decorationId: string) => void;
  selectTapEffect: (upgradeId: string) => void;
  toggleEnvironmentEffect: (upgradeId: string) => void;
  setFisheyeIntensity: (intensity: number) => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Dev Actions
  addDevTaps: (amount: number) => void;
  buyAllUpgrades: () => void;
  toggleAnimations: () => void;
  toggleStatistics: () => void;

  // Computed values
  getTotalTapsPerSecond: () => number;
  getTotalTapMultiplier: () => number;
  getAutoTapRate: () => number;
  canAfford: (cost: number) => boolean;
}

// Initial upgrades
const initialUpgrades: Upgrade[] = [
  {
    id: "auto_tap_1",
    name: "Auto Tapper",
    description: "Automatically taps once per second",
    baseCost: 15,
    costMultiplier: 1.3,
    level: 0,
    maxLevel: 5,
    effect: { type: "autoTap", value: 1 },
    unlocked: true,
    icon: "🤖",
    category: "upgrades",
  },
  {
    id: "tap_multiplier_1",
    name: "Tap Power",
    description: "Doubles your tap power",
    baseCost: 50,
    costMultiplier: 1.8,
    level: 0,
    maxLevel: 3,
    effect: { type: "tapMultiplier", value: 2 },
    unlocked: false,
    icon: "💪",
    category: "upgrades",
  },
  {
    id: "auto_tap_2",
    name: "Super Auto Tapper",
    description: "Automatically taps 3 times per second",
    baseCost: 200,
    costMultiplier: 1.5,
    level: 0,
    maxLevel: 3,
    effect: { type: "autoTap", value: 3 },
    unlocked: false,
    icon: "⚡",
    category: "upgrades",
  },
  {
    id: "tap_multiplier_2",
    name: "Mega Tap Power",
    description: "Triples your tap power",
    baseCost: 1000,
    costMultiplier: 2.5,
    level: 0,
    maxLevel: 2,
    effect: { type: "tapMultiplier", value: 3 },
    unlocked: false,
    icon: "🔥",
    category: "upgrades",
  },
  // Tap Effects
  {
    id: "tap_effect_default",
    name: "Default Tap Effect",
    description: "Classic white, grey, and black dots",
    baseCost: 0,
    costMultiplier: 1,
    level: 1,
    maxLevel: 1,
    effect: { type: "tapEffect", value: 0 },
    unlocked: true,
    icon: "⚪",
    category: "tapEffects",
    selected: true, // Default selected
  },
  {
    id: "tap_effect_confetti",
    name: "Confetti Effect",
    description: "Colorful confetti pieces",
    baseCost: 1500,
    costMultiplier: 1,
    level: 0,
    maxLevel: 1,
    effect: { type: "tapEffect", value: 1 },
    unlocked: false,
    icon: "🎉",
    category: "tapEffects",
    selected: false,
  },
  {
    id: "tap_effect_hearts",
    name: "Heart Effect",
    description: "Floating heart particles",
    baseCost: 2500,
    costMultiplier: 1,
    level: 0,
    maxLevel: 1,
    effect: { type: "tapEffect", value: 2 },
    unlocked: false,
    icon: "💖",
    category: "tapEffects",
    selected: false,
  },
  {
    id: "tap_effect_stars",
    name: "Star Effect",
    description: "Shining star particles",
    baseCost: 3500,
    costMultiplier: 1,
    level: 0,
    maxLevel: 1,
    effect: { type: "tapEffect", value: 3 },
    unlocked: false,
    icon: "⭐",
    category: "tapEffects",
    selected: false,
  },
  // Environment Effects
  {
    id: "environment_rain",
    name: "Rain Effect",
    description: "Adds a gentle rain particle effect",
    baseCost: 100,
    costMultiplier: 1,
    level: 0,
    maxLevel: 1,
    effect: { type: "environment", value: 0 },
    unlocked: false,
    icon: "🌧️",
    category: "environment",
    selected: false,
  },
  {
    id: "environment_clouds",
    name: "Cloud Effect",
    description: "Adds floating cloud particles",
    baseCost: 150,
    costMultiplier: 1,
    level: 0,
    maxLevel: 1,
    effect: { type: "environment", value: 1 },
    unlocked: false,
    icon: "☁️",
    category: "environment",
    selected: false,
  },
];

// Initial decorations (keeping only fisheye for now)
const initialDecorations: Decoration[] = [
  {
    id: "fisheye_intensity",
    name: "Fisheye Intensity",
    description: "Increases the fisheye lens effect",
    cost: 500,
    purchased: false,
    enabled: false,
    type: "2d",
    position: [0, 0, 0],
    scale: 1,
    rotation: 0,
    color: "#FFD700",
    icon: "🔍",
  },
];

// Initial themes based on config
const initialThemes: Theme[] = Object.values(THEME_CONFIG).map(
  (themeConfig) => ({
    id: themeConfig.id,
    name: themeConfig.name,
    description: themeConfig.description,
    cost:
      themeConfig.id === "default"
        ? 0
        : themeConfig.id === "dark"
        ? 1000
        : themeConfig.id === "pastel"
        ? 2000
        : themeConfig.id === "neon"
        ? 3000
        : 0,
    purchased: themeConfig.id === "default",
    active: themeConfig.id === "default",
    colors: themeConfig.colors,
    font: "Open Sauce Two",
    icon: themeConfig.id === "default" ? "🎨" : "🎨",
  })
);

// Helper function to generate upgrade hash for caching
const generateUpgradeHash = (upgrades: Upgrade[]): string => {
  return JSON.stringify(upgrades.map((u) => ({ id: u.id, level: u.level })));
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        taps: 0,
        manualTaps: 0,
        manualTapsPerSecond: 0,
        tapsPerSecond: 0,
        tapMultiplier: 1,
        autoTapRate: 0,
        isPaused: false,
        recentManualTaps: [],

        // Cache properties
        _cachedTapsPerSecond: undefined,
        _cachedTapMultiplier: undefined,
        _lastUpgradeHash: undefined,

        upgrades: initialUpgrades,
        decorations: initialDecorations,
        themes: initialThemes,
        currentTheme: initialThemes[0],
        fisheyeIntensity: 0,
        animationsEnabled: true,
        statisticsVisible: false,

        // Actions
        addTaps: (amount) => {
          set((state) => ({
            taps: state.taps + amount,
            manualTaps: state.manualTaps + amount,
          }));
        },

        addAutoTaps: (amount: number) => {
          set((state) => ({
            taps: state.taps + amount * state.getTotalTapMultiplier(),
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

            return {
              ...state,
              taps: state.taps + 1 * tapMultiplier, // Apply multiplier to manual taps
              manualTaps: state.manualTaps + 1,
              manualTapsPerSecond: newTaps.length,
              recentManualTaps: newTaps,
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

        purchaseUpgrade: (upgradeId) => {
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
        },

        purchaseDecoration: (decorationId) => {
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

        purchaseTheme: (themeId) => {
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

        activateTheme: (themeId) => {
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

        toggleDecoration: (decorationId) => {
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

        selectTapEffect: (upgradeId) => {
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

            return {
              ...state,
              upgrades: updatedUpgrades,
            };
          });
        },

        toggleEnvironmentEffect: (upgradeId) => {
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

        setFisheyeIntensity: (intensity) => {
          set((state) => ({
            ...state,
            fisheyeIntensity: intensity,
          }));
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
        addDevTaps: (amount) => {
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

            return {
              ...state,
              upgrades: updatedUpgrades,
              decorations: updatedDecorations,
              themes: updatedThemes,
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

          // Cache the result
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
            // Each level of the upgrade applies the multiplier
            // So if you have level 2 of a "double tap power" upgrade (value: 2),
            // you get 2^2 = 4x multiplier
            return total * Math.pow(upgrade.effect.value, upgrade.level);
          }, 1);

          // Cache the result
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

        canAfford: (cost) => {
          return get().taps >= cost;
        },
      }),
      {
        name: "game-store",
        version: STORE_VERSION,
        migrate: (persistedState: any, version: number) => {
          return migrateStore(persistedState, version);
        },
        partialize: (state) => ({
          taps: state.taps,
          upgrades: state.upgrades,
          decorations: state.decorations,
          themes: state.themes,
          currentTheme: state.currentTheme,
          fisheyeIntensity: state.fisheyeIntensity,
        }),
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

      // Trigger tap effects for auto-taps with improved performance
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
    taps: store.taps,
    upgrades: store.upgrades,
    decorations: store.decorations,
    themes: store.themes,
    currentTheme: store.currentTheme,
    fisheyeIntensity: store.fisheyeIntensity,
  };

  const migratedState = migrateStore(currentState, 1);

  // Update the store with migrated data
  useGameStore.setState({
    ...store,
    ...migratedState,
  });
};
