import { useQuestSystem } from "@/hooks/useQuestSystem";
import { FillRow, HugColumn, ListItemContainer } from "@/layout";
import { Divider, DividerWithLabel } from "@/layout/atoms";
import { formatNumber } from "@/molecules/TapCounter";
import { CameraViewId, useCoreStore, useQuestStore } from "@/store";
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
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 24C0 10.7452 10.7452 0 24 0H56C69.2548 0 80 10.7452 80 24V56C80 69.2548 69.2548 80 56 80H24C10.7452 80 0 69.2548 0 56V24Z"
        fill="#CEAE91"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39.9844 21.6709C41.7609 21.6731 43.4807 22.3321 44.9851 23.5444C49.3069 27.0268 53.0697 30.7981 56.5466 35.1306C58.9266 38.0967 58.948 41.9104 56.5431 44.8843C53.0251 49.2349 49.2134 53.0438 44.8595 56.5598C41.9267 58.9283 38.1152 58.9072 35.1903 56.5632C30.7839 53.032 26.958 49.2063 23.4268 44.8001C21.0813 41.8734 21.0601 38.0618 23.4302 35.1271C26.9116 30.8163 30.6805 27.0368 34.9779 23.5477C36.4846 22.3245 38.2068 21.6688 39.9844 21.6709ZM40 29.0739C41.1835 29.0739 42.1429 30.0332 42.1429 31.2167V40.473C42.1429 41.6565 41.1835 42.6159 40 42.6159C38.8165 42.6159 37.8571 41.6565 37.8571 40.473V31.2167C37.8571 30.0332 38.8165 29.0739 40 29.0739ZM40 44.9639C41.1835 44.9639 42.1429 45.9233 42.1429 47.1068V48.7829C42.1429 49.9663 41.1835 50.9258 40 50.9258C38.8165 50.9258 37.8571 49.9663 37.8571 48.7829V47.1068C37.8571 45.9233 38.8165 44.9639 40 44.9639Z"
        fill="#F0D5BD"
      />
    </svg>
  </svg>
);

const APP_ID: CameraViewId = "phone:debug";

export const DebugApp = () => {
  const { resetQuests } = useQuestSystem();
  const { clearShownFlags, clearAllMessages } = useMessageStore();

  const {
    viewDebuggerVisible,
    toggleViewDebugger,
    statisticsVisible,
    toggleStatistics,
    resetGame: resetGameStore,
    isPaused,
    pauseGame,
    resumeGame,
    addTaps,
    buyAllUpgrades,
    version,
    themes,
    currentTheme,
    manualTaps,
    taps,
  } = useCoreStore();

  const {
    quests,
    activeQuests,
    resetAllQuests,
    version: questsVersion,
  } = useQuestStore();

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
        <HugColumn>
          <h5>Core Data</h5>
          <Divider />

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Store Version:</p> <p>{version}</p>
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="flex-start"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Farben:</p>{" "}
            <p
              style={{
                wordBreak: "break-all",
                lineHeight: 1.5,
              }}
            >
              {JSON.stringify(currentTheme?.colors)}
            </p>
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Theme:</p> <p>{currentTheme?.name}</p>
            <p>Verfügbar:</p> <p>{themes.map((t) => t.name).join(" | ")}</p>
          </ListItemContainer>

          <Divider />

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="flex-start"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Taps</p> <p></p>
            <p>Ingesamt:</p> <p>{formatNumber(taps)}</p>
            <p>Manuell:</p> <p>{formatNumber(manualTaps)}</p>
            <p>Automatisch:</p> <p>{formatNumber(taps - manualTaps)}</p>
          </ListItemContainer>
        </HugColumn>
      </SettingsWrapper>
      <SettingsWrapper>
        <HugColumn>
          <h5>Quests Data</h5>
          <Divider />

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Version:</p> <p>{questsVersion}</p>
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Verfügbar</p>
            <p>
              {quests
                .map((t) => (t.completed !== true ? t.title : ""))
                .join(" / ")}
            </p>
            {/* <p>Abgeschlossen</p>
            <p>
              {quests
                .map((t) => (t.completed === true ? t.title : ""))
                .join(" / ")}
            </p> */}
          </ListItemContainer>
        </HugColumn>
      </SettingsWrapper>
      <SettingsWrapper>
        <h5>Auto-Tap</h5>

        <ToggleButton $active={!isPaused} onClick={toggleGamePaused}>
          {!isPaused ? "ON" : "OFF"}
        </ToggleButton>
      </SettingsWrapper>

      <DividerWithLabel>Utilities</DividerWithLabel>

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

      <Divider />

      <SettingsWrapper>
        <h5>Performance Monitor</h5>

        <ToggleButton $active={statisticsVisible} onClick={toggleStatistics}>
          {statisticsVisible ? "ON" : "OFF"}
        </ToggleButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <h5>View Debugger</h5>

        <ToggleButton
          $active={viewDebuggerVisible}
          onClick={toggleViewDebugger}
        >
          {viewDebuggerVisible ? "ON" : "OFF"}
        </ToggleButton>
      </SettingsWrapper>

      <DividerWithLabel>Gefährlich</DividerWithLabel>
      <SettingsWrapper $variant="destructive">
        <h5>Quests zurücksetzen</h5>
        <ActionButton
          $variant="destructive"
          onClick={() =>
            confirm(
              "Die Quests App wird zurückgesetzt und geupdated.\nBist du sicher?"
            ) && resetAllQuests()
          }
        >
          Reset
        </ActionButton>
      </SettingsWrapper>

      <SettingsWrapper $variant="destructive">
        <h5>Spiel zurücksetzen</h5>

        <ActionButton
          onClick={() =>
            confirm(
              "Das gesamte Spiel wird zurückgesetzt und geupdated.\nBist du sicher"
            ) && resetEverything()
          }
          $variant="destructive"
        >
          Reset
        </ActionButton>
      </SettingsWrapper>
    </HugColumn>
  );
};

export const SettingsWrapper = styled(FillRow)<{
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
    line-height: 1.4;
    opacity: 0.6;
    color: var(--text-color);
  }

  b {
    font-weight: 600;
    opacity: 1;
  }
`;

export const ToggleButton = styled.button<{
  $active: boolean;
  $fillRow?: boolean;
}>`
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
  width: ${(p) => (p.$fillRow ? "100%" : "auto")};

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
`;

export const ActionButton = styled.button<{
  $variant?: "destructive" | "default";
}>`
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
