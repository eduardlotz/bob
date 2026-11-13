import { initialQuests } from "@/store/config/quests";
import type { Quest, QuestStore } from "./types";
import {
  getPersistedCompletionToastKeys,
  reconcileQuestDefinitions,
} from "./utils";

export enum QUESTS_STORE_VERSION {
  V0 = 0,
  V1 = 1000000,
  V2 = 1000001,
  V3 = 1000002,
  V4 = 1000003,
  // single refresh migration for all current/new quest definitions
  V5 = 1000014,
  V6 = 1000015, // Astrobob Flappy reward
  V7 = 1000016, // Obsidian skin: 100,000 lifetime taps
  V8 = 1000017, // About: work corner and plant replace the books and hobby box
  V9 = 1000018, // Remove the retired slot machine quest
  V10 = 1000020, // Four About corners and shop categories without worlds
  LATEST = V10,
}

const cloneInitialQuests = () => initialQuests.map((quest) => ({ ...quest }));

export const createDefaultQuestState = (): Pick<
  QuestStore,
  "version" | "quests" | "activeQuests" | "notifiedCompletionKeys"
> => ({
  version: QUESTS_STORE_VERSION.LATEST,
  quests: cloneInitialQuests(),
  activeQuests: [],
  notifiedCompletionKeys: [],
});

const normalizePersistedState = (
  persisted: unknown,
): Pick<QuestStore, "quests" | "activeQuests" | "notifiedCompletionKeys"> => {
  if (!persisted || typeof persisted !== "object") {
    return {
      quests: cloneInitialQuests(),
      activeQuests: [],
      notifiedCompletionKeys: [],
    };
  }

  if (Array.isArray(persisted)) {
    return {
      quests: persisted as Quest[],
      activeQuests: [],
      notifiedCompletionKeys: [],
    };
  }

  const state = persisted as Partial<QuestStore>;

  return {
    quests: Array.isArray(state.quests)
      ? (state.quests as Quest[])
      : cloneInitialQuests(),
    activeQuests: Array.isArray(state.activeQuests)
      ? state.activeQuests
      : [],
    notifiedCompletionKeys: Array.isArray(state.notifiedCompletionKeys)
      ? state.notifiedCompletionKeys
      : [],
  };
};

export const migrateQuestStore = (
  persisted: unknown,
  fromVersion: number,
): Pick<
  QuestStore,
  "version" | "quests" | "activeQuests" | "notifiedCompletionKeys"
> => {
  const normalizedState = normalizePersistedState(persisted);

  if (fromVersion < QUESTS_STORE_VERSION.V10) {
    normalizedState.quests = reconcileQuestDefinitions(
      normalizedState.quests ?? [],
      cloneInitialQuests(),
    );
    // Earlier triggers conflated multiple corners and shop categories.
    // Recount purchases from ownership and require distinct corner visits.
    normalizedState.quests = normalizedState.quests.map(quest =>
      quest.stackId === "about_tour" || quest.stackId === "shop_item_categories"
        ? { ...quest, progress: 0, completed: false } : quest);
    normalizedState.notifiedCompletionKeys = normalizedState.notifiedCompletionKeys.filter(key =>
      key !== "about_tour" && key !== "shop_item_categories");
  }

  const knownQuestIds = new Set(
    (normalizedState.quests ?? []).map((quest) => quest.id),
  );
  const activeQuests = (normalizedState.activeQuests ?? []).filter((id) =>
    knownQuestIds.has(id),
  );

  return {
    version: QUESTS_STORE_VERSION.LATEST,
    quests: normalizedState.quests,
    activeQuests,
    notifiedCompletionKeys: Array.from(
      new Set([
        ...(normalizedState.notifiedCompletionKeys ?? []),
        ...getPersistedCompletionToastKeys(normalizedState.quests ?? []),
      ]),
    ),
  };
};
