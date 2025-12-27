import { FillColumn, FillRow, HugColumn } from "@/layout";
import { CameraViewId, useQuestStore } from "@/store";
import styled from "styled-components";

export const QuestsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x={1}
      y={1}
      width={78}
      height={78}
      rx={23}
      fill="#D6E46E"
      stroke="#B8BC4E"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2730)">
      <path
        d="M40.0017 57.7729C51.4302 57.7729 57.8588 51.3443 57.8588 39.9157C57.8588 28.4872 51.4302 22.0586 40.0017 22.0586C28.5731 22.0586 22.1445 28.4872 22.1445 39.9157C22.1445 51.3443 28.5731 57.7729 40.0017 57.7729Z"
        fill="#FCFFD7"
      />
      <path
        d="M30.9375 42.6641C32.3111 47.6091 37.8056 50.6311 42.7507 49.2574C45.7727 48.1585 48.2452 45.686 49.0694 42.6641"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.7266 34.4893V36.4893"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47.2773 34.4893V36.4893"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.0017 57.7729C51.4302 57.7729 57.8588 51.3443 57.8588 39.9157C57.8588 28.4872 51.4302 22.0586 40.0017 22.0586C28.5731 22.0586 22.1445 28.4872 22.1445 39.9157C22.1445 51.3443 28.5731 57.7729 40.0017 57.7729Z"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2730">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(20 19.916)"
        />
      </clipPath>
    </defs>
  </svg>
);

export const QuestsApp = () => {
  const { quests } = useQuestStore();

  return (
    <HugColumn style={{ width: "25rem", maxWidth: "100%" }} $gap={"0.25rem"}>
      {quests.map((quest) => (
        <QuestListItem $completed={quest.completed}>
          <QuestIcon>{quest.completed ? quest.icon : ""}</QuestIcon>

          <FillColumn $align="flex-start" $gap={".125rem"}>
            <h5>{quest.title}</h5>
            <p>{quest.description}</p>
          </FillColumn>
        </QuestListItem>
      ))}
    </HugColumn>
  );
};

const QuestIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 2rem;
  min-width: 2rem;
  border: 2.5px solid #fff;
  border-radius: 0.625rem;
  opacity: 0.4;
`;

const QuestListItem = styled(FillRow)<{
  $completed?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  padding: 1rem;
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.05);

  ${(p) =>
    p.$completed &&
    `
    background: radial-gradient(circle at top, rgba(255,255,84,0.2), rgba(255,255,255,0.1));
    border: 1.5px solid rgba(255, 255, 84, 0.2);

    ${QuestIcon}{
      border-color: #cece55;
      opacity: 1;
    }

    h5 {
      color: #cece55;
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

const ToggleButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: none;
  color: #212121;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  opacity: ${(p) => (p.$active ? 1 : 0.5)};

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
`;
const ActionButton = styled.button<{ $variant?: "destructive" | "default" }>`
  display: flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  opacity: 1;

  font-size: 1rem;
  font-weight: 700;

  background-color: #fff;
  color: #212121;

  ${(p) =>
    p.$variant === "destructive" &&
    `
    background-color: #ff0000;
    color: #ffffff;
  `}

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.5);
  }
`;
