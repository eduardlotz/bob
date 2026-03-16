import { FillColumn, FillRow, HugColumn, ScrollArea } from "@/layout";
import { useCoreStore, useQuestStore } from "@/store";
import { formatNumber } from "@/molecules/TapCounter";
import { motion } from "motion/react";
import styled from "styled-components";
import { ItemStatusChip } from "./ui";

export const QuestsIcon = () => (
  <img src="/images/app-logos/quests.png" height={80} width={80} />
);

export const QuestsApp = () => {
  const { quests } = useQuestStore();
  const { bobItems, tapEffects, decorations } = useCoreStore();

  const rewardItems = [...bobItems, ...tapEffects, ...decorations];

  return (
    <HugColumn
      style={{ width: "320px", maxWidth: "100%", maxHeight: "360px" }}
      $gap={"0.25rem"}
    >
      <ScrollArea $direction="vertical">
        {quests.map((quest, index) => {
          const reward =
            quest.reward.type === "taps_reward"
              ? `+${formatNumber(Number(quest.reward.amount) || 0)} 🫵`
              : (() => {
                  const item = rewardItems.find(
                    (entry) => entry.id === quest.reward.amount,
                  );
                  if (!item) return "+ 🎁";
                  const itemIcon =
                    "icon" in item && item.icon ? item.icon : "🎁";
                  return `+ ${itemIcon} ${item.name}`;
                })();

          return (
            <QuestListItem $completed={quest.completed} key={quest.id}>
              <FillColumn $align="flex-start" $gap={".25rem"}>
                <QuestName>{quest.title}</QuestName>
                <QuestInfos>{quest.description}</QuestInfos>
                {/* {quest.completed && <RewardChip>{reward}</RewardChip>} */}
              </FillColumn>

              <QuestIcon
                animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
                initial={{ scale: 0, filter: "blur(4px)", opacity: 0 }}
                transition={{ delay: 0.5 + index * 0.2 }}
              >
                {quest.completed ? <QuestCheckmarkIcon /> : ""}
              </QuestIcon>
            </QuestListItem>
          );
        })}
      </ScrollArea>
    </HugColumn>
  );
};

const QuestCheckmarkIcon = () => (
  <svg
    width={32}
    height={32}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.35465 1.08218C6.721 0.767629 7.26188 0.768405 7.62808 1.08316C7.88705 1.30575 8.14151 1.52854 8.39176 1.7521C8.72463 1.68263 9.06083 1.61586 9.40055 1.55191C9.87506 1.46274 10.3433 1.73298 10.5031 2.18863C10.6161 2.51105 10.7243 2.83165 10.8293 3.15054C11.1523 3.2568 11.4767 3.36712 11.8029 3.4816C12.2586 3.64153 12.5291 4.10955 12.4396 4.58414C12.3752 4.9255 12.3082 5.26278 12.2384 5.59683C12.466 5.85142 12.6925 6.11056 12.9191 6.37418C13.2339 6.74045 13.2338 7.28127 12.9191 7.64762C12.6939 7.90978 12.468 8.16758 12.2414 8.42105C12.31 8.74964 12.3763 9.08147 12.4396 9.41715C12.529 9.89166 12.2585 10.3598 11.8029 10.5197C11.4767 10.6342 11.1523 10.7445 10.8293 10.8507C10.7243 11.1695 10.6151 11.4903 10.5021 11.8127C10.3422 12.2679 9.87485 12.5384 9.40055 12.4494C9.06661 12.3865 8.73566 12.3203 8.40836 12.2521C8.15912 12.4747 7.90623 12.6968 7.64859 12.9181C7.28223 13.2328 6.74142 13.2329 6.37515 12.9181C6.11615 12.6955 5.86176 12.4727 5.61148 12.2492C5.27857 12.3187 4.94246 12.3854 4.60269 12.4494C4.12819 12.5387 3.66007 12.2681 3.50015 11.8127C3.38712 11.4903 3.27798 11.1695 3.173 10.8507C2.84998 10.7445 2.52556 10.6342 2.19937 10.5197C1.74381 10.3597 1.47421 9.89163 1.56363 9.41715C1.62804 9.07555 1.69498 8.73776 1.7648 8.40348C1.53738 8.14908 1.31054 7.89053 1.08413 7.62711C0.769382 7.2609 0.768605 6.72003 1.08316 6.35367C1.3084 6.09145 1.53429 5.83378 1.76089 5.58023C1.69238 5.25162 1.62693 4.91982 1.56363 4.58414C1.47416 4.10967 1.74387 3.64164 2.19937 3.4816C2.5255 3.36714 2.85003 3.2568 3.173 3.15054C3.27798 2.83165 3.38711 2.51105 3.50015 2.18863C3.66 1.73298 4.12813 1.46257 4.60269 1.55191C4.93652 1.61476 5.2667 1.68002 5.5939 1.7482C5.84329 1.52546 6.09686 1.30361 6.35465 1.08218ZM9.37223 4.66421C9.1867 4.45969 8.86972 4.44451 8.66519 4.63004C7.93943 5.28843 7.39601 5.8785 6.93765 6.5939C6.5928 7.13218 6.30363 7.72953 6.01871 8.46109L4.98062 7.3898C4.78844 7.19161 4.47184 7.18698 4.27359 7.37906C4.07539 7.57125 4.06978 7.88784 4.26187 8.08609L5.85562 9.72867C5.97638 9.85282 6.15327 9.9057 6.32242 9.86832C6.49143 9.83072 6.62968 9.7086 6.68668 9.54508C7.05531 8.48614 7.38313 7.75266 7.77945 7.13394C8.17394 6.51821 8.65028 5.99416 9.33805 5.37027C9.54207 5.18482 9.55724 4.86863 9.37223 4.66421Z"
      fill="currentColor"
    />
  </svg>
);

const QuestIcon = styled(motion.div)`
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;

  color: #4178f7;
`;

const RewardChip = styled(ItemStatusChip)`
  position: absolute;
  left: 1em;
  bottom: 1em;
  box-shadow: none;
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
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(33, 33, 33, 0.05);
  color: #212121;

  ${(p) =>
    p.$completed &&
    `
    background: rgba(65, 120, 247, 0.1);
    
    border: 1.5px solid #4178f7;

    h5 {
      color: #4178f7;
    }

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
