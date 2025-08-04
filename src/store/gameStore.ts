import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { persist } from "zustand/middleware";
import { THEME_CONFIG } from "./upgradesConfig";

// Store version for migrations
const STORE_VERSION = 2;

// Migration functions
function migrateStore(oldState: any, version: number): any {
  let migratedState = { ...oldState };

  // Migration from version 1 to 2
  if (version < 2) {
    console.log("Migrating store from version", version, "to", STORE_VERSION);

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
    unlocked: true,
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
    font: "OpenSauceTwo-Regular",
    icon: themeConfig.id === "default" ? "🎨" : "🎨",
  })
);

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
            taps: state.taps + amount * state.tapMultiplier,
            manualTaps: state.manualTaps + amount,
          }));
        },

        addManualTap: () => {
          set((state) => {
            const now = Date.now();
            const recentTaps = state.recentManualTaps || [];

            // Keep only taps from the last second
            const oneSecondAgo = now - 1000;
            const filteredTaps = recentTaps.filter(
              (timestamp) => timestamp > oneSecondAgo
            );

            // Add current tap
            const newTaps = [...filteredTaps, now];

            // Debug logging
            console.log("Manual tap added:", {
              now,
              recentTaps: recentTaps.length,
              filteredTaps: filteredTaps.length,
              newTaps: newTaps.length,
              manualTapsPerSecond: newTaps.length,
            });

            return {
              ...state,
              manualTaps: state.manualTaps + 1,
              manualTapsPerSecond: newTaps.length,
              recentManualTaps: newTaps,
            };
          });
        },

        // Cleanup old manual taps periodically
        cleanupManualTaps: () => {
          set((state) => {
            const now = Date.now();
            const recentTaps = state.recentManualTaps || [];
            const oneSecondAgo = now - 1000;
            const filteredTaps = recentTaps.filter(
              (timestamp) => timestamp > oneSecondAgo
            );

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
                return u;
              });
            }

            return {
              ...state,
              taps: state.taps - cost,
              upgrades: updatedUpgrades,
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

        // Computed values
        getTotalTapsPerSecond: () => {
          const state = get();
          return state.upgrades
            .filter((u) => u.effect.type === "autoTap")
            .reduce((total, upgrade) => {
              return total + upgrade.effect.value * upgrade.level;
            }, 0);
        },

        getTotalTapMultiplier: () => {
          const state = get();
          return state.upgrades
            .filter((u) => u.effect.type === "tapMultiplier")
            .reduce((total, upgrade) => {
              return total + upgrade.effect.value * upgrade.level;
            }, 1);
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

// Auto-tap effect
let autoTapInterval: NodeJS.Timeout | null = null;

export const startAutoTap = () => {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
  }

  autoTapInterval = setInterval(() => {
    const store = useGameStore.getState();

    // Check if game is paused
    if (store.isPaused) {
      return;
    }

    const tapsPerSecond = store.getTotalTapsPerSecond();
    if (tapsPerSecond > 0) {
      store.addTaps(tapsPerSecond);

      // Trigger tap effects for auto-taps (with limit to prevent spam)
      if ((window as any).createTapParticles) {
        const tapCount = Math.min(tapsPerSecond, 5); // Limit to 5 particles max
        for (let i = 0; i < tapCount; i++) {
          setTimeout(() => {
            (window as any).createTapParticles(-1, 0.5, -1, 1);
          }, i * 100); // Stagger the particles
        }
      }
    }
  }, 1000);
};

export const stopAutoTap = () => {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
    autoTapInterval = null;
  }
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

  console.log("Store migration completed");
};
