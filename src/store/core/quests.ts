import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "../indexedDB";
import { ROUTE_IDS } from "../config/routes";

type RewardType = "taps_reward" | "item_reward";
type RewardId = string;

interface QuestReward {
  type: RewardType;
  amount: RewardId | number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  reward: QuestReward;
  completed: boolean;
  routeId?: string;
  type: "interaction" | "tap" | "time" | "custom"; // TODO: expand store with hooks for diff types
  trigger?: {
    action: string;
    value?: any;
  };
}

export interface QuestStore {
  version: number;
  quests: Quest[];
  activeQuests: string[];
  addQuest: (quest: Quest) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  getQuestsByRoute: (routeId: string) => Quest[];
  setActiveQuests: (routeId: string) => void;
  clearActiveQuests: () => void;
  resetQuests: () => void;
  resetAllQuests: () => void;
}

export enum QUESTS_STORE_VERSION {
  V0 = 0,
  V1 = 1000000, // version 1.00.00
  LATEST = V1,
}

function migrateStore(oldState: any, fromVersion: number): any {
  console.log(
    `Quests Migration triggered: oldversion=${fromVersion}, migration version=${QUESTS_STORE_VERSION.LATEST}`
  );

  let migratedState = { ...oldState };

  // initial migration: reset all defaults
  if (fromVersion < QUESTS_STORE_VERSION.V0) {
    migratedState = initialQuests;
  }

  // new quests added: /creative
  // if (fromVersion < QUESTS_STORE_VERSION.V1) {
  //   const newQuests = initialQuests
  //   migratedState.push(newQuests)
  // }

  migratedState.version = QUESTS_STORE_VERSION.LATEST;
  return migratedState;
}

const initialQuests: Quest[] = [
  {
    id: "auto_tap_milestone_1",
    title: "Passives Einkommen",
    description: "Komm in die Auto-Tap Gruppe 🔁🫵",
    icon: "🔁",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "item_reward",
      amount: "chickenLittleGlasses",
    },
    completed: false,
    routeId: "route_home",
    type: "interaction",
    trigger: {
      action: "auto_tap_level",
      value: 1,
    },
  },
  {
    id: "tap_multilier_milestone_1",
    title: "Double it and give it to me",
    description: "Kauf dein erstes Multiplikator Upgrade",
    icon: "🙌",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 0,
    },
    completed: false,
    routeId: "route_home",
    type: "interaction",
    trigger: {
      action: "tap_multiplier_level",
      value: 1,
    },
  },
  {
    id: "about_quest_1",
    title: "Kennlernphase",
    description: "Schalte die “Über Mich”-Seite frei",
    icon: "👤",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 500,
    },
    completed: false,
    // routeId: "route_home",
    type: "interaction",
    trigger: {
      action: `purchase_route_about`,
      value: 1,
    },
  },
  {
    id: "about_quest_2",
    title: "Sul Sul!",
    description: "Finde den Plumbob 🕵",
    icon: "💎",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "item_reward",
      amount: "simsPlumbob",
    },
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_plumbob",
      value: 1,
    },
  },
  {
    id: "creative_quest_1",
    title: "Kunst im All",
    description: "Schau dir ein paar meiner kreativen Arbeiten an",
    icon: "✨",
    progress: 0,
    maxProgress: 3,
    reward: {
      type: "taps_reward",
      amount: 3000,
    },
    completed: false,
    routeId: "route_creative",
    type: "interaction",
    trigger: {
      action: "click_creative_image",
      value: 1,
    },
  },
];

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      version: QUESTS_STORE_VERSION.LATEST,
      quests: initialQuests,
      activeQuests: [],

      addQuest: (quest) =>
        set((state) => ({
          quests: [...state.quests, quest],
        })),

      updateQuestProgress: (questId, progress) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId
              ? { ...quest, progress: Math.min(progress, quest.maxProgress) }
              : quest
          ),
        })),

      completeQuest: (questId) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId ? { ...quest, completed: true } : quest
          ),
        })),

      getQuestsByRoute: (routeId) => {
        const state = get();
        return state.quests.filter((quest) => quest.routeId === routeId);
      },

      setActiveQuests: (routeId) => {
        const state = get();
        const routeQuests = state.quests.filter(
          (quest) => quest.routeId === routeId
        );
        const questIds = routeQuests.map((quest) => quest.id);

        set(() => ({
          activeQuests: questIds,
        }));
      },

      clearActiveQuests: () =>
        set(() => ({
          activeQuests: [],
        })),

      resetQuests: () =>
        set(() => ({
          quests: initialQuests,
          activeQuests: [],
        })),

      // Reset quests for testing - clears all progress
      resetAllQuests: () =>
        set(() => ({
          quests: initialQuests.map((quest) => ({
            ...quest,
            progress: 0,
            completed: false,
          })),
          activeQuests: [],
        })),
    }),
    {
      name: "quest-store",
      version: QUESTS_STORE_VERSION.LATEST,
      storage: createIndexedDBStorage<QuestStore>(),
      partialize: (state) =>
        ({
          quests: state.quests,
          activeQuests: state.activeQuests,
        } as QuestStore),
      migrate: (persisted: any, fromVersion: number) => {
        if (!persisted) return initialQuests;

        return migrateStore(persisted, fromVersion || 0);
      },
    }
  )
);
