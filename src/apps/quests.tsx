import { FillColumn, HugColumn, ScrollArea } from "@/layout";
import { useMemo } from "react";
import styled from "styled-components";
import { useI18n } from "@/i18n";
import { SHOP_ITEMS_QUEST_STACK_ID, useQuestStore } from "@/store/core/quests";
import { ItemStatusChip } from "./ui";
import {
  formatProgressValue,
  getRewardChipLabel,
  resolveQuestBadgeContent,
  resolveQuestReward,
  toQuestGroups,
  withAlpha,
} from "./quests.helpers";
import type { QuestBadgeContentValue } from "./quests.types";

export const QuestsIcon = () => (
  <img src="/images/app-logos/quests.png" height={80} width={80} />
);

export const QuestsCompletionChip = () => {
  const quests = useQuestStore((state) => state.quests);

  const { completedCount, totalCount } = useMemo(() => {
    const shopStackQuests = quests.filter(
      (quest) => quest.stackId === SHOP_ITEMS_QUEST_STACK_ID,
    );
    const otherQuests = quests.filter(
      (quest) => quest.stackId !== SHOP_ITEMS_QUEST_STACK_ID,
    );

    const total = otherQuests.length + (shopStackQuests.length > 0 ? 1 : 0);
    const completed =
      otherQuests.filter((quest) => quest.completed).length +
      (shopStackQuests.length > 0 &&
      shopStackQuests.every((quest) => quest.completed)
        ? 1
        : 0);

    return {
      completedCount: completed,
      totalCount: total,
    };
  }, [quests]);

  return (
    <ItemStatusChip>
      {completedCount}/{totalCount}
    </ItemStatusChip>
  );
};

const CompletedQuestBadge = ({
  content,
  color,
}: {
  content: QuestBadgeContentValue;
  color: string;
}) => (
  <CompletedQuestBadgeFrame>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g style={{ filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.15))" }}>
        <path
          d="M16.1882 4.85904C15.1653 5.73077 13.8934 6.25759 12.5537 6.3645C9.4273 6.61399 6.94471 9.09658 6.69522 12.223C6.58831 13.5627 6.06149 14.8345 5.18976 15.8575C3.1555 18.2446 3.1555 21.7555 5.18976 24.1426C6.06149 25.1655 6.58831 26.4373 6.69522 27.7771C6.94471 30.9034 9.4273 33.386 12.5537 33.6355C13.8934 33.7424 15.1653 34.2692 16.1882 35.141C18.5753 37.1752 22.0862 37.1752 24.4733 35.141C25.4962 34.2692 26.7681 33.7424 28.1078 33.6355C31.2342 33.386 33.7168 30.9034 33.9662 27.7771C34.0731 26.4373 34.6 25.1655 35.4717 24.1426C37.506 21.7555 37.506 18.2446 35.4717 15.8575C34.6 14.8345 34.0731 13.5627 33.9662 12.223C33.7168 9.09658 31.2342 6.61399 28.1078 6.3645C26.7681 6.25759 25.4962 5.73077 24.4733 4.85904C22.0862 2.82478 18.5753 2.82478 16.1882 4.85904Z"
          fill={color}
          stroke="white"
          strokeWidth="3.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>

    {content.isText ? (
      <QuestBadgeTextContent>
        <QuestBadgeValueText>{content.value}</QuestBadgeValueText>
        {content.metric && (
          <QuestBadgeMetricText>{content.metric}</QuestBadgeMetricText>
        )}
      </QuestBadgeTextContent>
    ) : (
      <QuestBadgeEmojiContent>{content.value}</QuestBadgeEmojiContent>
    )}
  </CompletedQuestBadgeFrame>
);

const QuestPlaceholderBadge = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15.8601 4.85901C14.8371 5.73074 13.5653 6.25756 12.2256 6.36447C9.09918 6.61396 6.61658 9.09655 6.3671 12.2229C6.26019 13.5626 5.73337 14.8345 4.86164 15.8574C2.82737 18.2445 2.82737 21.7554 4.86164 24.1425C5.73337 25.1655 6.26019 26.4373 6.3671 27.777C6.61658 30.9034 9.09918 33.386 12.2256 33.6355C13.5653 33.7424 14.8371 34.2692 15.8601 35.1409C18.2471 37.1752 21.7581 37.1752 24.1452 35.1409C25.1681 34.2692 26.4399 33.7424 27.7797 33.6355C30.906 33.386 33.3886 30.9034 33.6381 27.777C33.745 26.4373 34.2718 25.1655 35.1436 24.1425C37.1778 21.7554 37.1778 18.2445 35.1436 15.8574C34.2718 14.8345 33.745 13.5626 33.6381 12.2229C33.3886 9.09655 30.906 6.61396 27.7797 6.36447C26.4399 6.25756 25.1681 5.73074 24.1452 4.85901C21.7581 2.82475 18.2471 2.82475 15.8601 4.85901Z"
      fill="#C6C6C7"
      stroke="#C6C6C7"
      strokeWidth="3.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ItemRewardSmileyIcon = () => (
  <svg
    width="1.35rem"
    height="1.35rem"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g clipPath="url(#quest-item-smile-clip)">
      <path
        d="M11.9989 20.9278C17.7132 20.9278 20.9275 17.7135 20.9275 11.9992C20.9275 6.2849 17.7132 3.07062 11.9989 3.07062C6.2846 3.07062 3.07031 6.2849 3.07031 11.9992C3.07031 17.7135 6.2846 20.9278 11.9989 20.9278Z"
        fill="#F8DB59"
      />
      <path
        d="M7.46875 13.3734C8.15556 15.8459 10.9028 17.3569 13.3753 16.67C14.8863 16.1206 16.1226 14.8843 16.5347 13.3734"
        stroke="#212121"
        strokeWidth="1.71"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.35156 9.28644V10.2864"
        stroke="#212121"
        strokeWidth="1.71"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6406 9.28644V10.2864"
        stroke="#212121"
        strokeWidth="1.71"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9989 20.9278C17.7132 20.9278 20.9275 17.7135 20.9275 11.9992C20.9275 6.2849 17.7132 3.07062 11.9989 3.07062C6.2846 3.07062 3.07031 6.2849 3.07031 11.9992C3.07031 17.7135 6.2846 20.9278 11.9989 20.9278Z"
        stroke="#212121"
        strokeWidth="1.71"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="quest-item-smile-clip">
        <rect width="20" height="20" fill="white" transform="translate(2 2)" />
      </clipPath>
    </defs>
  </svg>
);

export const QuestsApp = () => {
  const { quests } = useQuestStore();
  const { locale } = useI18n();

  const visibleQuests = useMemo(
    () =>
      quests.filter((quest) => !quest.hiddenUntilCompleted || quest.completed),
    [quests],
  );

  const questGroups = useMemo(
    () => toQuestGroups(visibleQuests, locale),
    [locale, visibleQuests],
  );

  return (
    <HugColumn
      style={{ width: "100%", maxWidth: "26.25rem", maxHeight: "26.25rem" }}
      $gap={"0.25rem"}
    >
      <ScrollArea $direction="vertical">
        <QuestList>
          {questGroups.map((group) => {
            const completedCount = group.quests.filter(
              (quest) => quest.completed,
            ).length;
            const isCompleted = completedCount === group.quests.length;
            const activeQuest =
              group.quests.find((quest) => !quest.completed) ??
              group.quests[group.quests.length - 1];

            const reward = resolveQuestReward(activeQuest);
            const showProgress =
              !isCompleted &&
              (group.isStack ||
                activeQuest.showProgress ||
                activeQuest.maxProgress > 1);
            const rawProgressRatio =
              activeQuest.maxProgress > 0
                ? Math.min(activeQuest.progress, activeQuest.maxProgress) /
                  activeQuest.maxProgress
                : 0;
            const progressRatio = Math.max(0, Math.min(1, rawProgressRatio));
            const progressLabel = formatProgressValue(activeQuest);
            const showRewardChip = isCompleted && reward !== null;
            const strikeTitle =
              isCompleted && activeQuest.progressionKind !== "milestone";
            const strikeDescription = isCompleted;

            const badges = group.isStack ? group.quests : [activeQuest];

            return (
              <QuestListItem
                $withProgress={showProgress}
                $completed={isCompleted}
                key={group.id}
              >
                <QuestHeader>
                  <QuestTextGroup>
                    <QuestName $struck={strikeTitle}>{group.title}</QuestName>

                    <QuestInfos $struck={strikeDescription}>
                      {group.description}
                    </QuestInfos>

                    {showRewardChip && reward && (
                      <QuestRewardChip>
                        {reward.kind === "item" ? (
                          <ItemRewardSmileyIcon />
                        ) : (
                          <RewardTapIcon aria-hidden="true">👊</RewardTapIcon>
                        )}
                        <QuestRewardLabel>
                          {getRewardChipLabel(reward, locale)}
                        </QuestRewardLabel>
                      </QuestRewardChip>
                    )}
                  </QuestTextGroup>

                  <QuestBadgeStack>
                    {[...badges].reverse().map((quest, index) => (
                      <QuestBadgeLayer key={quest.id} $index={index}>
                        {quest.completed ? (
                          <CompletedQuestBadge
                            content={resolveQuestBadgeContent(quest)}
                            color={quest.color}
                          />
                        ) : (
                          <QuestPlaceholderBadge />
                        )}
                      </QuestBadgeLayer>
                    ))}
                  </QuestBadgeStack>
                </QuestHeader>

                {showProgress && (
                  <QuestProgressTrack>
                    <QuestProgressInner>
                      <QuestProgressFill
                        style={{
                          width: `${progressRatio * 100}%`,
                          background: withAlpha(
                            "#a7a7a7",
                            isCompleted ? 0.38 : 0.25,
                          ),
                        }}
                      />

                      <QuestProgressLabel>{progressLabel}</QuestProgressLabel>
                    </QuestProgressInner>
                  </QuestProgressTrack>
                )}
              </QuestListItem>
            );
          })}
        </QuestList>
      </ScrollArea>
    </HugColumn>
  );
};

const QuestList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.05rem 0.05rem 0.15rem;
`;

const QuestListItem = styled(FillColumn)<{
  $withProgress: boolean;
  $completed: boolean;
}>`
  width: 100%;
  border-radius: 1.35rem;
  border: ${(p) => (p.$completed ? "1.5px solid #212121" : "0")};
  background: rgba(33, 33, 33, 0.07);
  align-items: stretch;
  justify-content: flex-start;
  gap: 0.52rem;
  padding: 0.78rem 0.76rem 0.74rem;
`;

const QuestHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.52rem;
  padding: 0.5rem 0.5rem;
`;

const QuestTextGroup = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const QuestBadgeStack = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 2.75rem;
  padding-left: 0.65rem;
`;

const QuestBadgeLayer = styled.div<{ $index: number }>`
  margin-left: ${(p) => (p.$index === 0 ? "0" : "-1.03rem")};
  display: inline-flex;
`;

const CompletedQuestBadgeFrame = styled.div`
  width: 2.75rem;
  height: 2.75rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const QuestBadgeEmojiContent = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-0.13rem);
  font-size: 1rem;
  line-height: 1;
  font-weight: 700;
  color: #212121;
`;

const QuestBadgeTextContent = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translateY(-0.14rem);
  color: #ffffff;
  filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.65));
`;

const QuestBadgeValueText = styled.span`
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1;
`;

const QuestBadgeMetricText = styled.span`
  margin-top: 0.05rem;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  text-transform: lowercase;
  margin-top: -0.25rem;
`;

const QuestProgressTrack = styled.div`
  position: relative;
  width: 100%;
  height: 2.1rem;
  border-radius: 1.1rem;
  padding: 4px;
  background: rgba(245, 245, 245, 0.8);
  border: 1px solid rgba(33, 33, 33, 0.08);
`;

const QuestProgressInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: calc(1.1rem - 4px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(238, 238, 238, 0.9);
`;

const QuestProgressFill = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  transition: width 0.2s ease-out;
`;

const QuestProgressLabel = styled.span`
  position: relative;
  z-index: 1;
  font-size: 0.82rem;
  font-weight: 900;
  color: #4d4d4d;
  line-height: 1;
`;

const QuestName = styled.h5<{ $struck?: boolean }>`
  text-wrap: pretty;
  line-height: 1.1;
  font-size: 1.06rem;
  font-weight: 700;
  color: #1f1f1f;
  text-decoration: ${(p) => (p.$struck ? "line-through" : "none")};
`;

const QuestInfos = styled.p<{ $struck?: boolean }>`
  text-wrap: pretty;
  line-height: 1.16;
  font-size: 0.72rem;
  font-weight: 500;
  color: #6a6a6a;
  text-decoration: ${(p) => (p.$struck ? "line-through" : "none")};
`;

const QuestRewardChip = styled.span`
  margin-top: 0.38rem;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  border-radius: 999px;
  padding: 0.18rem 0.52rem 0.18rem 0.34rem;
  background: rgba(33, 33, 33, 0.08);
`;

const RewardTapIcon = styled.span`
  font-size: 1.05rem;
  line-height: 1;
`;

const QuestRewardLabel = styled.span`
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 900;
  color: #1f1f1f;
`;
