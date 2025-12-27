import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "./indexedDB";
import { ROUTE_IDS } from "./routeConfig";

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
    title: "Die erste Investition",
    description: "Double it and give it to me",
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
    description: "Schnapp dir dein Plumbob!",
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
];

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
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
      version: 1,
      storage: createIndexedDBStorage<QuestStore>(),
      partialize: (state) =>
        ({
          quests: state.quests,
          activeQuests: state.activeQuests,
        } as QuestStore),
      onRehydrateStorage: (state) => {
        console.log("rehydrating quest store:", state);
        import("./migration")
          .then((m) => m.queueStorageMigration())
          .catch((e) => console.error("Failed to queue storage migration", e));
      },
    }
  )
);
