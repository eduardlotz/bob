import type { Quest } from "@/store/core/quests";

export type RewardKind = "taps" | "item";

export type RewardMeta = {
  kind: RewardKind;
  label: string;
};

export type QuestBadgeContentValue =
  | {
      isText: false;
      value: string;
    }
  | {
      isText: true;
      value: string;
      metric: string;
    };

export type QuestGroup = {
  id: string;
  title: string;
  description: string;
  color: string;
  quests: Quest[];
  isStack: boolean;
};
