import { useQuestSystem } from "@/hooks/useQuestSystem";
import { HugColumn, ListItemContainer } from "@/layout";
import { Divider, DividerWithLabel } from "@/layout/atoms";
import { formatNumber } from "@/molecules/TapCounter";
import {
  CameraViewId,
  useCameraStore,
  useCoreStore,
  useQuestStore,
} from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { ActionButton, SettingsWrapper, ToggleButton } from "./ui";
import { sileo } from "sileo";

export const DebugIcon = () => (
  <img src="/images/app-logos/debug.png" height={80} width={80} />
);

const APP_ID: CameraViewId = "phone:debug";

export const DebugApp = () => {
  const { resetQuests } = useQuestSystem();
  const { clearShownFlags, clearAllMessages, showMessages } = useMessageStore();

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
    getAutoTapRate,
    autoTapRate,
    getTotalTapMultiplier,
    getTotalTapsPerSecond,
    physicsDebugEnabled,
    togglePhysicsDebug,
  } = useCoreStore();

  const {
    quests,
    activeQuests,
    resetAllQuests,
    version: questsVersion,
  } = useQuestStore();

  const { clearAll } = useCameraStore();

  const resetEverything = () => {
    // reset shop, upgrades, options, routes, debug, sound
    resetGameStore();

    // reset camera
    clearAll();

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
          <Divider />

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="flex-start"
            $justify="space-between"
            $gap={"1rem"}
          >
            <p>Auto-Tap Rate:</p> <p>{getAutoTapRate()}</p>
            <p>Tap Power:</p> <p>{getTotalTapMultiplier()}</p>
            <p>🫵/s:</p> <p>{getTotalTapsPerSecond()}</p>
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

      <DividerWithLabel>Utilities</DividerWithLabel>

      <SettingsWrapper>
        <HugColumn $gap={"0.5rem"}>
          <h5>Toasts</h5>
          <p>Test notifications</p>
        </HugColumn>

        <ActionButton
          onClick={() =>
            sileo.success({
              title: "Info Toast",
              description: "Lorem Ipsum dolor sit amet",
            })
          }
        >
          Send 🍞
        </ActionButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <HugColumn $gap={"0.5rem"}>
          <h5>Chat</h5>
          <p>Test message system</p>
        </HugColumn>

        <ActionButton
          onClick={() => showMessages(["dev_message", "dev_message_2"])}
        >
          Send 💬
        </ActionButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <HugColumn $gap={"0.5rem"}>
          <h5>Taps</h5>
          <p>Add 10K taps 🫵</p>
        </HugColumn>

        <ActionButton onClick={() => addTaps(10000)}>Add 🫵</ActionButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <HugColumn $gap={"0.5rem"}>
          <h5>Unlock Everything</h5>
          <p>[Shop items, routes & upgrades]</p>
        </HugColumn>

        <ActionButton onClick={buyAllUpgrades}>Unlock 💯</ActionButton>
      </SettingsWrapper>

      <DividerWithLabel>Toggles</DividerWithLabel>

      <SettingsWrapper>
        <h5>Auto-Tap</h5>

        <ToggleButton $active={!isPaused} onClick={toggleGamePaused}>
          <span />
        </ToggleButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <h5>Physic Debugger</h5>

        <ToggleButton
          $active={physicsDebugEnabled}
          onClick={togglePhysicsDebug}
        >
          <span />
        </ToggleButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <h5>Performance Monitor</h5>

        <ToggleButton $active={statisticsVisible} onClick={toggleStatistics}>
          <span />
        </ToggleButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <h5>ViewMode Debugger</h5>

        <ToggleButton
          $active={viewDebuggerVisible}
          onClick={toggleViewDebugger}
        >
          <span />
        </ToggleButton>
      </SettingsWrapper>

      <DividerWithLabel>Danger zone</DividerWithLabel>
      <SettingsWrapper $variant="destructive">
        <h5>Reset Quests</h5>
        <ActionButton
          $variant="destructive"
          onClick={() =>
            confirm(
              "Die Quests App wird zurückgesetzt und geupdated.\nBist du sicher?",
            ) && resetAllQuests()
          }
        >
          Reset
        </ActionButton>
      </SettingsWrapper>

      <SettingsWrapper $variant="destructive">
        <h5>Reset Everything</h5>

        <ActionButton
          onClick={() =>
            confirm(
              "Das gesamte Spiel wird zurückgesetzt und geupdated.\nBist du sicher",
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
