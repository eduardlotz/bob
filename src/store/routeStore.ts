import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROUTE_IDS } from "./routeConfig";
import { THEME_CONFIG } from "./upgradesConfig";
import { Theme } from "./gameStore";
import { THEME_IDS } from "./themeConfig";
import { checkAndMigrate } from "./migration";

export interface RouteConfig {
  id: string;
  outfit?: {
    path: string;
    scale?: number;
    position?: [number, number, number];
  };
  quests: string[]; // Quest IDs for this route
}

export interface RouteStore {
  routeConfigs: RouteConfig[];
  getRouteConfig: (routeId: string) => RouteConfig | undefined;
  getOutfit: (routeId: string) => RouteConfig["outfit"];
}

// Route-specific configurations
const routeConfigs: RouteConfig[] = [
  {
    id: ROUTE_IDS.HOME,
    quests: [],
  },
  {
    id: ROUTE_IDS.ABOUT,
    quests: ["about_quest_1", "about_quest_2", "about_quest_3"],
  },
  {
    id: ROUTE_IDS.PORTFOLIO,
    outfit: {
      path: "/models/portfolio_outfit.glb",
      scale: 1.2,
      position: [0, 0, 0],
    },
    quests: ["portfolio_quest_1", "portfolio_quest_2", "portfolio_quest_3"],
  },
  {
    id: ROUTE_IDS.CREATIVE,
    outfit: {
      path: "/models/creative_outfit.glb",
      scale: 1.0,
      position: [0, 0, 0],
    },
    quests: ["creative_quest_1", "creative_quest_2"],
  },
  {
    id: ROUTE_IDS.TECHNICAL,
    outfit: {
      path: "/models/technical_outfit.glb",
      scale: 1.1,
      position: [0, 0, 0],
    },
    quests: ["technical_quest_1", "technical_quest_2"],
  },
  {
    id: ROUTE_IDS.GUESTBOOK,
    outfit: {
      path: "/models/guestbook_outfit.glb",
      scale: 0.9,
      position: [0, 0, 0],
    },
    quests: ["guestbook_quest_1", "guestbook_quest_2"],
  },
];

export const useRouteStore = create<RouteStore>()(
  persist(
    (set, get) => ({
      routeConfigs,

      getRouteConfig: (routeId) => {
        const state = get();
        return state.routeConfigs.find((config) => config.id === routeId);
      },

      getOutfit: (routeId) => {
        const state = get();
        const config = state.routeConfigs.find((c) => c.id === routeId);
        return config?.outfit;
      },
    }),
    {
      name: "route-store",
      version: 2,
      partialize: (state) => ({
        routeConfigs: state.routeConfigs,
      }),
      onRehydrateStorage: (state) => {
        console.log("Route store rehydrated:", state);
        // Check for migration after store is loaded
        checkAndMigrate().catch(console.error);
      },
    }
  )
);
