export type RewardType = "taps_reward" | "item_reward";
export type RewardId = string;

export type QuestProgressionKind = "milestone" | "goal" | "trigger";

export interface QuestReward {
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
  type: "interaction" | "tap" | "time" | "custom";
  progressionKind?: QuestProgressionKind;
  trigger?: {
    action: string;
    value?: any;
  };
  showProgress?: boolean;
  hiddenUntilCompleted?: boolean;
  stackId?: string;
  stackOrder?: number;
}

export interface QuestState {
  version: number;
  quests: Quest[];
  activeQuests: string[];
  notifiedCompletionKeys: string[];
}

export interface QuestFlags {
  isHydrated: boolean;
}

export interface QuestStoreActions {
  addQuest: (quest: Quest) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  triggerQuestAction: (
    action: string,
    value?: number,
    routeId?: string,
  ) => void;
  syncQuestProgressFromMetric: (action: string, absoluteValue: number) => void;
  getQuestsByRoute: (routeId: string) => Quest[];
  setActiveQuests: (routeId: string) => void;
  clearActiveQuests: () => void;
  resetQuests: () => void;
  resetAllQuests: () => void;
  unlockAllQuests: () => void;
}

export type QuestStore = QuestState & QuestFlags & QuestStoreActions;
