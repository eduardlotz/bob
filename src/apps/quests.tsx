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
    <rect width={80} height={80} rx={24} fill="#D6E46E" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M28.826 28.8563C26.4244 31.2579 25.0006 34.9289 25.0006 40.0152C25.0006 45.1015 26.4244 48.7727 28.826 51.1741C31.2276 53.5759 34.8987 54.9996 39.985 54.9996C45.0712 54.9996 48.7423 53.5759 51.144 51.1741C53.5454 48.7727 54.9694 45.1015 54.9694 40.0152C54.9694 38.8318 55.9288 37.8724 57.1123 37.8724C58.2957 37.8724 59.2551 38.8318 59.2551 40.0152C59.2551 45.8904 57.596 50.783 54.1743 54.2047C50.7526 57.6264 45.8601 59.2853 39.985 59.2853C34.1098 59.2853 29.2172 57.6264 25.7956 54.2047C22.3739 50.783 20.7148 45.8904 20.7148 40.0152C20.7148 34.1401 22.3739 29.2475 25.7956 25.8258C29.2172 22.4041 34.1098 20.7451 39.985 20.7451C41.1684 20.7451 42.1278 21.7045 42.1278 22.888C42.1278 24.0715 41.1684 25.0308 39.985 25.0308C34.8987 25.0308 31.2276 26.4547 28.826 28.8563ZM39.3345 30.9199C39.5964 32.074 38.8732 33.222 37.719 33.4839C36.1721 33.835 35.111 34.5523 34.4108 35.5267C33.6932 36.5254 33.2218 37.9819 33.2218 40.014C33.2218 42.4695 33.9058 44.0853 34.9098 45.0893C35.9138 46.0933 37.5296 46.7773 39.9851 46.7773C42.1167 46.7773 43.6146 46.2593 44.6186 45.4791C45.6007 44.7158 46.318 43.5415 46.6091 41.802C46.8045 40.6348 47.9091 39.8469 49.0763 40.0423C50.2437 40.2377 51.0314 41.3423 50.836 42.5095C50.3983 45.1249 49.2174 47.3329 47.2484 48.863C45.3012 50.3761 42.7949 51.063 39.9851 51.063C36.7407 51.063 33.9034 50.1439 31.8793 48.1198C29.8552 46.0957 28.9361 43.2584 28.9361 40.014C28.9361 37.336 29.5594 34.9339 30.9305 33.0258C32.3191 31.0934 34.3409 29.8559 36.7705 29.3045C37.9246 29.0425 39.0726 29.7658 39.3345 30.9199ZM47.1024 35.9273L41.5004 41.5292C40.6636 42.3661 39.3068 42.3661 38.47 41.5292C37.6331 40.6924 37.6332 39.3356 38.47 38.4988L44.0732 32.8955C43.5031 30.4954 44.2122 27.9557 45.9722 26.1955L50.32 21.8477C50.674 21.4935 51.188 21.3507 51.674 21.4713C52.16 21.5919 52.5477 21.9582 52.6951 22.4369L53.8428 26.1583L57.5643 27.3059C58.0428 27.4535 58.4091 27.841 58.5297 28.3271C58.6503 28.8132 58.5077 29.327 58.1534 29.6812L53.806 34.0289C52.0448 35.7899 49.5034 36.4988 47.1024 35.9273Z"
      fill="#FCFFD7"
    />
  </svg>
);

export const QuestsApp = () => {
  const { quests } = useQuestStore();

  return (
    <HugColumn style={{ width: "25rem", maxWidth: "100%" }} $gap={"0.25rem"}>
      {quests.map((quest) => (
        <QuestListItem $completed={quest.completed} key={quest.id}>
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
