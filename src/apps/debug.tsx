import { useQuestSystem } from "@/hooks/useQuestSystem";
import { HugColumn, ListItemContainer } from "@/layout";
import { Divider, DividerWithLabel } from "@/layout/atoms";
import { formatNumber } from "@/molecules/TapCounter";
import { CameraViewId, useCoreStore, useQuestStore } from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { ActionButton, SettingsWrapper, ToggleButton } from "./ui";
import { sileo } from "sileo";

export const DebugIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_ii_3758_811)">
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="#CEAE91"
      />
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="url(#paint0_radial_3758_811)"
      />
    </g>
    <g clipPath="url(#clip0_3758_811)">
      <g filter="url(#filter1_dii_3758_811)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M49.9787 22.9834C52.5972 22.9866 55.1322 23.958 57.3498 25.7449C63.72 30.878 69.2664 36.4369 74.3913 42.823C77.8994 47.1951 77.931 52.8163 74.3862 57.1999C69.2007 63.6127 63.5822 69.227 57.1645 74.4095C52.8416 77.9008 47.2235 77.8696 42.9122 74.4146C36.4171 69.2097 30.7778 63.5706 25.5728 57.0759C22.1155 52.7618 22.0843 47.1435 25.5778 42.8179C30.7094 36.4637 36.2648 30.8927 42.5992 25.7498C44.8199 23.9468 47.3585 22.9802 49.9787 22.9834ZM50.0017 33.8954C51.7461 33.8954 53.1602 35.3095 53.1602 37.0539V50.6977C53.1602 52.4421 51.7461 53.8563 50.0017 53.8563C48.2572 53.8563 46.8431 52.4421 46.8431 50.6977V37.0539C46.8431 35.3095 48.2572 33.8954 50.0017 33.8954ZM50.0017 57.3173C51.7461 57.3173 53.1602 58.7315 53.1602 60.4759V62.9465C53.1602 64.6908 51.7461 66.105 50.0017 66.105C48.2572 66.105 46.8431 64.6908 46.8431 62.9465V60.4759C46.8431 58.7315 48.2572 57.3173 50.0017 57.3173Z"
          fill="url(#paint1_radial_3758_811)"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_ii_3758_811"
        x={0}
        y={-2.5}
        width={100}
        height={102.5}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.5} />
        <feGaussianBlur stdDeviation={3.75} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3758_811"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.25} />
        <feGaussianBlur stdDeviation={1.25} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.866667 0 0 0 0 0.278431 0 0 0 0 0.329412 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3758_811"
          result="effect2_innerShadow_3758_811"
        />
      </filter>
      <filter
        id="filter1_dii_3758_811"
        x={21.3768}
        y={20.0354}
        width={57.2464}
        height={59.3691}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={0.795966} />
        <feGaussianBlur stdDeviation={0.795966} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3758_811"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3758_811"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.948} />
        <feGaussianBlur stdDeviation={4.422} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.129412 0 0 0 0 0.129412 0 0 0 0 0.129412 0 0 0 0.6 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3758_811"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.474} />
        <feGaussianBlur stdDeviation={1.474} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.960561 0 0 0 0 0.336727 0 0 0 0 0.403171 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="effect2_innerShadow_3758_811"
          result="effect3_innerShadow_3758_811"
        />
      </filter>
      <radialGradient
        id="paint0_radial_3758_811"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(50 50) rotate(90) scale(50 127.014)"
      >
        <stop stopColor="#45012F" />
        <stop offset={1} stopColor="#B90517" />
      </radialGradient>
      <radialGradient
        id="paint1_radial_3758_811"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(50.0012 50.0002) rotate(90) scale(27.0168 27.0324)"
      >
        <stop offset={0.341346} stopColor="#8A0C19" />
        <stop offset={1} stopColor="#F36674" />
      </radialGradient>
      <clipPath id="clip0_3758_811">
        <rect
          width={58.96}
          height={58.96}
          fill="white"
          transform="translate(20.5156 20.5195)"
        />
      </clipPath>
    </defs>
  </svg>
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
