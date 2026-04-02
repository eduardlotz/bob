import { initialQuests } from "@/store/config/quests";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "@/store/indexedDB";
import { useCoreStore } from "../store";
import {
  QUESTS_STORE_VERSION,
  createDefaultQuestState,
  migrateQuestStore,
} from "./migrations";
import type { Quest, QuestStore } from "./types";
import {
  applyQuestReward,
  emitQuestCompletionToastOnce,
  getPersistedCompletionToastKeys,
} from "./utils";

const cloneInitialQuests = () => initialQuests.map((quest) => ({ ...quest }));

const getResetQuestState = () => ({
  quests: cloneInitialQuests(),
  activeQuests: [],
  notifiedCompletionKeys: [],
});

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      ...createDefaultQuestState(),

      isHydrated: false,

      addQuest: (quest) =>
        set((state) => ({
          quests: [...state.quests, quest],
        })),

      updateQuestProgress: (questId, progress) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId
              ? { ...quest, progress: Math.min(progress, quest.maxProgress) }
              : quest,
          ),
        })),

      completeQuest: (questId) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId ? { ...quest, completed: true } : quest,
          ),
        })),

      triggerQuestAction: (action, value = 1, routeId) => {
        const { addTaps, purchaseBobItem } = useCoreStore.getState();
        const relevantQuests = get().quests.filter(
          (quest) =>
            !quest.completed &&
            quest.trigger?.action === action &&
            (routeId
              ? quest.routeId
                ? quest.routeId === routeId
                : true
              : true),
        );

        relevantQuests.forEach((quest) => {
          const progressIncrement = value ?? quest.trigger?.value ?? 1;
          const newProgress = Math.min(
            quest.progress + progressIncrement,
            quest.maxProgress,
          );
          const isCompleted = newProgress >= quest.maxProgress;

          set((state) => ({
            quests: state.quests.map((currentQuest) =>
              currentQuest.id === quest.id
                ? {
                    ...currentQuest,
                    progress: newProgress,
                    completed: isCompleted ? true : currentQuest.completed,
                  }
                : currentQuest,
            ),
          }));

          if (isCompleted) {
            applyQuestReward(quest, {
              addTaps,
              purchaseBobItem,
            });
            emitQuestCompletionToastOnce(quest, () => get(), set);
          }
        });
      },

      syncQuestProgressFromMetric: (action, absoluteValue) => {
        const safeValue = Math.max(0, absoluteValue);
        const currentQuests = get().quests;
        const justCompletedQuests: Quest[] = [];

        let changed = false;
        const updatedQuests = currentQuests.map((quest) => {
          if (quest.trigger?.action !== action) {
            return quest;
          }

          const nextProgress = quest.completed
            ? quest.maxProgress
            : Math.min(safeValue, quest.maxProgress);
          const nextCompleted = quest.completed || nextProgress >= quest.maxProgress;

          if (
            !quest.completed &&
            nextCompleted &&
            quest.progress < quest.maxProgress
          ) {
            justCompletedQuests.push(quest);
          }

          if (
            quest.progress === nextProgress &&
            quest.completed === nextCompleted
          ) {
            return quest;
          }

          changed = true;
          return {
            ...quest,
            progress: nextProgress,
            completed: nextCompleted,
          };
        });

        if (changed) {
          set({
            quests: updatedQuests,
          });
        }

        if (justCompletedQuests.length > 0) {
          const { addTaps, purchaseBobItem } = useCoreStore.getState();

          justCompletedQuests.forEach((quest) => {
            applyQuestReward(quest, {
              addTaps,
              purchaseBobItem,
            });
            emitQuestCompletionToastOnce(quest, () => get(), set);
          });
        }
      },

      getQuestsByRoute: (routeId) => {
        const state = get();
        return state.quests.filter((quest) => quest.routeId === routeId);
      },

      setActiveQuests: (routeId) => {
        const state = get();
        const routeQuests = state.quests.filter(
          (quest) => quest.routeId === routeId,
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
          ...getResetQuestState(),
        })),

      resetAllQuests: () =>
        set(() => ({
          ...getResetQuestState(),
        })),

      unlockAllQuests: () =>
        set((state) => {
          const quests = state.quests.map((quest) => ({
            ...quest,
            progress: quest.maxProgress,
            completed: true,
            hiddenUntilCompleted: false,
          }));

          return {
            quests,
            notifiedCompletionKeys: getPersistedCompletionToastKeys(quests),
          };
        }),
    }),
    {
      name: "quest-store",
      version: QUESTS_STORE_VERSION.LATEST,
      storage: createIndexedDBStorage<QuestStore>(),
      partialize: (state) =>
        ({
          quests: state.quests,
          activeQuests: state.activeQuests,
          notifiedCompletionKeys: state.notifiedCompletionKeys,
        }) as QuestStore,
      migrate: (persisted: any, fromVersion: number) =>
        migrateQuestStore(persisted, fromVersion || 0),
      onRehydrateStorage: () => (state?: QuestStore) => {
        if (!state) return;
        useQuestStore.setState({ isHydrated: true });
      },
    },
  ),
);
