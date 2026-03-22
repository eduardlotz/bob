import { HugColumn, ListItemContainer } from "@/layout";
import { Divider, DividerWithLabel } from "@/layout/atoms";
import { formatNumber } from "@/molecules/TapCounter";
import { useCameraStore, useCoreStore, useQuestStore } from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { ActionButton, SettingsWrapper, ToggleButton } from "./ui";
import { sileo } from "sileo";

export const DebugIcon = () => (
  <img src="/images/app-logos/debug.png" height={80} width={80} />
);

export const DebugApp = () => {
  const clearShownFlags = useMessageStore((state) => state.clearShownFlags);
  const clearAllMessages = useMessageStore((state) => state.clearAllMessages);
  const showMessages = useMessageStore((state) => state.showMessages);

  const viewDebuggerVisible = useCoreStore(
    (state) => state.viewDebuggerVisible,
  );
  const toggleViewDebugger = useCoreStore(
    (state) => state.toggleViewDebugger,
  );
  const statisticsVisible = useCoreStore((state) => state.statisticsVisible);
  const toggleStatistics = useCoreStore((state) => state.toggleStatistics);
  const physicsDebugEnabled = useCoreStore(
    (state) => state.physicsDebugEnabled,
  );
  const togglePhysicsDebug = useCoreStore((state) => state.togglePhysicsDebug);
  const cameraSettingsOverlayVisible = useCoreStore(
    (state) => state.cameraSettingsOverlayVisible,
  );
  const toggleCameraSettingsOverlay = useCoreStore(
    (state) => state.toggleCameraSettingsOverlay,
  );
  const lightSettingsOverlayVisible = useCoreStore(
    (state) => state.lightSettingsOverlayVisible,
  );
  const toggleLightSettingsOverlay = useCoreStore(
    (state) => state.toggleLightSettingsOverlay,
  );
  const resetGameStore = useCoreStore((state) => state.resetGame);
  const isPaused = useCoreStore((state) => state.isPaused);
  const pauseGame = useCoreStore((state) => state.pauseGame);
  const resumeGame = useCoreStore((state) => state.resumeGame);
  const addTaps = useCoreStore((state) => state.addTaps);
  const buyAllUpgrades = useCoreStore((state) => state.buyAllUpgrades);
  const version = useCoreStore((state) => state.version);
  const themes = useCoreStore((state) => state.themes);
  const currentTheme = useCoreStore((state) => state.currentTheme);
  const manualTaps = useCoreStore((state) => state.manualTaps);
  const taps = useCoreStore((state) => state.taps);
  const getAutoTapRate = useCoreStore((state) => state.getAutoTapRate);
  const getTotalTapMultiplier = useCoreStore(
    (state) => state.getTotalTapMultiplier,
  );
  const getTotalTapsPerSecond = useCoreStore(
    (state) => state.getTotalTapsPerSecond,
  );

  const quests = useQuestStore((state) => state.quests);
  const resetAllQuests = useQuestStore((state) => state.resetAllQuests);
  const questsVersion = useQuestStore((state) => state.version);

  const clearAll = useCameraStore((state) => state.clearAll);

  const resetEverything = () => {
    resetGameStore();
    clearAll();
    clearShownFlags();
    clearAllMessages();
    resetAllQuests();
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
        maxHeight: "28rem",
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
                .map((quest) => (quest.completed !== true ? quest.title : ""))
                .join(" / ")}
            </p>
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

      <SettingsWrapper>
        <h5>Camera Settings Overlay</h5>

        <ToggleButton
          $active={cameraSettingsOverlayVisible}
          onClick={toggleCameraSettingsOverlay}
        >
          <span />
        </ToggleButton>
      </SettingsWrapper>

      <SettingsWrapper>
        <h5>Light Settings Overlay</h5>

        <ToggleButton
          $active={lightSettingsOverlayVisible}
          onClick={toggleLightSettingsOverlay}
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
