import { createQuestToastIcon } from "@/components/QuestTrophyIcon";
import { getLocale, type Locale } from "@/i18n";
import { sileo } from "sileo";
import { useCoreStore } from "../store";
import {
  getQuestCopy,
  getQuestStackCopy,
  type QuestMessageId,
  type QuestStackMessageId,
} from "../quests.messages";
import {
  ABOUT_TOUR_STACK_ID,
  SHOP_ITEMS_QUEST_STACK_ID,
  STACK_COMPLETION_TOAST_IDS,
} from "./constants";
import type { Quest, QuestCompletionToastMeta, QuestStore } from "./types";

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
      fallbackTitle: "Talking Stage",
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

export const applyQuestReward = (
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

export const emitQuestCompletionToastOnce = (
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
    notifiedCompletionKeys: [
      ...state.notifiedCompletionKeys,
      toastMeta.toastKey,
    ],
  }));
};

export const getPersistedCompletionToastKeys = (
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
    if (
      stackQuests.length > 0 &&
      stackQuests.every((quest) => quest.completed)
    ) {
      keys.add(stackId);
    }
  });

  return Array.from(keys);
};

export const reconcileQuestDefinitions = (
  currentQuests: Quest[],
  defaultQuests: Quest[],
): Quest[] => {
  const currentQuestById = new Map(
    currentQuests.map((quest) => [quest.id, quest]),
  );

  return defaultQuests.map((defaultQuest) => {
    const currentQuest = currentQuestById.get(defaultQuest.id);
    if (!currentQuest) {
      return defaultQuest;
    }

    const progress = Math.min(
      Math.max(0, Number(currentQuest.progress) || 0),
      defaultQuest.maxProgress,
    );
    const completed =
      currentQuest.completed || progress >= defaultQuest.maxProgress;

    return {
      ...defaultQuest,
      progress,
      completed,
      hiddenUntilCompleted:
        currentQuest.hiddenUntilCompleted ?? defaultQuest.hiddenUntilCompleted,
    };
  });
};
