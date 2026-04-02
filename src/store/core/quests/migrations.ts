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
  LATEST = V5,
}

const cloneInitialQuests = () => initialQuests.map((quest) => ({ ...quest }));

export const createDefaultQuestState = (): Pick<
  QuestStore,
  "version" | "quests" | "activeQuests" | "isHydrated" | "notifiedCompletionKeys"
> => ({
  version: QUESTS_STORE_VERSION.LATEST,
  quests: cloneInitialQuests(),
  activeQuests: [],
  isHydrated: true,
  notifiedCompletionKeys: [],
});

const normalizePersistedState = (
  persisted: any,
): Pick<QuestStore, "quests" | "activeQuests" | "notifiedCompletionKeys"> => {
  if (!persisted) {
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

  return {
    quests: Array.isArray(persisted.quests)
      ? (persisted.quests as Quest[])
      : cloneInitialQuests(),
    activeQuests: Array.isArray(persisted.activeQuests)
      ? persisted.activeQuests
      : [],
    notifiedCompletionKeys: Array.isArray(persisted.notifiedCompletionKeys)
      ? persisted.notifiedCompletionKeys
      : [],
  };
};

export const migrateQuestStore = (
  persisted: any,
  fromVersion: number,
): Pick<
  QuestStore,
  "version" | "quests" | "activeQuests" | "isHydrated" | "notifiedCompletionKeys"
> => {
  const normalizedState = normalizePersistedState(persisted);

  if (fromVersion < QUESTS_STORE_VERSION.V5) {
    normalizedState.quests = reconcileQuestDefinitions(
      normalizedState.quests ?? [],
      cloneInitialQuests(),
    );
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
    isHydrated: true,
    notifiedCompletionKeys: Array.from(
      new Set([
        ...(normalizedState.notifiedCompletionKeys ?? []),
        ...getPersistedCompletionToastKeys(normalizedState.quests ?? []),
      ]),
    ),
  };
};
