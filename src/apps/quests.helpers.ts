import {
  formatCompactNumber,
  formatLocalizedNumber,
} from "@/i18n/formatters";
import type { Locale } from "@/i18n/types";
import {
  getQuestCopy,
  getQuestStackCopy,
  type QuestMessageId,
  type QuestStackMessageId,
} from "@/store/core/quests.messages";
import type { Quest } from "@/store/core/quests";
import type { QuestsAppMessages } from "./quests.messages";
import type {
  QuestBadgeContentValue,
  QuestGroup,
  RewardMeta,
} from "./quests.types";

export const withAlpha = (hexColor: string, alpha: number): string => {
  const hex = hexColor.replace("#", "");
  const value =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  if (value.length !== 6) {
    return hexColor;
  }

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
};

const BADGE_COMPACT_UNITS = [
  {
    threshold: 1_000_000_000_000_000,
    divisor: 1_000_000_000_000_000,
    suffix: "Q",
  },
  { threshold: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: "T" },
  { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: "B" },
  { threshold: 1_000_000, divisor: 1_000_000, suffix: "M" },
  { threshold: 1_000, divisor: 1_000, suffix: "K" },
] as const;

const formatBadgeDurationParts = (
  seconds: number,
): { value: string; metric: string } => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return {
      value: `${hours}`,
      metric: "h",
    };
  }

  if (minutes > 0) {
    return {
      value: `${minutes}`,
      metric: "min",
    };
  }

  return {
    value: `${secs}`,
    metric: "s",
  };
};

const formatBadgeNumberParts = (
  value: number,
  locale: Locale,
): { value: string; metric: string } => {
  const safe = Math.max(0, Math.floor(value));
  const compactUnit = BADGE_COMPACT_UNITS.find(
    (entry) => safe >= entry.threshold,
  );

  if (!compactUnit) {
    return {
      value: formatLocalizedNumber(safe, locale, {
        maximumFractionDigits: 0,
      }),
      metric: "",
    };
  }

  const compactValue = safe / compactUnit.divisor;
  const roundedValue =
    compactValue >= 10
      ? Math.floor(compactValue)
      : Math.floor(compactValue * 10) / 10;

  return {
    value: formatLocalizedNumber(roundedValue, locale, {
      minimumFractionDigits: Number.isInteger(roundedValue) ? 0 : 1,
      maximumFractionDigits: 1,
    }),
    metric: compactUnit.suffix,
  };
};

export const hasRenderableReward = (quest: Quest) => {
  if (!quest.reward) {
    return false;
  }

  if (quest.reward.type === "taps_reward") {
    return (Number(quest.reward.amount) || 0) > 0;
  }

  return String(quest.reward.amount || "").trim().length > 0;
};

export const resolveQuestReward = (
  quest: Quest,
  locale: Locale,
): RewardMeta | null => {
  if (!hasRenderableReward(quest) || !quest.reward) {
    return null;
  }

  if (quest.reward.type === "taps_reward") {
    return {
      kind: "taps",
      label: formatCompactNumber(Number(quest.reward.amount) || 0, locale),
    };
  }

  return {
    kind: "item",
    label: String(quest.reward.amount || ""),
  };
};

export const formatProgressValue = (quest: Quest, locale: Locale) => {
  const currentValue = Math.min(quest.progress, quest.maxProgress);
  return quest.type === "time"
    ? formatDuration(currentValue)
    : formatLocalizedNumber(Math.floor(currentValue), locale, {
        maximumFractionDigits: 0,
      });
};

export const resolveQuestBadgeContent = (
  quest: Quest,
  locale: Locale,
): QuestBadgeContentValue => {
  if (quest.progressionKind !== "milestone") {
    return {
      isText: false,
      value: quest.icon,
    };
  }

  if (quest.maxProgress > 1) {
    if (quest.type === "time") {
      const durationParts = formatBadgeDurationParts(quest.maxProgress);
      return {
        isText: true,
        value: durationParts.value,
        metric: durationParts.metric,
      };
    }

    const numberParts = formatBadgeNumberParts(quest.maxProgress, locale);

    if (quest.type === "tap") {
      return {
        isText: true,
        value: `${numberParts.value}${numberParts.metric.toLowerCase()}`,
        metric: "🫵",
      };
    }

    return {
      isText: true,
      value: numberParts.value,
      metric: numberParts.metric,
    };
  }

  return {
    isText: false,
    value: quest.icon,
  };
};

export const getRewardChipLabel = (
  reward: RewardMeta,
  messages: QuestsAppMessages,
) => {
  if (reward.kind === "item") {
    return messages.rewardItemReceived;
  }

  return messages.rewardTapsPattern.replace("{value}", reward.label);
};

export const toQuestGroups = (
  quests: Quest[],
  locale: Locale,
  messages: QuestsAppMessages,
): QuestGroup[] => {
  const stackMap = new Map<string, Quest[]>();
  const singleMap = new Map<string, Quest>();
  const groupOrder: string[] = [];

  quests.forEach((quest) => {
    if (quest.stackId) {
      const groupKey = `stack:${quest.stackId}`;
      const existing = stackMap.get(quest.stackId) ?? [];
      existing.push(quest);
      stackMap.set(quest.stackId, existing);

      if (!groupOrder.includes(groupKey)) {
        groupOrder.push(groupKey);
      }
      return;
    }

    const groupKey = `quest:${quest.id}`;
    singleMap.set(groupKey, quest);
    groupOrder.push(groupKey);
  });

  return groupOrder.map((groupKey) => {
    if (groupKey.startsWith("stack:")) {
      const stackId = groupKey.replace("stack:", "");
      const stackQuests = stackMap.get(stackId) ?? [];
      const sorted = [...stackQuests].sort(
        (a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0),
      );
      const lead = sorted[0];
      const activeQuest =
        sorted.find((quest) => !quest.completed) ?? sorted[sorted.length - 1];
      const activeIndex = sorted.findIndex(
        (quest) => quest.id === activeQuest.id,
      );
      const nextQuest = sorted[activeIndex + 1] ?? null;
      const isMilestoneStack = sorted.every(
        (quest) => quest.progressionKind === "milestone",
      );
      const activeCopy = getQuestCopy(activeQuest.id as QuestMessageId, locale);
      const nextCopy = nextQuest
        ? getQuestCopy(nextQuest.id as QuestMessageId, locale)
        : null;
      const stackCopy = getQuestStackCopy(
        stackId as QuestStackMessageId,
        locale,
      );

      return {
        id: groupKey,
        title: isMilestoneStack
          ? activeCopy?.title ?? activeQuest.title
          : stackCopy?.title ?? lead.stackTitle ?? lead.title,
        description: isMilestoneStack
          ? activeCopy?.description ?? activeQuest.description
          : stackCopy?.description ?? lead.stackDescription ?? lead.description,
        secondaryDescription: isMilestoneStack
          ? nextCopy
            ? `${messages.nextMilestone}: ${nextCopy.title}`
            : messages.allMilestonesCompleted
          : undefined,
        color: lead.color,
        quests: sorted,
        isStack: true,
        isHidden: false,
        isMilestoneStack,
        activeQuest,
        nextQuest,
      };
    }

    const quest = singleMap.get(groupKey)!;
    const questCopy = getQuestCopy(quest.id as QuestMessageId, locale);
    const isHidden = Boolean(quest.hiddenUntilCompleted && !quest.completed);

    return {
      id: groupKey,
      title: isHidden
        ? messages.hiddenQuestTitle
        : questCopy?.title ?? quest.title,
      description: isHidden
        ? messages.hiddenQuestDescription
        : questCopy?.description ?? quest.description,
      secondaryDescription: undefined,
      color: quest.color,
      quests: [quest],
      isStack: false,
      isHidden,
      isMilestoneStack: false,
      activeQuest: quest,
      nextQuest: null,
    };
  });
};
