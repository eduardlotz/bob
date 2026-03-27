import { FillColumn, FillRow, HugColumn, ScrollArea } from "@/layout";
import { formatNumber } from "@/molecules/TapCounter";
import { motion } from "motion/react";
import { useMemo } from "react";
import styled from "styled-components";
import { useI18n } from "@/i18n";
import { getShopItemCopy } from "@/shop-items/copy";
import {
  getQuestCopy,
  getQuestStackCopy,
  type QuestMessageId,
  type QuestStackMessageId,
} from "@/store/core/quests.messages";
import { useCoreStore } from "@/store";
import { useQuestStore, type Quest } from "@/store/core/quests";
import { QuestTrophyIcon } from "@/components/QuestTrophyIcon";

const withAlpha = (hexColor: string, alpha: number): string => {
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

type QuestStack = {
  id: string;
  title: string;
  description?: string;
  color: string;
  quests: Quest[];
};

type RewardKind = "taps" | "item";

type RewardMeta = {
  kind: RewardKind;
  label: string;
};

const resolveQuestReward = (
  quest: Quest,
  rewardItems: Array<{ id: string; name: string }>,
  locale: ReturnType<typeof useI18n>["locale"],
): RewardMeta => {
  if (quest.reward.type === "taps_reward") {
    return {
      kind: "taps",
      label: `+${formatNumber(Number(quest.reward.amount) || 0)}`,
    };
  }

  const itemId = String(quest.reward.amount);
  const item = rewardItems.find((entry) => entry.id === itemId);
  const itemCopy = item ? getShopItemCopy(item.id, locale) : null;

  return {
    kind: "item",
    label: itemCopy?.name ?? item?.name ?? itemId,
  };
};

export const QuestsIcon = () => (
  <img src="/images/app-logos/quests.png" height={80} width={80} />
);

export const QuestsApp = () => {
  const { quests } = useQuestStore();
  const { bobItems, tapEffects, worlds } = useCoreStore();
  const { locale } = useI18n();

  const rewardItems = useMemo(
    () => [...bobItems, ...tapEffects, ...worlds],
    [bobItems, tapEffects, worlds],
  );

  const visibleQuests = useMemo(
    () => quests.filter((quest) => !quest.hiddenUntilCompleted || quest.completed),
    [quests],
  );

  const { stacks, singleQuests } = useMemo(() => {
    const stackMap = new Map<string, Quest[]>();
    const singleItems: Quest[] = [];

    for (const quest of visibleQuests) {
      if (quest.stackId) {
        const group = stackMap.get(quest.stackId) ?? [];
        group.push(quest);
        stackMap.set(quest.stackId, group);
      } else {
        singleItems.push(quest);
      }
    }

    const groupedStacks: QuestStack[] = [...stackMap.entries()]
      .map(([id, items]) => {
        const sorted = [...items].sort(
          (a, b) =>
            (a.stackOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.stackOrder ?? Number.MAX_SAFE_INTEGER),
        );
        const base = sorted[0];
        const stackCopy = getQuestStackCopy(id as QuestStackMessageId, locale);

        return {
          id,
          title: stackCopy?.title ?? base.stackTitle ?? base.title,
          description: stackCopy?.description ?? base.stackDescription,
          color: base.color,
          quests: sorted,
        };
      })
      .sort(
        (a, b) =>
          Number(a.quests.every((q) => q.completed)) -
          Number(b.quests.every((q) => q.completed)),
      );

    const sortedSingles = [...singleItems].sort(
      (a, b) => Number(a.completed) - Number(b.completed),
    );

    return {
      stacks: groupedStacks,
      singleQuests: sortedSingles,
    };
  }, [visibleQuests, locale]);

  return (
    <HugColumn
      style={{ width: "100%", maxWidth: "100%", maxHeight: "360px" }}
      $gap={"0.25rem"}
    >
      <ScrollArea $direction="vertical">
        {stacks.map((stack) => {
          const completedCount = stack.quests.filter((quest) => quest.completed).length;
          const activeQuest =
            stack.quests.find((quest) => !quest.completed) ??
            stack.quests[stack.quests.length - 1];
          const activeQuestCopy = getQuestCopy(
            activeQuest.id as QuestMessageId,
            locale,
          );
          const activeReward = resolveQuestReward(activeQuest, rewardItems, locale);
          const progressText = activeQuest.showProgress
            ? `${Math.min(activeQuest.progress, activeQuest.maxProgress)} / ${activeQuest.maxProgress}`
            : undefined;
          const stackCompleted = completedCount === stack.quests.length;
          const completionRatio =
            stack.quests.length > 0 ? completedCount / stack.quests.length : 0;

          return (
            <QuestStackCard
              key={stack.id}
              style={
                stackCompleted
                  ? {
                      borderColor: stack.color,
                      background: withAlpha(stack.color, 0.16),
                    }
                  : {
                      borderColor: "rgba(33, 33, 33, 0.09)",
                      background: "rgba(33, 33, 33, 0.05)",
                    }
              }
            >
              <StackHead>
                <StackTitle style={stackCompleted ? { color: stack.color } : undefined}>
                  {stack.title}
                </StackTitle>
                <StackCounter>
                  {completedCount}/{stack.quests.length}
                </StackCounter>
              </StackHead>

              <StackTimeline>
                <StackTimelineTrack>
                  <StackTimelineFill
                    style={{
                      width: `${Math.max(0, Math.min(1, completionRatio)) * 100}%`,
                      background: withAlpha(stack.color, 0.9),
                    }}
                  />

                  {stack.quests.map((quest, index) => {
                    const isDone = quest.completed;
                    const isActive = !isDone && quest.id === activeQuest.id;
                    const left =
                      stack.quests.length <= 1
                        ? 0
                        : (index / (stack.quests.length - 1)) * 100;

                    return (
                      <StackTimelineNode
                        key={quest.id}
                        style={{
                          left: `calc(${left}% - 0.34rem)`,
                          borderColor: isDone
                            ? quest.color
                            : isActive
                              ? withAlpha(quest.color, 0.65)
                              : "rgba(33, 33, 33, 0.2)",
                          background: isDone
                            ? quest.color
                            : isActive
                              ? withAlpha(quest.color, 0.2)
                              : "rgba(33, 33, 33, 0.08)",
                        }}
                      />
                    );
                  })}
                </StackTimelineTrack>

                <StackMilestoneMetaRow
                  style={{
                    gridTemplateColumns: `repeat(${stack.quests.length}, minmax(0, 1fr))`,
                  }}
                >
                  {stack.quests.map((quest) => {
                    const reward = resolveQuestReward(quest, rewardItems, locale);
                    const isDone = quest.completed;
                    const isActive = !isDone && quest.id === activeQuest.id;

                    return (
                      <StackMilestoneMeta key={quest.id} $active={isActive}>
                        <StackMilestoneGoal
                          style={isDone ? { color: quest.color } : undefined}
                        >
                          {formatNumber(quest.maxProgress)}
                        </StackMilestoneGoal>

                        <QuestRewardChip
                          $kind={reward.kind}
                          $compact
                          style={
                            isDone
                              ? {
                                  borderColor: withAlpha(quest.color, 0.5),
                                  background: withAlpha(quest.color, 0.16),
                                }
                              : undefined
                          }
                        >
                          <span>{reward.kind === "taps" ? "🫵" : "🎁"}</span>
                          <span>{reward.label}</span>
                        </QuestRewardChip>
                      </StackMilestoneMeta>
                    );
                  })}
                </StackMilestoneMetaRow>
              </StackTimeline>

              {!stackCompleted && (
                <StackHintWrap>
                  <StackHint>
                    {activeQuestCopy?.description ?? activeQuest.description}
                    {progressText && (
                      <StackProgressChip>{progressText}</StackProgressChip>
                    )}
                  </StackHint>

                  <QuestRewardChip $kind={activeReward.kind}>
                    <span>{activeReward.kind === "taps" ? "🫵" : "🎁"}</span>
                    <span>{activeReward.label}</span>
                  </QuestRewardChip>
                </StackHintWrap>
              )}
            </QuestStackCard>
          );
        })}

        {singleQuests.map((quest, index) => {
          const questCopy = getQuestCopy(quest.id as QuestMessageId, locale);
          const reward = resolveQuestReward(quest, rewardItems, locale);
          const completedItemStyle = quest.completed
            ? {
                border: `1.5px solid ${quest.color}`,
                background: withAlpha(quest.color, 0.16),
              }
            : undefined;

          return (
            <QuestListItem
              $completed={quest.completed}
              key={quest.id}
              style={completedItemStyle}
            >
              <FillColumn $align="flex-start" $gap={".25rem"}>
                <QuestName style={quest.completed ? { color: quest.color } : undefined}>
                  {questCopy?.title ?? quest.title}
                </QuestName>
                <QuestInfos>{questCopy?.description ?? quest.description}</QuestInfos>
                <QuestRewardChip $kind={reward.kind}>
                  <span>{reward.kind === "taps" ? "🫵" : "🎁"}</span>
                  <span>{reward.label}</span>
                </QuestRewardChip>
                {quest.showProgress && (
                  <QuestProgressChip>
                    {Math.min(quest.progress, quest.maxProgress)} /{" "}
                    {quest.maxProgress}
                  </QuestProgressChip>
                )}
              </FillColumn>

              <QuestIcon
                animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
                initial={{ scale: 0, filter: "blur(4px)", opacity: 0 }}
                transition={{ delay: 0.2 + index * 0.06 }}
              >
                {quest.completed && (
                  <QuestTrophyIcon questId={quest.id} color={quest.color} size={24} />
                )}
              </QuestIcon>
            </QuestListItem>
          );
        })}
      </ScrollArea>
    </HugColumn>
  );
};

const QuestStackCard = styled.div`
  border: 1.5px solid transparent;
  border-radius: 1rem;
  padding: 0.7rem 0.75rem 0.68rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StackHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StackTitle = styled.h5`
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.15;
  color: #212121;
`;

const StackCounter = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.65;
  color: #4a4a4a;
`;

const StackTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StackTimelineTrack = styled.div`
  height: 0.62rem;
  border-radius: 999px;
  background: rgba(33, 33, 33, 0.12);
  position: relative;
  overflow: hidden;
`;

const StackTimelineFill = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 999px;
`;

const StackTimelineNode = styled.span`
  position: absolute;
  top: calc(50% - 0.34rem);
  width: 0.68rem;
  height: 0.68rem;
  border-radius: 999px;
  border: 2px solid transparent;
`;

const StackMilestoneMetaRow = styled.div`
  display: grid;
  gap: 0.3rem;
`;

const StackMilestoneMeta = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.14rem;
  opacity: ${(p) => (p.$active ? 1 : 0.88)};
`;

const StackMilestoneGoal = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  color: #212121;
`;

const StackHintWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StackHint = styled.p`
  font-size: 0.7rem;
  line-height: 1.2;
  opacity: 0.72;
  color: #2f2f2f;
  text-wrap: balance;
`;

const StackProgressChip = styled.span`
  margin-left: 0.45rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.62rem;
  font-weight: 700;
  opacity: 0.92;
  color: #343434;
  border: 1px solid rgba(33, 33, 33, 0.16);
  background: rgba(33, 33, 33, 0.06);
  border-radius: 999px;
  padding: 0.12rem 0.42rem;
  white-space: nowrap;
`;

const QuestRewardChip = styled.span<{ $kind: RewardKind; $compact?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  border-radius: 999px;
  padding: ${(p) => (p.$compact ? "0.1rem 0.36rem" : "0.14rem 0.46rem")};
  font-size: ${(p) => (p.$compact ? "0.58rem" : "0.66rem")};
  font-weight: 700;
  line-height: 1;
  border: 1px solid
    ${(p) =>
      p.$kind === "taps" ? "rgba(143, 110, 38, 0.22)" : "rgba(52, 77, 112, 0.2)"};
  color: ${(p) => (p.$kind === "taps" ? "#6f5220" : "#3f4f68")};
  background: ${(p) =>
    p.$kind === "taps" ? "rgba(143, 110, 38, 0.08)" : "rgba(52, 77, 112, 0.08)"};
  white-space: nowrap;
`;

const QuestIcon = styled(motion.div)`
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QuestListItem = styled(FillRow)<{
  $completed?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  position: relative;

  padding: 1rem;
  width: 100%;
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(33, 33, 33, 0.05);
  color: #212121;

  ${(p) =>
    p.$completed &&
    `
    p {
      text-decoration: line-through;
    }
  `}

  h5 {
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.6;
  }
`;

const QuestName = styled.h5`
  text-wrap: balance;
  line-height: 1.15;
`;

const QuestInfos = styled.p`
  text-wrap: balance;
  line-height: 1.25;
`;

const QuestProgressChip = styled.p`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  opacity: 0.92;
  color: #343434;
  border: 1px solid rgba(33, 33, 33, 0.16);
  background: rgba(33, 33, 33, 0.06);
  border-radius: 999px;
  padding: 0.16rem 0.46rem;
`;
