import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "../indexedDB";
import { ROUTE_IDS } from "../config/routes";
import { useCoreStore } from "./store";
import { sileo } from "sileo";
import { getLocale, type Locale } from "@/i18n";
import {
  getQuestCopy,
  getQuestStackCopy,
  type QuestMessageId,
  type QuestStackMessageId,
} from "./quests.messages";
import { createQuestToastIcon } from "@/components/QuestTrophyIcon";

type RewardType = "taps_reward" | "item_reward";
type RewardId = string;
export type QuestProgressionKind = "milestone" | "goal" | "trigger";
export const SHOP_ITEMS_QUEST_STACK_ID = "shop_item_categories";
export const ABOUT_TOUR_STACK_ID = "about_tour";
const STACK_COMPLETION_TOAST_IDS = new Set([
  SHOP_ITEMS_QUEST_STACK_ID,
  ABOUT_TOUR_STACK_ID,
]);

interface QuestReward {
  type: RewardType;
  amount: RewardId | number;
}

export type QuestCompletionToastMeta = {
  toastKey: string;
  title: string;
  description: string;
  color: string;
  icon: string;
};

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
  reward?: QuestReward;
  completed: boolean;
  routeId?: string;
  type: "interaction" | "tap" | "time" | "custom"; // TODO: expand store with hooks for diff types
  progressionKind?: QuestProgressionKind;
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
  isHydrated: boolean;
  notifiedCompletionKeys: string[];
  addQuest: (quest: Quest) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  triggerQuestAction: (action: string, value?: number, routeId?: string) => void;
  syncQuestProgressFromMetric: (action: string, absoluteValue: number) => void;
  getQuestsByRoute: (routeId: string) => Quest[];
  setActiveQuests: (routeId: string) => void;
  clearActiveQuests: () => void;
  resetQuests: () => void;
  resetAllQuests: () => void;
  unlockAllQuests: () => void;
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
  V8 = 1000007, // badge/progression schema refresh
  V9 = 1000008, // unhide milestone stacks + quest presentation refresh
  V10 = 1000009, // upgrade quest refresh + hydration guards
  V11 = 1000010, // completion toast dedupe + expanded quests
  V12 = 1000011, // hydrated quest sync + persisted completion dedupe
  V13 = 1000012, // route-aware minigame fixes + quest rebalance refresh
  V14 = 1000013, // quest toast stack rules + quest cadence rebalance
  LATEST = V14,
}

export const hasQuestReward = (quest: Pick<Quest, "reward">): boolean => {
  if (!quest.reward) {
    return false;
  }

  if (quest.reward.type === "taps_reward") {
    return (Number(quest.reward.amount) || 0) > 0;
  }

  return String(quest.reward.amount || "").trim().length > 0;
};

export const shouldShowQuestCompletionToast = (
  quest: Pick<Quest, "stackId">,
  quests: Array<Pick<Quest, "stackId" | "completed">>,
): boolean => {
  if (!quest.stackId || !STACK_COMPLETION_TOAST_IDS.has(quest.stackId)) {
    return true;
  }

  const stackQuests = quests.filter((entry) => entry.stackId === quest.stackId);

  return (
    stackQuests.length > 0 && stackQuests.every((entry) => entry.completed)
  );
};

const getStackToastPresentation = (stackId: string) => {
  if (stackId === SHOP_ITEMS_QUEST_STACK_ID) {
    return {
      color: "#6B8BFF",
      icon: "🛍️",
      fallbackTitle: "Shop Collector",
      fallbackDescription: "Buy one item from each shop category.",
    };
  }

  if (stackId === ABOUT_TOUR_STACK_ID) {
    return {
      color: "#4A8CCF",
      icon: "🧭",
      fallbackTitle: "About Tour",
      fallbackDescription: "Explore the interactive objects in the About room.",
    };
  }

  return {
    color: "#6B8BFF",
    icon: "🏆",
    fallbackTitle: "Quest Completed",
    fallbackDescription: "You completed a quest stack.",
  };
};

export const getQuestCompletionToastMeta = (
  quest: Pick<
    Quest,
    "id" | "title" | "description" | "color" | "icon" | "stackId"
  >,
  quests: Array<Pick<Quest, "stackId" | "completed">>,
  locale: Locale = getLocale(),
): QuestCompletionToastMeta | null => {
  if (!shouldShowQuestCompletionToast(quest, quests)) {
    return null;
  }

  if (quest.stackId && STACK_COMPLETION_TOAST_IDS.has(quest.stackId)) {
    const toastPresentation = getStackToastPresentation(quest.stackId);
    const stackCopy = getQuestStackCopy(
      quest.stackId as QuestStackMessageId,
      locale,
    );

    return {
      toastKey: quest.stackId,
      title: stackCopy?.title ?? toastPresentation.fallbackTitle,
      description:
        stackCopy?.description ?? toastPresentation.fallbackDescription,
      color: toastPresentation.color,
      icon: toastPresentation.icon,
    };
  }

  const questCopy = getQuestCopy(quest.id as QuestMessageId, locale);

  return {
    toastKey: quest.id,
    title: questCopy?.title ?? quest.title,
    description: questCopy?.description ?? quest.description,
    color: quest.color,
    icon: quest.icon,
  };
};

const applyQuestReward = (
  quest: Pick<Quest, "reward">,
  coreStore: Pick<
    ReturnType<typeof useCoreStore.getState>,
    "addTaps" | "purchaseBobItem"
  >,
) => {
  if (!hasQuestReward(quest) || !quest.reward) {
    return;
  }

  if (quest.reward.type === "taps_reward") {
    const amount = Number(quest.reward.amount) || 0;
    if (amount > 0) {
      coreStore.addTaps(amount);
    }
    return;
  }

  const itemId = String(quest.reward.amount || "");
  if (itemId) {
    coreStore.purchaseBobItem(itemId, true);
  }
};

const sendQuestCompletionToast = (toastMeta: QuestCompletionToastMeta) => {
  sileo.success({
    title: toastMeta.title,
    description: toastMeta.description,
    icon: createQuestToastIcon(
      toastMeta.toastKey,
      toastMeta.color,
      toastMeta.icon,
    ),
    fill: "#111324",
    styles: {
      badge: "toast-badge",
      title: "quest-toast-title",
      description: "quest-toast-desc",
    },
  });
};

const emitQuestCompletionToastOnce = (
  quest: Pick<
    Quest,
    "id" | "title" | "description" | "color" | "icon" | "stackId"
  >,
  getQuestState: () => Pick<QuestStore, "quests" | "notifiedCompletionKeys">,
  setQuestState: (
    updater: (
      state: QuestStore,
    ) => Partial<Pick<QuestStore, "notifiedCompletionKeys">>,
  ) => void,
) => {
  const latestState = getQuestState();
  const toastMeta = getQuestCompletionToastMeta(
    quest,
    latestState.quests,
    getLocale(),
  );

  if (
    !toastMeta ||
    latestState.notifiedCompletionKeys.includes(toastMeta.toastKey)
  ) {
    return;
  }

  sendQuestCompletionToast(toastMeta);

  setQuestState((state) => ({
    notifiedCompletionKeys: [...state.notifiedCompletionKeys, toastMeta.toastKey],
  }));
};

const getPersistedCompletionToastKeys = (
  quests: Array<Pick<Quest, "id" | "stackId" | "completed">>,
) => {
  const keys = new Set<string>();

  quests.forEach((quest) => {
    if (
      !quest.completed ||
      (quest.stackId && STACK_COMPLETION_TOAST_IDS.has(quest.stackId))
    ) {
      return;
    }

    keys.add(quest.id);
  });

  STACK_COMPLETION_TOAST_IDS.forEach((stackId) => {
    const stackQuests = quests.filter((quest) => quest.stackId === stackId);
    if (stackQuests.length > 0 && stackQuests.every((quest) => quest.completed)) {
      keys.add(stackId);
    }
  });

  return Array.from(keys);
};

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

const reconcileQuestDefinitions = (
  currentQuests: Quest[],
  defaultQuests: Quest[],
): Quest[] => {
  const currentQuestById = new Map(currentQuests.map((quest) => [quest.id, quest]));

  return defaultQuests.map((defaultQuest) => {
    const currentQuest = currentQuestById.get(defaultQuest.id);
    if (!currentQuest) {
      return defaultQuest;
    }

    const progress = Math.min(
      Math.max(0, Number(currentQuest.progress) || 0),
      defaultQuest.maxProgress,
    );
    const completed = currentQuest.completed || progress >= defaultQuest.maxProgress;

    return {
      ...defaultQuest,
      progress,
      completed,
      hiddenUntilCompleted:
        currentQuest.hiddenUntilCompleted ?? defaultQuest.hiddenUntilCompleted,
    };
  });
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

  if (fromVersion < QUESTS_STORE_VERSION.V8) {
    normalizedState.quests = mergeQuestLists(
      normalizedState.quests ?? [],
      initialQuests,
    );
  }

  if (fromVersion < QUESTS_STORE_VERSION.V9) {
    normalizedState.quests = mergeQuestLists(
      normalizedState.quests ?? [],
      initialQuests,
    ).map((quest) => ({
      ...quest,
      hiddenUntilCompleted:
        quest.progressionKind === "milestone" ? false : quest.hiddenUntilCompleted,
    }));
  }

  if (fromVersion < QUESTS_STORE_VERSION.V10) {
    normalizedState.quests = mergeQuestLists(
      normalizedState.quests ?? [],
      initialQuests,
    );
  }

  if (fromVersion < QUESTS_STORE_VERSION.V11) {
    normalizedState.quests = mergeQuestLists(
      normalizedState.quests ?? [],
      initialQuests,
    );
  }

  if (fromVersion < QUESTS_STORE_VERSION.V12) {
    normalizedState.quests = mergeQuestLists(
      normalizedState.quests ?? [],
      initialQuests,
    ).map((quest) => {
      const progress = Math.min(
        Math.max(0, Number(quest.progress) || 0),
        quest.maxProgress,
      );
      const completed = quest.completed || progress >= quest.maxProgress;

      return {
        ...quest,
        progress,
        completed,
      };
    });
  }

  if (fromVersion < QUESTS_STORE_VERSION.V13) {
    normalizedState.quests = reconcileQuestDefinitions(
      normalizedState.quests ?? [],
      initialQuests,
    );
  }

  if (fromVersion < QUESTS_STORE_VERSION.V14) {
    normalizedState.quests = reconcileQuestDefinitions(
      normalizedState.quests ?? [],
      initialQuests,
    );
  }

  normalizedState.version = QUESTS_STORE_VERSION.LATEST;
  normalizedState.isHydrated = true;
  normalizedState.notifiedCompletionKeys = Array.from(
    new Set([
      ...(normalizedState.notifiedCompletionKeys ?? []),
      ...getPersistedCompletionToastKeys(normalizedState.quests ?? []),
    ]),
  );
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
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "interaction",
    progressionKind: "trigger",
    trigger: {
      action: "auto_tap_level",
      value: 1,
    },
  },
  {
    id: "auto_tap_level_10",
    title: "Werkbank warmgelaufen",
    description: "Bringe den Auto Tapper auf Level 10",
    icon: "⚙️",
    color: "#6B84FF",
    progress: 0,
    maxProgress: 10,
    reward: {
      type: "taps_reward",
      amount: 2000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "auto_tap_level",
      value: 1,
    },
    showProgress: true,
    stackId: "automation_mastery",
    stackOrder: 1,
    stackTitle: "Automation Mastery",
    stackDescription: "Level up your core automation line.",
  },
  {
    id: "auto_tap_level_50",
    title: "Fliessbandfieber",
    description: "Bringe den Auto Tapper auf Level 50",
    icon: "🏭",
    color: "#5D72F4",
    progress: 0,
    maxProgress: 50,
    reward: {
      type: "taps_reward",
      amount: 20000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "auto_tap_level",
      value: 1,
    },
    showProgress: true,
    stackId: "automation_mastery",
    stackOrder: 2,
    stackTitle: "Automation Mastery",
    stackDescription: "Level up your core automation line.",
  },
  {
    id: "auto_tap_level_100",
    title: "Komplett automatisiert",
    description: "Maxe den Auto Tapper aus",
    icon: "🤖",
    color: "#5263D7",
    progress: 0,
    maxProgress: 100,
    reward: {
      type: "taps_reward",
      amount: 150000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "auto_tap_level",
      value: 1,
    },
    showProgress: true,
    stackId: "automation_mastery",
    stackOrder: 3,
    stackTitle: "Automation Mastery",
    stackDescription: "Level up your core automation line.",
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
    progressionKind: "trigger",
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
    progressionKind: "goal",
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
    progressionKind: "goal",
    trigger: {
      action: "click_books",
      value: 1,
    },
    showProgress: true,
    stackId: "about_tour",
    stackOrder: 3,
    stackTitle: "About Tour",
    stackDescription: "Explore the interactive objects in the About room.",
  },
  {
    id: "about_socials_1",
    title: "Kontaktfreudig",
    description: "Öffne die Socials-Kugel im About-Bereich",
    icon: "🌐",
    color: "#4A8CCF",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 2500,
    },
    completed: false,
    routeId: ROUTE_IDS.ABOUT,
    type: "interaction",
    progressionKind: "trigger",
    trigger: {
      action: "click_socials",
      value: 1,
    },
    stackId: "about_tour",
    stackOrder: 2,
    stackTitle: "About Tour",
    stackDescription: "Explore the interactive objects in the About room.",
  },
  {
    id: "about_desk_1",
    title: "Desk-Check",
    description: "Interagiere mit dem Schreibtisch im About-Bereich",
    icon: "🖥️",
    color: "#5E86D9",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 2000,
    },
    completed: false,
    routeId: ROUTE_IDS.ABOUT,
    type: "interaction",
    progressionKind: "trigger",
    trigger: {
      action: "click_desk",
      value: 1,
    },
    stackId: "about_tour",
    stackOrder: 1,
    stackTitle: "About Tour",
    stackDescription: "Explore the interactive objects in the About room.",
  },
  {
    id: "about_box_1",
    title: "Kistenfuchs",
    description: "Interagiere mit der Kiste im About-Bereich",
    icon: "📦",
    color: "#7A9E52",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 2000,
    },
    completed: false,
    routeId: ROUTE_IDS.ABOUT,
    type: "interaction",
    progressionKind: "trigger",
    trigger: {
      action: "click_box",
      value: 1,
    },
    stackId: "about_tour",
    stackOrder: 4,
    stackTitle: "About Tour",
    stackDescription: "Explore the interactive objects in the About room.",
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
    progressionKind: "milestone",
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
    progressionKind: "milestone",
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
    progressionKind: "milestone",
    trigger: {
      action: "manual_taps_total",
      value: 1,
    },
    showProgress: true,
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
    progressionKind: "milestone",
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
      amount: 12000,
    },
    completed: false,
    type: "tap",
    progressionKind: "milestone",
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
      amount: 220000,
    },
    completed: false,
    type: "tap",
    progressionKind: "milestone",
    trigger: {
      action: "taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "total_taps",
    stackOrder: 3,
    stackTitle: "Total Tap Milestones",
    stackDescription: "Reach long-term lifetime tap goals.",
  },
  {
    id: "total_taps_1000000000000",
    title: "Achtstellig",
    description: "Erreiche insgesamt 100.000.000 Taps",
    icon: "🚀",
    color: "#7D6BFF",
    progress: 0,
    maxProgress: 100000000,
    reward: {
      type: "taps_reward",
      amount: 1500000,
    },
    completed: false,
    type: "tap",
    progressionKind: "milestone",
    trigger: {
      action: "taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "total_taps",
    stackOrder: 4,
    stackTitle: "Total Tap Milestones",
    stackDescription: "Reach long-term lifetime tap goals.",
  },
  {
    id: "total_taps_1000000000000000",
    title: "Jenseits der Unendlichkeit",
    description: "Erreiche insgesamt 1.000.000.000 Taps",
    icon: "🌌",
    color: "#5E8BFF",
    progress: 0,
    maxProgress: 1000000000,
    reward: {
      type: "taps_reward",
      amount: 5000000,
    },
    completed: false,
    type: "tap",
    progressionKind: "milestone",
    trigger: {
      action: "taps_total",
      value: 1,
    },
    showProgress: true,
    stackId: "total_taps",
    stackOrder: 5,
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
    progressionKind: "trigger",
    trigger: {
      action: "shop_buy_bob_item",
      value: 1,
    },
    stackId: SHOP_ITEMS_QUEST_STACK_ID,
    stackOrder: 1,
    stackTitle: "Shop Collector",
    stackDescription: "Buy one item from each shop category.",
  },
  {
    id: "shop_buy_tap_effect_1",
    title: "Effektvoll",
    description: "Kauf einen Tap-Effekt im Shop",
    icon: "✨",
    color: "#44A69A",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 5000,
    },
    completed: false,
    type: "custom",
    progressionKind: "trigger",
    trigger: {
      action: "shop_buy_tap_effect",
      value: 1,
    },
    stackId: SHOP_ITEMS_QUEST_STACK_ID,
    stackOrder: 2,
    stackTitle: "Shop Collector",
    stackDescription: "Buy one item from each shop category.",
  },
  {
    id: "shop_buy_world_1",
    title: "Weltentdecker",
    description: "Kaufe eine Welt im Shop",
    icon: "🌍",
    color: "#4A8E6A",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 12000,
    },
    completed: false,
    type: "custom",
    progressionKind: "trigger",
    trigger: {
      action: "shop_buy_world",
      value: 1,
    },
    stackId: SHOP_ITEMS_QUEST_STACK_ID,
    stackOrder: 3,
    stackTitle: "Shop Collector",
    stackDescription: "Buy one item from each shop category.",
  },
  {
    id: "routes_purchased_1",
    title: "Aufbruch",
    description: "Schalte deine erste zusätzliche Route frei",
    icon: "🧭",
    color: "#4D7EDB",
    progress: 0,
    maxProgress: 1,
    reward: {
      type: "taps_reward",
      amount: 5000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "routes_purchased_total",
      value: 1,
    },
    showProgress: true,
    stackId: "route_unlocks",
    stackOrder: 1,
    stackTitle: "Route Explorer",
    stackDescription: "Unlock new routes to expand your world.",
  },
  {
    id: "routes_purchased_3",
    title: "Stadtplan im Kopf",
    description: "Schalte drei zusätzliche Routen frei",
    icon: "🗺️",
    color: "#3C67BF",
    progress: 0,
    maxProgress: 3,
    reward: {
      type: "taps_reward",
      amount: 20000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "routes_purchased_total",
      value: 1,
    },
    showProgress: true,
    stackId: "route_unlocks",
    stackOrder: 2,
    stackTitle: "Route Explorer",
    stackDescription: "Unlock new routes to expand your world.",
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
    progressionKind: "milestone",
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
    title: "Runde gedreht",
    description: "Spiele insgesamt 5 Minuten",
    icon: "⌛",
    color: "#CC7A35",
    progress: 0,
    maxProgress: 300,
    reward: {
      type: "taps_reward",
      amount: 8000,
    },
    completed: false,
    type: "time",
    progressionKind: "milestone",
    trigger: {
      action: "playtime_seconds",
      value: 1,
    },
    showProgress: true,
    stackId: "playtime",
    stackOrder: 2,
    stackTitle: "Playtime Milestones",
    stackDescription: "Stay in the game to unlock endurance rewards.",
  },
  {
    id: "playtime_1800s",
    title: "Langstrecke",
    description: "Spiele insgesamt 10 Minuten",
    icon: "🪴",
    color: "#C36C2F",
    progress: 0,
    maxProgress: 600,
    reward: {
      type: "taps_reward",
      amount: 15000,
    },
    completed: false,
    type: "time",
    progressionKind: "milestone",
    trigger: {
      action: "playtime_seconds",
      value: 1,
    },
    showProgress: true,
    stackId: "playtime",
    stackOrder: 3,
    stackTitle: "Playtime Milestones",
    stackDescription: "Stay in the game to unlock endurance rewards.",
  },
  {
    id: "upgrade_levels_25",
    title: "Werkzeugkiste",
    description: "Erreiche insgesamt 25 Upgrade-Level",
    icon: "🧰",
    color: "#4F95C8",
    progress: 0,
    maxProgress: 25,
    reward: {
      type: "taps_reward",
      amount: 5000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "upgrade_levels_total",
      value: 1,
    },
    showProgress: true,
    stackId: "upgrade_levels",
    stackOrder: 1,
    stackTitle: "Upgrade Mastery",
    stackDescription: "Keep investing across the whole upgrade tree.",
  },
  {
    id: "upgrade_levels_100",
    title: "Maschinenraum",
    description: "Erreiche insgesamt 100 Upgrade-Level",
    icon: "🔩",
    color: "#437FB3",
    progress: 0,
    maxProgress: 100,
    reward: {
      type: "taps_reward",
      amount: 40000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "upgrade_levels_total",
      value: 1,
    },
    showProgress: true,
    stackId: "upgrade_levels",
    stackOrder: 2,
    stackTitle: "Upgrade Mastery",
    stackDescription: "Keep investing across the whole upgrade tree.",
  },
  {
    id: "upgrade_levels_200",
    title: "Patchday",
    description: "Erreiche insgesamt 200 Upgrade-Level",
    icon: "🛠️",
    color: "#356A98",
    progress: 0,
    maxProgress: 200,
    reward: {
      type: "taps_reward",
      amount: 200000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "upgrade_levels_total",
      value: 1,
    },
    showProgress: true,
    stackId: "upgrade_levels",
    stackOrder: 3,
    stackTitle: "Upgrade Mastery",
    stackDescription: "Keep investing across the whole upgrade tree.",
  },
  {
    id: "auto_tap_rate_100",
    title: "Produktionslinie",
    description: "Erreiche 100 Auto-Taps pro Sekunde",
    icon: "📈",
    color: "#3DAA8D",
    progress: 0,
    maxProgress: 100,
    reward: {
      type: "taps_reward",
      amount: 6000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "auto_tap_rate",
      value: 1,
    },
    showProgress: true,
    stackId: "auto_tap_rate",
    stackOrder: 1,
    stackTitle: "Automation Output",
    stackDescription: "Push your passive tap production higher.",
  },
  {
    id: "auto_tap_rate_1000",
    title: "Surrende Maschinen",
    description: "Erreiche 1.000 Auto-Taps pro Sekunde",
    icon: "⚡",
    color: "#349A80",
    progress: 0,
    maxProgress: 1000,
    reward: {
      type: "taps_reward",
      amount: 30000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "auto_tap_rate",
      value: 1,
    },
    showProgress: true,
    stackId: "auto_tap_rate",
    stackOrder: 2,
    stackTitle: "Automation Output",
    stackDescription: "Push your passive tap production higher.",
  },
  {
    id: "auto_tap_rate_10000",
    title: "Volldampf",
    description: "Erreiche 10.000 Auto-Taps pro Sekunde",
    icon: "🚂",
    color: "#2A836D",
    progress: 0,
    maxProgress: 10000,
    reward: {
      type: "taps_reward",
      amount: 175000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "auto_tap_rate",
      value: 1,
    },
    showProgress: true,
    stackId: "auto_tap_rate",
    stackOrder: 3,
    stackTitle: "Automation Output",
    stackDescription: "Push your passive tap production higher.",
  },
  {
    id: "tap_multiplier_5",
    title: "Fingerfertig",
    description: "Erreiche 5x Tap-Power",
    icon: "🫵",
    color: "#D76F4C",
    progress: 0,
    maxProgress: 5,
    reward: {
      type: "taps_reward",
      amount: 8000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "tap_multiplier",
      value: 1,
    },
    showProgress: true,
    stackId: "tap_multiplier",
    stackOrder: 1,
    stackTitle: "Tap Power",
    stackDescription: "Keep making every manual tap hit harder.",
  },
  {
    id: "tap_multiplier_20",
    title: "Muskelgedächtnis",
    description: "Erreiche 20x Tap-Power",
    icon: "💥",
    color: "#CC6242",
    progress: 0,
    maxProgress: 20,
    reward: {
      type: "taps_reward",
      amount: 40000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "tap_multiplier",
      value: 1,
    },
    showProgress: true,
    stackId: "tap_multiplier",
    stackOrder: 2,
    stackTitle: "Tap Power",
    stackDescription: "Keep making every manual tap hit harder.",
  },
  {
    id: "tap_multiplier_50",
    title: "Presslufthand",
    description: "Erreiche 50x Tap-Power",
    icon: "🚨",
    color: "#BF5538",
    progress: 0,
    maxProgress: 50,
    reward: {
      type: "taps_reward",
      amount: 175000,
    },
    completed: false,
    routeId: ROUTE_IDS.HOME,
    type: "custom",
    progressionKind: "milestone",
    trigger: {
      action: "tap_multiplier",
      value: 1,
    },
    showProgress: true,
    stackId: "tap_multiplier",
    stackOrder: 3,
    stackTitle: "Tap Power",
    stackDescription: "Keep making every manual tap hit harder.",
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
    routeId: ROUTE_IDS.MINIGAMES,
    type: "interaction",
    progressionKind: "goal",
    trigger: {
      action: "minigames_flappy_score",
      value: 1,
    },
    showProgress: true,
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
    routeId: ROUTE_IDS.MINIGAMES,
    type: "interaction",
    progressionKind: "trigger",
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
      isHydrated: false,
      notifiedCompletionKeys: [],

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

          const nextProgress = Math.min(safeValue, quest.maxProgress);
          const nextCompleted = nextProgress >= quest.maxProgress;

          // Avoid replaying completion toasts for already-maxed persisted progress.
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
          quests: initialQuests.map((quest) => ({ ...quest })),
          activeQuests: [],
          notifiedCompletionKeys: [],
        })),

      resetAllQuests: () =>
        set(() => ({
          quests: initialQuests.map((quest) => ({ ...quest })),
          activeQuests: [],
          notifiedCompletionKeys: [],
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
      migrate: (persisted: any, fromVersion: number) => {
        if (!persisted) {
          return {
            version: QUESTS_STORE_VERSION.LATEST,
            quests: initialQuests,
            activeQuests: [],
            isHydrated: true,
            notifiedCompletionKeys: [],
          };
        }

        return migrateStore(persisted, fromVersion || 0);
      },
      onRehydrateStorage: () => (state?: QuestStore) => {
        if (!state) return;
        state.isHydrated = true;
      },
    },
  ),
);

const questMessageMap = {
  auto_tap_milestone_1: true,
  about_quest_2: true,
  portfolio_quest_1: true,
  minigames_flappy_points_10: true,
  minigames_slot_wins_5: true,
} as const;
