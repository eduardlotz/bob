import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "./indexedDB";

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: number;
  completed: boolean;
  routeId: string;
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
    id: "about_quest_1",
    title: "Mein Arbeitsplatz",
    description: "Klick auf den Schreibtisch",
    progress: 0,
    maxProgress: 30,
    reward: 500,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_desk",
      value: 50,
    },
  },
  {
    id: "about_quest_2",
    title: "Meine Bücher",
    description: "Klick auf die Bücher",
    progress: 0,
    maxProgress: 25,
    reward: 500,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_books",
      value: 25,
    },
  },
  {
    id: "about_quest_3",
    title: "Meine Interessen",
    description: "Klick auf den Karton",
    progress: 0,
    maxProgress: 25,
    reward: 500,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_box",
      value: 25,
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
