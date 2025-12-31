import { usePagination } from "@/hooks/usePagination";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillRow, HugColumn } from "@/layout";
import { Divider, DividerWithLabel } from "@/layout/atoms";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import {
  CameraViewId,
  getShopItemType,
  ShopItem,
  useGameStore,
  useViewStore,
} from "@/store";
import { useMessageStore } from "@/store/messageStore";
import styled from "styled-components";

export const DebugIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 1H56C68.7025 1 79 11.2975 79 24V56C79 68.7025 68.7025 79 56 79H24C11.2975 79 1 68.7025 1 56V24C1 11.2975 11.2975 1 24 1Z"
      fill="#CEAE91"
      stroke="#91765D"
      strokeWidth={2}
    />
    <path
      d="M22.8164 46.2725H28.7719"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51.8789 46.2725H57.8346"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M46.4297 28.8549V22.8994"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M46.4297 57.9623V52.0068"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22.8164 34.5625H28.7719"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34.2461 28.8549V22.8994"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51.8789 34.5625H57.8346"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34.2461 57.9623V52.0068"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M29.0746 49.0355C29.2269 50.407 30.3174 51.4967 31.6884 51.653C34.4684 51.9698 37.3646 52.3487 40.3404 52.3487C43.3161 52.3487 46.2123 51.9698 48.9924 51.653C50.3633 51.4967 51.4538 50.407 51.6061 49.0355C51.9138 46.2667 52.2707 43.3821 52.2707 40.4185C52.2707 37.4549 51.9138 34.5703 51.6061 31.8014C51.4538 30.43 50.3633 29.3404 48.9924 29.1841C46.2123 28.8672 43.3161 28.4883 40.3404 28.4883C37.3646 28.4883 34.4684 28.8672 31.6884 29.1841C30.3174 29.3404 29.2269 30.43 29.0746 31.8014C28.7669 34.5703 28.4102 37.4549 28.4102 40.4185C28.4102 43.3821 28.7669 46.2667 29.0746 49.0355Z"
      fill="#F0D5BD"
    />
    <path
      d="M29.0746 49.0355C29.2269 50.407 30.3174 51.4967 31.6884 51.653C34.4684 51.9698 37.3646 52.3487 40.3404 52.3487C43.3161 52.3487 46.2123 51.9698 48.9924 51.653C50.3633 51.4967 51.4538 50.407 51.6061 49.0355C51.9138 46.2667 52.2707 43.3821 52.2707 40.4185C52.2707 37.4549 51.9138 34.5703 51.6061 31.8014C51.4538 30.43 50.3633 29.3404 48.9924 29.1841C46.2123 28.8672 43.3161 28.4883 40.3404 28.4883C37.3646 28.4883 34.4684 28.8672 31.6884 29.1841C30.3174 29.3404 29.2269 30.43 29.0746 31.8014C28.7669 34.5703 28.4102 37.4549 28.4102 40.4185C28.4102 43.3821 28.7669 46.2667 29.0746 49.0355Z"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M40.3359 43.2979H44.4724"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const APP_ID: CameraViewId = "phone:debug";

export const DebugApp = () => {
  const { resetQuests } = useQuestSystem();
  const { clearShownFlags, clearAllMessages } = useMessageStore();

  const {
    statisticsVisible,
    toggleStatistics,
    resetGame: resetGameStore,
    isPaused,
    pauseGame,
    resumeGame,
    addTaps,
    buyAllUpgrades,
  } = useGameStore();

  const resetEverything = () => {
    // reset shop, upgrades, options, routes, debug, sound
    resetGameStore();

    // reset chat + flags
    clearShownFlags();
    clearAllMessages();

    resetQuests();
  };

  const toggleGamePaused = () => {
    if (isPaused) resumeGame();
    else pauseGame();
  };

  return (
    <HugColumn
      style={{
        width: "25rem",
        maxWidth: "100%",
        maxHeight: "23rem",
        overflowY: "auto",
        borderRadius: "1.25rem",
      }}
      $gap={"0.25rem"}
    >
      <SettingsWrapper>
        <h5>Auto-Tap</h5>

        <ToggleButton $active={!isPaused} onClick={toggleGamePaused}>
          {!isPaused ? "ON" : "OFF"}
        </ToggleButton>
      </SettingsWrapper>

      <DividerWithLabel>Utilities</DividerWithLabel>

      <SettingsWrapper>
        <h5>Performance Monitor</h5>

        <ToggleButton $active={statisticsVisible} onClick={toggleStatistics}>
          {statisticsVisible ? "ON" : "OFF"}
        </ToggleButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <HugColumn $gap={"0.5rem"}>
          <h5>Taps</h5>
          <p>Add 100 🫵</p>
        </HugColumn>

        <ActionButton onClick={() => addTaps(100)}>Add 🫵</ActionButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <HugColumn $gap={"0.5rem"}>
          <h5>Unlock Items</h5>
          <p>[Shop items, routes & upgrades]</p>
        </HugColumn>

        <ActionButton onClick={buyAllUpgrades}>Unlock</ActionButton>
      </SettingsWrapper>

      <DividerWithLabel>Gefährlich</DividerWithLabel>
      <SettingsWrapper $variant="destructive">
        <h5>Alle Daten zurücksetzen</h5>

        <ActionButton
          onClick={() =>
            confirm("This will delete all your progress.\nAre you sure?") &&
            resetEverything()
          }
          $variant="destructive"
        >
          Reset
        </ActionButton>
      </SettingsWrapper>
    </HugColumn>
  );
};

const SettingsWrapper = styled(FillRow)<{
  $variant?: "destructive" | "default";
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  padding: 1rem;
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.05);

  ${(p) =>
    p.$variant === "destructive" &&
    `
    background: rgba(255,0,0,0.2);
  `}

  h5 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.6;
    color: var(--text-color);
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

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.8);
  }

  ${(p) =>
    p.$variant === "destructive" &&
    `
    background-color: #ff0000;
    color: #ffffff;

     &:hover:not(:disabled) {
      background: #d60000
  }
  `}
`;
