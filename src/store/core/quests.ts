import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "../indexedDB";
import { ROUTE_IDS } from "../config/routes";
import { useCoreStore } from "./store";
import { sileo } from "sileo";
import { getLocale } from "@/i18n";
import { getQuestCopy, type QuestMessageId } from "./quests.messages";

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
  triggerQuestAction: (action: string, value?: number) => void;
  getQuestsByRoute: (routeId: string) => Quest[];
  setActiveQuests: (routeId: string) => void;
  clearActiveQuests: () => void;
  resetQuests: () => void;
  resetAllQuests: () => void;
}

export enum QUESTS_STORE_VERSION {
  V0 = 0,
  V1 = 1000000, // version 1.00.00
  V2 = 1000001, // version 1.00.01
  V3 = 1000002, // version 1.00.01
  V4 = 1000003, // version 1.00.02
  V5 = 1000004, // socials fun facts unlock quests
  LATEST = V5,
}

const mergeQuestLists = (currentQuests: Quest[], defaultQuests: Quest[]) => {
  const mergedQuests = [...currentQuests];
  const knownQuestIds = new Set(mergedQuests.map((quest) => quest.id));

  defaultQuests.forEach((quest) => {
    if (!knownQuestIds.has(quest.id)) {
      mergedQuests.push(quest);
    }
  });

  return mergedQuests;
};

function migrateStore(oldState: any, fromVersion: number): any {
  console.log(
    `Quests Migration triggered: oldversion=${fromVersion}, migration version=${QUESTS_STORE_VERSION.LATEST}`,
  );

  let migratedState = { ...oldState };

  // initial migration: reset all defaults
  if (fromVersion < QUESTS_STORE_VERSION.V0) {
    migratedState = initialQuests;
  }

  // new quests added: /creative + /minigames
  if (fromVersion < QUESTS_STORE_VERSION.V2) {
    migratedState = { ...migratedState, initialQuests };
  }

  // remove too easy quests
  if (fromVersion < QUESTS_STORE_VERSION.V3) {
    migratedState = initialQuests;
  }

  // minigames quest refresh
  if (fromVersion < QUESTS_STORE_VERSION.V4) {
    migratedState = initialQuests;
  }

  const normalizedState = Array.isArray(migratedState)
    ? { quests: migratedState, activeQuests: [] }
    : { ...migratedState };

  if (fromVersion < QUESTS_STORE_VERSION.V5) {
    normalizedState.quests = mergeQuestLists(
      normalizedState.quests ?? [],
      initialQuests,
    );
  }

  normalizedState.version = QUESTS_STORE_VERSION.LATEST;
  return normalizedState;
}

const initialQuests: Quest[] = [
  {
    id: "auto_tap_milestone_1",
    title: "Passives Einkommen",
    description: "Kauf deine ersten Auto-Tap upgrades",
    icon: "🔁",
    progress: 0,
    maxProgress: 2,
    reward: {
      type: "taps_reward",
      amount: 0,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "interaction",
    trigger: {
      action: "auto_tap_level",
      value: 1,
    },
  },
  // {
  //   id: "tap_multilier_milestone_1",
  //   title: "Double it and give it to me",
  //   description: "Kauf dein erstes Multiplikator Upgrade",
  //   icon: "🙌",
  //   progress: 0,
  //   maxProgress: 1,
  //   reward: {
  //     type: "taps_reward",
  //     amount: 0,
  //   },
  //   completed: false,
  //   routeId: ROUTE_IDS.HOME,
  //   type: "interaction",
  //   trigger: {
  //     action: "tap_multiplier_level",
  //     value: 1,
  //   },
  // },
  // {
  //   id: "about_quest_1",
  //   title: "Kennlernphase",
  //   description: "Schalte die “Über Mich”-Seite frei",
  //   icon: "👤",
  //   progress: 0,
  //   maxProgress: 1,
  //   reward: {
  //     type: "taps_reward",
  //     amount: 1000,
  //   },
  //   completed: false,
  //   type: "interaction",
  //   trigger: {
  //     action: `purchase_route_about`,
  //     value: 1,
  //   },
  // },
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
    routeId: ROUTE_IDS.ABOUT,
    type: "interaction",
    trigger: {
      action: "click_plumbob",
      value: 1,
    },
  },
  {
    id: "portfolio_quest_1",
    title: "Weltraumspaziergang",
    description: "Schau dir ein paar meiner kreativen Arbeiten an",
    icon: "✨",
    progress: 0,
    maxProgress: 5,
    reward: {
      type: "taps_reward",
      amount: 15000,
    },
    completed: false,
    routeId: ROUTE_IDS.PORTFOLIO,
    type: "interaction",
    trigger: {
      action: "click_portfolio_item",
      value: 1,
    },
  },
  {
    id: "minigames_flappy_points_10",
    title: "Flappy Bobbie",
    description: "Erziele 10 Punkte im Flappy Bird Minigame",
    icon: "🐦",
    progress: 0,
    maxProgress: 10,
    reward: {
      type: "taps_reward",
      amount: 10000,
    },
    completed: false,
    // routeId: ROUTE_IDS.MINIGAMES, // FIX: not working with route
    type: "interaction",
    trigger: {
      action: "minigames_flappy_score",
      value: 1,
    },
  },
  {
    id: "minigames_slot_spins_15",
    title: "Spielsüchtig",
    description: "Benutze den Slotautomaten 15 Mal",
    icon: "🎰",
    progress: 0,
    maxProgress: 15,
    reward: {
      type: "taps_reward",
      amount: 10000,
    },
    completed: false,
    // routeId: ROUTE_IDS.MINIGAMES, // FIX: not working with route
    type: "interaction",
    trigger: {
      action: "minigames_slot_spin",
      value: 1,
    },
  },
  {
    id: "minigames_slot_wins_5",
    title: "Alles wieder reingeholt",
    description: "Gewinne am Slotautomaten",
    icon: "🏆",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 10000,
    },
    completed: false,
    // routeId: ROUTE_IDS.MINIGAMES, // FIX: not working with route
    type: "interaction",
    trigger: {
      action: "minigames_slot_win",
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
              : quest,
          ),
        })),

      completeQuest: (questId) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId ? { ...quest, completed: true } : quest,
          ),
        })),

      triggerQuestAction: (action, value = 1) => {
        const { addTaps, purchaseBobItem } = useCoreStore.getState();
        const relevantQuests = get().quests.filter(
          (quest) => !quest.completed && quest.trigger?.action === action,
        );

        relevantQuests.forEach((quest) => {
          const progressIncrement = value || quest.trigger?.value || 1;
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
            quest.reward.type === "taps_reward"
              ? addTaps(quest.reward.amount as number)
              : purchaseBobItem(quest.reward.amount as string, true);

            const questCopy = getQuestCopy(
              quest.id as QuestMessageId,
              getLocale(),
            );

            sileo.success({
              title: questCopy?.title ?? `${quest.title}`,
              description: questCopy?.description ?? quest.description,
            });
          }
        });
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
          quests: initialQuests,
          activeQuests: [],
        })),

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
        }) as QuestStore,
      migrate: (persisted: any, fromVersion: number) => {
        if (!persisted) return initialQuests;

        return migrateStore(persisted, fromVersion || 0);
      },
    },
  ),
);

const questMessageMap = {
  auto_tap_milestone_1: true,
  about_quest_2: true,
  portfolio_quest_1: true,
  minigames_flappy_points_10: true,
  minigames_slot_spins_15: true,
  minigames_slot_wins_5: true,
} as const;
