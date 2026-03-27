import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "../indexedDB";
import { ROUTE_IDS } from "../config/routes";
import { useCoreStore } from "./store";
import { sileo } from "sileo";
import { getLocale } from "@/i18n";
import { getQuestCopy, type QuestMessageId } from "./quests.messages";
import { createQuestToastIcon } from "@/components/QuestTrophyIcon";

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
  color: string;
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
  showProgress?: boolean;
  hiddenUntilCompleted?: boolean;
  stackId?: string;
  stackOrder?: number;
  stackTitle?: string;
  stackDescription?: string;
}

export interface QuestStore {
  version: number;
  quests: Quest[];
  activeQuests: string[];
  addQuest: (quest: Quest) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  triggerQuestAction: (action: string, value?: number) => void;
  syncQuestProgressFromMetric: (action: string, absoluteValue: number) => void;
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
  V6 = 1000005, // expanded progression quests
  V7 = 1000006, // quest stacks + colorized cards
  LATEST = V7,
}

const mergeQuestLists = (currentQuests: Quest[], defaultQuests: Quest[]) => {
  const defaultQuestById = new Map(
    defaultQuests.map((quest) => [quest.id, quest]),
  );
  const mergedQuests = currentQuests.map((quest) => {
    const defaults = defaultQuestById.get(quest.id);
    if (!defaults) {
      return quest;
    }

    return {
      ...defaults,
      ...quest,
    };
  });
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

  if (fromVersion < QUESTS_STORE_VERSION.V7) {
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
    color: "#7B5CFF",
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
  {
    id: "about_quest_2",
    title: "Sul Sul!",
    description: "Finde den Plumbob 🕵",
    icon: "💎",
    color: "#C45B9F",
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
    color: "#5C8BFF",
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
    id: "about_books_shelf_3",
    title: "Bücherwurm",
    description: "Schau dir mehrere Bücher in der Sammlung an",
    icon: "📚",
    color: "#3E8C7A",
    progress: 0,
    maxProgress: 3,
    reward: {
      type: "taps_reward",
      amount: 3500,
    },
    completed: false,
    routeId: ROUTE_IDS.ABOUT,
    type: "interaction",
    trigger: {
      action: "click_books",
      value: 1,
    },
    showProgress: true,
  },
  {
    id: "manual_taps_50",
    title: "Finger warmtippen",
    description: "Tippe 50 Mal selbst",
    icon: "🖐️",
    color: "#E07A4F",
    progress: 0,
    maxProgress: 50,
    reward: {
      type: "taps_reward",
      amount: 1000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "tap",
    trigger: {
      action: "manual_taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "manual_taps",
    stackOrder: 1,
    stackTitle: "Manual Tap Milestones",
    stackDescription: "Build up your own tapping stamina.",
  },
  {
    id: "manual_taps_100",
    title: "Klickmaschine",
    description: "Tippe 100 Mal selbst",
    icon: "✋",
    color: "#E38B53",
    progress: 0,
    maxProgress: 100,
    reward: {
      type: "taps_reward",
      amount: 2500,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "tap",
    trigger: {
      action: "manual_taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "manual_taps",
    stackOrder: 2,
    stackTitle: "Manual Tap Milestones",
    stackDescription: "Build up your own tapping stamina.",
  },
  {
    id: "manual_taps_1000",
    title: "1000er Club",
    description: "Tippe 1000 Mal selbst",
    icon: "🔥",
    color: "#D9654A",
    progress: 0,
    maxProgress: 1000,
    reward: {
      type: "taps_reward",
      amount: 15000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "tap",
    trigger: {
      action: "manual_taps_total",
      value: 1,
    },
    showProgress: true,
    hiddenUntilCompleted: true,
    stackId: "manual_taps",
    stackOrder: 3,
    stackTitle: "Manual Tap Milestones",
    stackDescription: "Build up your own tapping stamina.",
  },
  {
    id: "total_taps_1000",
    title: "Vierstellig",
    description: "Erreiche insgesamt 1.000 Taps",
    icon: "🔢",
    color: "#5F6BDA",
    progress: 0,
    maxProgress: 1000,
    reward: {
      type: "taps_reward",
      amount: 4000,
    },
    completed: false,
    type: "tap",
    trigger: {
      action: "taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "total_taps",
    stackOrder: 1,
    stackTitle: "Total Tap Milestones",
    stackDescription: "Reach long-term lifetime tap goals.",
  },
  {
    id: "total_taps_10000",
    title: "Fünfstellig",
    description: "Erreiche insgesamt 10.000 Taps",
    icon: "💯",
    color: "#5660D0",
    progress: 0,
    maxProgress: 10000,
    reward: {
      type: "taps_reward",
      amount: 20000,
    },
    completed: false,
    type: "tap",
    trigger: {
      action: "taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "total_taps",
    stackOrder: 2,
    stackTitle: "Total Tap Milestones",
    stackDescription: "Reach long-term lifetime tap goals.",
  },
  {
    id: "total_taps_1000000",
    title: "Millionär",
    description: "Erreiche insgesamt 1.000.000 Taps",
    icon: "🪙",
    color: "#A85BD2",
    progress: 0,
    maxProgress: 1000000,
    reward: {
      type: "taps_reward",
      amount: 250000,
    },
    completed: false,
    type: "tap",
    trigger: {
      action: "taps_total",
      value: 1,
    },
    showProgress: true,
    hiddenUntilCompleted: true,
    stackId: "total_taps",
    stackOrder: 3,
    stackTitle: "Total Tap Milestones",
    stackDescription: "Reach long-term lifetime tap goals.",
  },
  {
    id: "shop_buy_bob_item_1",
    title: "Neuer Fit",
    description: "Kaufe ein Bob-Item im Shop",
    icon: "🧢",
    color: "#5BA85E",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 5000,
    },
    completed: false,
    type: "custom",
    trigger: {
      action: "shop_buy_bob_item",
      value: 1,
    },
  },
  {
    id: "shop_buy_tap_effect_1",
    title: "Effektvoll",
    description: "Kauf einen Tap-Effekt im Shop",
    icon: "✨",
    color: "#44A69A",
    progress: 1,
    maxProgress: 2,
    reward: {
      type: "taps_reward",
      amount: 5000,
    },
    completed: false,
    type: "custom",
    trigger: {
      action: "shop_buy_tap_effect",
      value: 1,
    },
  },
  {
    id: "shop_buy_world_1",
    title: "Weltentdecker",
    description: "Kaufe eine Welt im Shop",
    icon: "🌍",
    color: "#4A8E6A",
    progress: 1,
    maxProgress: 2,
    reward: {
      type: "taps_reward",
      amount: 12000,
    },
    completed: false,
    type: "custom",
    trigger: {
      action: "shop_buy_world",
      value: 1,
    },
    hiddenUntilCompleted: true,
  },
  {
    id: "playtime_60s",
    title: "Kurze Session",
    description: "Spiele insgesamt 1 Minute",
    icon: "⏱️",
    color: "#D99844",
    progress: 0,
    maxProgress: 60,
    reward: {
      type: "taps_reward",
      amount: 2500,
    },
    completed: false,
    type: "time",
    trigger: {
      action: "playtime_seconds",
      value: 1,
    },
    showProgress: true,
    stackId: "playtime",
    stackOrder: 1,
    stackTitle: "Playtime Milestones",
    stackDescription: "Stay in the game to unlock endurance rewards.",
  },
  {
    id: "playtime_600s",
    title: "Langstrecke",
    description: "Spiele insgesamt 10 Minuten",
    icon: "⌛",
    color: "#CC7A35",
    progress: 0,
    maxProgress: 600,
    reward: {
      type: "taps_reward",
      amount: 15000,
    },
    completed: false,
    type: "time",
    trigger: {
      action: "playtime_seconds",
      value: 1,
    },
    showProgress: true,
    hiddenUntilCompleted: true,
    stackId: "playtime",
    stackOrder: 2,
    stackTitle: "Playtime Milestones",
    stackDescription: "Stay in the game to unlock endurance rewards.",
  },
  {
    id: "minigames_flappy_points_10",
    title: "Flappy Bobbie",
    description: "Erziele 10 Punkte im Flappy Bird Minigame",
    icon: "🐦",
    color: "#4BA7F2",
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
    color: "#C86BCE",
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
    color: "#F0A44B",
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
              icon: createQuestToastIcon(quest.id, quest.color),
              fill: "#111324",
              styles: {
                badge: "toast-badge",
                title: "quest-toast-title",
                description: "quest-toast-desc",
              },
            });
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

          const nextProgress = Math.min(safeValue, quest.maxProgress);
          const nextCompleted = nextProgress >= quest.maxProgress;

          if (!quest.completed && nextCompleted) {
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
              icon: createQuestToastIcon(quest.id, quest.color),
              fill: "#111324",
              styles: {
                badge: "toast-badge",
                title: "quest-toast-title",
                description: "quest-toast-desc",
              },
            });
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
          quests: initialQuests.map((quest) => ({ ...quest })),
          activeQuests: [],
        })),

      resetAllQuests: () =>
        set(() => ({
          quests: initialQuests.map((quest) => ({ ...quest })),
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
