import { FillColumn, HugColumn, ScrollArea } from "@/layout";
import { useMemo } from "react";
import styled from "styled-components";
import { useI18n } from "@/i18n";
import { useQuestStore } from "@/store/core/quests";
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
  const { locale, messages } = useI18n();

  const { completedCount, totalCount } = useMemo(() => {
    const groups = toQuestGroups(quests, locale, messages.quests);
    const total = groups.length;
    const completed = groups.filter((group) =>
      group.quests.every((quest) => quest.completed),
    ).length;

    return {
      completedCount: completed,
      totalCount: total,
    };
  }, [locale, messages.quests, quests]);

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
        <QuestBadgeTextInner>
          <QuestBadgeValueText $hasMetric={Boolean(content.metric)}>
            {content.value}
          </QuestBadgeValueText>
          {content.metric && (
            <QuestBadgeMetricText>{content.metric}</QuestBadgeMetricText>
          )}
        </QuestBadgeTextInner>
      </QuestBadgeTextContent>
    ) : (
      <QuestBadgeEmojiContent>{content.value}</QuestBadgeEmojiContent>
    )}
  </CompletedQuestBadgeFrame>
);

const QuestPlaceholderBadge = () => (
  <CompletedQuestBadgeFrame aria-hidden="true">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.1882 4.85904C15.1653 5.73077 13.8934 6.25759 12.5537 6.3645C9.4273 6.61399 6.94471 9.09658 6.69522 12.223C6.58831 13.5627 6.06149 14.8345 5.18976 15.8575C3.1555 18.2446 3.1555 21.7555 5.18976 24.1426C6.06149 25.1655 6.58831 26.4373 6.69522 27.7771C6.94471 30.9034 9.4273 33.386 12.5537 33.6355C13.8934 33.7424 15.1653 34.2692 16.1882 35.141C18.5753 37.1752 22.0862 37.1752 24.4733 35.141C25.4962 34.2692 26.7681 33.7424 28.1078 33.6355C31.2342 33.386 33.7168 30.9034 33.9662 27.7771C34.0731 26.4373 34.6 25.1655 35.4717 24.1426C37.506 21.7555 37.506 18.2446 35.4717 15.8575C34.6 14.8345 34.0731 13.5627 33.9662 12.223C33.7168 9.09658 31.2342 6.61399 28.1078 6.3645C26.7681 6.25759 25.4962 5.73077 24.4733 4.85904C22.0862 2.82478 18.5753 2.82478 16.1882 4.85904Z"
        fill="#C6C6C7"
        stroke="#C6C6C7"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    {/* <QuestPlaceholderMark>?</QuestPlaceholderMark> */}
  </CompletedQuestBadgeFrame>
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
  const { locale, messages } = useI18n();

  const questGroups = useMemo(
    () => toQuestGroups(quests, locale, messages.quests),
    [locale, messages.quests, quests],
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
            const activeQuest = group.activeQuest;

            const reward = resolveQuestReward(activeQuest, locale);
            const showProgress =
              !group.isHidden &&
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
            const progressLabel = formatProgressValue(activeQuest, locale);
            const showRewardChip =
              !group.isHidden && isCompleted && reward !== null;
            const strikeTitle =
              !group.isMilestoneStack &&
              isCompleted &&
              activeQuest.progressionKind !== "milestone";
            const strikeDescription = !group.isMilestoneStack && isCompleted;

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

                    {group.secondaryDescription && (
                      <QuestSecondaryInfo>
                        {group.secondaryDescription}
                      </QuestSecondaryInfo>
                    )}

                    {showRewardChip && reward && (
                      <QuestRewardChip>
                        {reward.kind === "item" ? (
                          <ItemRewardSmileyIcon />
                        ) : (
                          <RewardTapIcon aria-hidden="true">👊</RewardTapIcon>
                        )}
                        <QuestRewardLabel>
                          {getRewardChipLabel(reward, messages.quests)}
                        </QuestRewardLabel>
                      </QuestRewardChip>
                    )}
                  </QuestTextGroup>

                  <QuestBadgeStack>
                    {[...badges].reverse().map((quest, index) => (
                      <QuestBadgeLayer key={quest.id} $index={index}>
                        {quest.completed ? (
                          <CompletedQuestBadge
                            content={resolveQuestBadgeContent(quest, locale)}
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
  /* border: ${(p) => (p.$completed ? "1.5px solid #212121" : "0")}; */
  background: rgba(33, 33, 33, 0.05);
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
  /* min-height: 3.5tm; */
  padding-left: 0.65rem;
`;

const QuestBadgeLayer = styled.div<{ $index: number }>`
  margin-left: ${(p) => (p.$index === 0 ? "0" : "-1.03rem")};
  display: inline-flex;
`;

const CompletedQuestBadgeFrame = styled.div`
  width: 3.5rem;
  height: 3.5rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-0.02rem);
  color: #ffffff;
  filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.25));
  text-align: center;
`;

const QuestBadgeTextInner = styled.span`
  width: min(2.55rem, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-inline: 0.08rem;
`;

const QuestBadgeValueText = styled.span<{ $hasMetric?: boolean }>`
  display: block;
  width: 100%;
  font-size: ${(p) =>
    p.$hasMetric
      ? "clamp(1.05rem, 0.82rem + 0.9vw, 1.42rem)"
      : "clamp(0.82rem, 0.64rem + 0.85vw, 1.18rem)"};
  font-weight: 900;
  line-height: 0.95;
  text-align: center;
  white-space: nowrap;
`;

const QuestBadgeMetricText = styled.span`
  max-width: 100%;
  margin-top: -0.3rem;
  font-size: clamp(0.72rem, 0.6rem + 0.45vw, 0.88rem);
  font-weight: 800;
  line-height: 0.95;
  text-align: center;
  text-transform: lowercase;
  letter-spacing: 0.03em;
`;

const QuestPlaceholderMark = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1;
  filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.18));
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
  opacity: ${(p) => (p.$struck ? 0.3 : 1)};
`;

const QuestInfos = styled.p<{ $struck?: boolean }>`
  text-wrap: pretty;
  line-height: 1.16;
  font-size: 0.72rem;
  font-weight: 500;
  color: #6a6a6a;
  text-decoration: ${(p) => (p.$struck ? "line-through" : "none")};
  opacity: ${(p) => (p.$struck ? 0.3 : 1)};
`;

const QuestSecondaryInfo = styled.p`
  margin-top: 0.12rem;
  text-wrap: pretty;
  line-height: 1.2;
  font-size: 0.68rem;
  font-weight: 700;
  color: #4d4d4d;
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
