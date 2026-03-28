import type { Locale } from "@/i18n/types";
import { formatNumber } from "@/molecules/TapCounter";
import {
  getQuestCopy,
  getQuestStackCopy,
  type QuestMessageId,
  type QuestStackMessageId,
} from "@/store/core/quests.messages";
import type { Quest } from "@/store/core/quests";
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

const compactBadgeNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const localeIsGerman = (locale: string) =>
  locale.toLowerCase().startsWith("de");

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

export const hasRenderableReward = (quest: Quest) => {
  if (!quest.reward) {
    return false;
  }

  if (quest.reward.type === "taps_reward") {
    return (Number(quest.reward.amount) || 0) > 0;
  }

  return String(quest.reward.amount || "").trim().length > 0;
};

export const resolveQuestReward = (quest: Quest): RewardMeta | null => {
  if (!hasRenderableReward(quest) || !quest.reward) {
    return null;
  }

  if (quest.reward.type === "taps_reward") {
    return {
      kind: "taps",
      label: formatNumber(Number(quest.reward.amount) || 0),
    };
  }

  return {
    kind: "item",
    label: String(quest.reward.amount || ""),
  };
};

export const formatProgressValue = (quest: Quest) => {
  const currentValue = Math.min(quest.progress, quest.maxProgress);
  return quest.type === "time"
    ? formatDuration(currentValue)
    : formatNumber(Math.floor(currentValue));
};

export const resolveQuestBadgeContent = (
  quest: Quest,
): QuestBadgeContentValue => {
  if (quest.maxProgress > 1) {
    if (quest.type === "time") {
      const durationParts = formatBadgeDurationParts(quest.maxProgress);
      return {
        isText: true,
        value: durationParts.value,
        metric: durationParts.metric,
      };
    }

    return {
      isText: true,
      value: compactBadgeNumberFormatter
        .format(Math.max(0, Math.floor(quest.maxProgress)))
        .replace(/\s+/g, "")
        .toUpperCase(),
      metric: quest.type === "tap" ? "👊" : "",
    };
  }

  return {
    isText: false,
    value: quest.icon,
  };
};

export const getRewardChipLabel = (reward: RewardMeta, locale: Locale) => {
  if (reward.kind === "item") {
    return localeIsGerman(locale) ? "Item-Belohnung" : "Item reward";
  }

  return localeIsGerman(locale)
    ? `${reward.label} Taps erhalten`
    : `Get ${reward.label} taps`;
};

export const toQuestGroups = (quests: Quest[], locale: Locale): QuestGroup[] => {
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
      const stackCopy = getQuestStackCopy(stackId as QuestStackMessageId, locale);

      return {
        id: groupKey,
        title: stackCopy?.title ?? lead.stackTitle ?? lead.title,
        description:
          stackCopy?.description ?? lead.stackDescription ?? lead.description,
        color: lead.color,
        quests: sorted,
        isStack: true,
      };
    }

    const quest = singleMap.get(groupKey)!;
    const questCopy = getQuestCopy(quest.id as QuestMessageId, locale);

    return {
      id: groupKey,
      title: questCopy?.title ?? quest.title,
      description: questCopy?.description ?? quest.description,
      color: quest.color,
      quests: [quest],
      isStack: false,
    };
  });
};
