import { usePagination } from "@/hooks/usePagination";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import {
  FillColumn,
  FillRow,
  HugColumn,
  HugRow,
  ListItemContainer,
} from "@/layout";
import { Divider, RowLabel, ValueChip, ValueSlider } from "@/layout/atoms";
import { CameraViewId, useGameStore, useViewStore } from "@/store";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { match } from "ts-pattern";
import { SettingsWrapper, ToggleButton } from "./debug";

export const OptionsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 24C0 10.7452 10.7452 0 24 0H56C69.2548 0 80 10.7452 80 24V56C80 69.2548 69.2548 80 56 80H24C10.7452 80 0 69.2548 0 56V24Z"
      fill="#6B6E75"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M38.8815 20.7139H41.1215C41.9596 20.7156 42.7778 20.9694 43.4697 21.4422C44.1617 21.9151 44.6954 22.5851 45.0015 23.3653L46.0272 25.971L49.1415 27.7682L51.9015 27.3482C52.7317 27.2231 53.5803 27.3512 54.3366 27.7156C55.093 28.08 55.7219 28.6638 56.1415 29.391L57.2587 31.3224C57.6795 32.0493 57.8711 32.8863 57.8084 33.7239C57.7457 34.5615 57.4316 35.3606 56.9072 36.0167L55.1644 38.1967V41.8024L56.8958 43.9824C57.4187 44.6393 57.7319 45.4382 57.7946 46.2755C57.8572 47.1127 57.6665 47.9494 57.2472 48.6767L56.133 50.6082C55.7131 51.335 55.084 51.9187 54.3278 52.283C53.5715 52.6474 52.7231 52.7756 51.893 52.651L49.1301 52.231L46.013 54.031L44.993 56.631C44.6873 57.4117 44.1538 58.0824 43.4618 58.5558C42.7698 59.0292 41.9514 59.2834 41.113 59.2853H38.8758C38.0374 59.2834 37.219 59.0292 36.527 58.5558C35.835 58.0824 35.3015 57.4117 34.9958 56.631L33.9758 54.031L30.8587 52.231L28.0958 52.651C27.2659 52.7763 26.4176 52.6487 25.6613 52.2848C24.905 51.9209 24.2758 51.3376 23.8558 50.611L22.7415 48.6767C22.3207 47.9498 22.1291 47.1128 22.1918 46.2753C22.2545 45.4377 22.5686 44.6386 23.093 43.9824L24.8358 41.8024V38.1967L23.093 36.0167C22.5689 35.3605 22.2547 34.5616 22.1915 33.7242C22.1283 32.8868 22.319 32.0498 22.7387 31.3224L23.853 29.391C24.2727 28.6633 24.9022 28.0792 25.6591 27.7147C26.416 27.3503 27.2652 27.2225 28.0958 27.3482L30.8501 27.7682L33.9758 25.9567L35.0015 23.3653C35.307 22.5847 35.8405 21.9142 36.5326 21.4412C37.2247 20.9683 38.0433 20.7148 38.8815 20.7139ZM45.7015 39.9996C45.7015 43.6482 43.6472 45.7024 39.9987 45.7024C36.3501 45.7024 34.2958 43.6482 34.2958 39.9996C34.2958 36.351 36.3501 34.2967 39.9987 34.2967C43.6472 34.2967 45.7015 36.351 45.7015 39.9996Z"
      fill="#D7D8DD"
    />
  </svg>
);

type OptionsTab = "theme" | "audio" | "graphics";

const tabs = [
  {
    id: "theme" as OptionsTab,
    name: "Theme",
  },
  {
    id: "audio" as OptionsTab,
    name: "Audio",
  },
  {
    id: "graphics" as OptionsTab,
    name: "Grafik",
  },
];

const APP_ID: CameraViewId = "phone:options";

export function OptionsApp() {
  const [activeTab, setActiveTab] = useState<OptionsTab>("theme");

  const { themes, activateTheme, previewTheme, resetPreview } = useGameStore();

  const { transitionToView } = useViewStore();

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(themes, 1);

  const initialIndex = useMemo(
    () => themes.findIndex((t) => t.active),
    [activeTab]
  );
  const currentItem = data[0];

  useEffect(() => {
    transitionToView(APP_ID);
    goTo(initialIndex);

    return () => resetPreview();
  }, []);

  useEffect(() => {
    if (activeTab === "theme") previewTheme(currentItem.id);
    else resetPreview();
  }, [page, activeTab]);

  const handleTabChange = (id: OptionsTab) => {
    if (id === "theme") goTo(initialIndex);
    setActiveTab(id);
  };

  const handleButton = () => {
    activateTheme(currentItem.id);
  };

  const buttonLabel = match(currentItem)
    .with({ active: true }, () => "Aktiv")
    .otherwise(() => "Auswählen");

  const handleNext = () => {
    if (hasNext) next();
    else goTo(0);
  };

  const handlePrev = () => {
    if (hasPrev) prev();
    else goTo(pageCount - 1);
  };

  // TODO: fix re-render every second
  const ThemeOverlays = () => (
    <FixedAnchor>
      <ShopContainer
        key="options-app-container"
        // initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(6px)" }}
        initial={false}
        animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scaleX: 0.9, y: 80, filter: "blur(6px)" }}
        transition={{
          type: "spring" as const,
          bounce: 0.5,
        }}
      >
        <ContentControls>
          <ItemStatusChip $variant="dark">
            <span>{currentItem.name}</span>
          </ItemStatusChip>

          <FillRow $justify="space-between">
            <PaginationButton onClick={handlePrev} disabled={pageCount === 1}>
              <ArrowLeftIcon />
            </PaginationButton>

            <ShopItemButton
              key={currentItem.id + "_action_button"}
              $selected={currentItem.active}
              disabled={currentItem.active}
              onClick={handleButton}
              role="button"
            >
              {buttonLabel}
            </ShopItemButton>

            <PaginationButton onClick={handleNext} disabled={pageCount === 1}>
              <ArrowRightIcon />
            </PaginationButton>
          </FillRow>

          <PaginationDots key={`dots-${activeTab}`}>
            {Array(pageCount)
              .fill(null)
              .map((_, i) => (
                <motion.span
                  key={`shop_pagination_dot_${i}`}
                  animate={{
                    width: page === i ? "12px" : "6px",
                    opacity: page === i ? 1 : 0.25,
                  }}
                  // initial={{ width: "6px", opacity: 0.25 }}
                  initial={false}
                ></motion.span>
              ))}
          </PaginationDots>
        </ContentControls>
      </ShopContainer>
    </FixedAnchor>
  );

  const AudioView = () => {
    const sound = useSoundSystem();

    return (
      <FillColumn
        $gap={"1rem"}
        key="general-options-view"
        style={{ height: "fit-content" }}
      >
        <FillColumn $gap={"1.5rem"}>
          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <HugRow $gap={"0.5rem"}>
              <RowLabel>Master</RowLabel>
              <ValueChip>{Math.round(sound.masterVolume * 100)}%</ValueChip>
            </HugRow>
            <ValueSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.masterVolume}
              onChange={(e) =>
                sound.setMasterVolume(parseFloat(e.target.value))
              }
            />
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <HugRow $gap={"0.5rem"}>
              <RowLabel>Musik</RowLabel>
              <ValueChip>{Math.round(sound.worldVolume * 100)}%</ValueChip>
            </HugRow>
            <ValueSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.worldVolume}
              onChange={(e) => sound.setWorldVolume(parseFloat(e.target.value))}
            />
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <HugRow $gap={"0.5rem"}>
              <RowLabel>Effekte</RowLabel>
              <ValueChip>{Math.round(sound.tapVolume * 100)}%</ValueChip>
            </HugRow>
            <ValueSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.tapVolume}
              onChange={(e) => sound.setTapVolume(parseFloat(e.target.value))}
            />
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <HugRow $gap={"0.5rem"}>
              <RowLabel>UI</RowLabel>
              <ValueChip>{Math.round(sound.uiVolume * 100)}%</ValueChip>
            </HugRow>
            <ValueSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.uiVolume}
              onChange={(e) => sound.setUIVolume(parseFloat(e.target.value))}
            />
          </ListItemContainer>

          <ListItemContainer
            $gridTemplateColumns="0.5fr 1fr"
            $align="center"
            $justify="space-between"
            $gap={"1rem"}
          >
            <HugRow $gap={"0.5rem"}>
              <RowLabel>Chat</RowLabel>
              <ValueChip>{Math.round(sound.textVolume * 100)}%</ValueChip>
            </HugRow>
            <ValueSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.textVolume}
              onChange={(e) => sound.setTextVolume(parseFloat(e.target.value))}
            />
          </ListItemContainer>
        </FillColumn>

        <Divider />

        <FillRow $align="center" $justify="center" $gap={"1rem"}>
          <AppInfo>Audio Status: {sound.audioStatus}</AppInfo>
        </FillRow>
      </FillColumn>
    );
  };

  interface PerformanceStats {
    fps: number;
    memory: {
      used: number;
      total: number;
    };
    renderTime: number;
    frameCount: number;
  }

  const GraphicsView = () => {
    const { graphicPreferences, setGraphicsMode } = useGameStore();

    const mode = graphicPreferences.qualityMode;

    const [stats, setStats] = useState<PerformanceStats>({
      fps: 0,
      memory: { used: 0, total: 0 },
      renderTime: 0,
      frameCount: 0,
    });

    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const fpsRef = useRef<number[]>([]);

    useEffect(() => {
      let animationFrameId: number;

      const updateStats = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTimeRef.current;

        frameCountRef.current++;

        if (deltaTime >= 1000) {
          const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
          fpsRef.current.push(fps);
          if (fpsRef.current.length > 10) {
            fpsRef.current.shift();
          }

          const avgFps = Math.round(
            fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
          );

          // Get memory info if available
          const memory = (performance as any).memory
            ? {
                used: Math.round(
                  (performance as any).memory.usedJSHeapSize / 1024 / 1024
                ),
                total: Math.round(
                  (performance as any).memory.totalJSHeapSize / 1024 / 1024
                ),
              }
            : { used: 0, total: 0 };

          setStats({
            fps: avgFps,
            memory,
            renderTime: deltaTime,
            frameCount: frameCountRef.current,
          });

          frameCountRef.current = 0;
          lastTimeRef.current = currentTime;
        }

        animationFrameId = requestAnimationFrame(updateStats);
      };

      animationFrameId = requestAnimationFrame(updateStats);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, []);

    return (
      <FillColumn $gap={"1rem"} key="general-options-view">
        <SettingsWrapper
          $align="flex-start"
          style={{
            alignItems: "flex-start",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <ListItemContainer
            $gap={"0.25rem"}
            $align="flex-start"
            $gridTemplateColumns="3.125rem 1fr 1fr"
          >
            <FillColumn $align="flex-start" $gap={"0.5rem"}>
              <p>FPS</p>
              <b>{stats.fps}</b>
            </FillColumn>
            <FillColumn $align="flex-start" $gap={"0.5rem"}>
              <p>Memory</p>
              <b>
                {stats.memory.used}/{stats.memory.total}MB
              </b>
            </FillColumn>
            <FillColumn $align="flex-start" $gap={"0.5rem"}>
              <p>Frame Time</p>
              <b>{stats.renderTime.toFixed(1)}ms</b>
            </FillColumn>
          </ListItemContainer>
          <FillColumn $gap={"0.5rem"} $align="flex-end">
            <ToggleButton
              $fillRow
              onClick={() => setGraphicsMode("auto")}
              $active={mode === "auto"}
            >
              Automatisch
            </ToggleButton>
            <ToggleButton
              $fillRow
              onClick={() => setGraphicsMode("low")}
              $active={mode === "low"}
            >
              Niedrig
            </ToggleButton>
            <ToggleButton
              $fillRow
              onClick={() => setGraphicsMode("high")}
              $active={mode === "high"}
            >
              Hoch
            </ToggleButton>
          </FillColumn>
        </SettingsWrapper>
      </FillColumn>
    );
  };

  return (
    <>
      {activeTab === "theme" &&
        createPortal(
          <ThemeOverlays />,
          document.getElementById("motion-root")!
        )}

      {activeTab !== "theme" && (
        <FillColumn
          style={{
            width: "25rem",
            maxWidth: "100%",
            maxHeight: "23rem",
            overflowY: "auto",

            borderRadius: "1.75rem",
            background: "rgba(0, 0, 0, 0.25)",
            padding: "1rem",
            zIndex: -1,
          }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          initial={{ y: 15, opacity: 0, filter: "blur(6px)" }}
          exit={{ y: 15, opacity: 0, filter: "blur(6px)" }}
          transition={{
            type: "spring" as const,
            bounce: 0.1,
            visualDuration: 0.2,
            layout: {
              type: "spring",
              bounce: 0.2,
              duration: 0.6,
            },
          }}
          // key="options-views-container"
          key={activeTab + "-views-container"}
          layout
        >
          {activeTab === "audio" && <AudioView />}
          {activeTab === "graphics" && <GraphicsView />}
        </FillColumn>
      )}

      <TabPanel
        layout
        transition={{
          type: "spring",
          bounce: 0.2,
          duration: 0.4,
          layout: {
            type: "spring",
            bounce: 0.2,
            visualDuration: 0.2,
          },
        }}
      >
        {tabs.map((tab) => (
          <TabButton
            layout="position"
            transition={{
              type: "spring",
              bounce: 0.2,
              duration: 0.4,
              layout: {
                type: "spring",
                bounce: 0.2,
                visualDuration: 0.2,
              },
            }}
            key={tab.id + "_shop_tab"}
            $active={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.name}
          </TabButton>
        ))}
      </TabPanel>
    </>
  );
}

export const AppInfo = styled.p`
  opacity: 0.5;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;

  font-size: 0.75rem;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;

  color: #ffffff;
  font-weight: 600;
`;

const FixedAnchor = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom) + 188px);
  margin: 0 auto;
  width: fit-content;
  max-width: calc(100vw - 40px);
`;

const ShopContainer = styled(motion.div)`
  width: 520px;
  padding: 4px;
  max-width: 100%;

  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;

  pointer-events: auto;
`;

// TODO: refactor/split + design system
const ItemStatusChip = styled(motion.div)<{
  $variant?: "light" | "dark" | "accent" | "inverted" | "dark-accent";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  background-color: #ffff54;
  color: #212121;

  font-size: 0.875rem;
  font-weight: 900;
  height: 1.375rem;

  padding: 4px 8px;
  border-radius: 0.625rem;
  box-shadow: 0px 0.5px 2px rgba(0, 0, 0, 0.07), 0 1.5px 5px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  // TODO: move to reset.scss and check padding
  span {
    line-height: 1.25;
  }

  ${(p) =>
    p.$variant === "light" &&
    `
    background-color: #fff;
    color: #212121;
    
  `}

  ${(p) =>
    p.$variant === "inverted" &&
    `
    background-color: rgba(0,0,0,0.25);
    color: #fff;
    font-weight: 700;
  `}
  
  ${(p) =>
    p.$variant === "dark" &&
    `
    background-color: #212121;
    color: white;
    gap: 0.25rem;
    
    font-weight: 700;
  `}
 
 ${(p) =>
    p.$variant === "dark-accent" &&
    `
    color: var(--accent-color);
    border: 1.5px solid var(--accent-color);
    background-color: #212121;
    
    gap: 0.25rem;
    padding: 0 0.75rem;
    height: 2rem;
    border-radius: 20px;
    
    font-weight: 700;
  `}

${(p) =>
    p.$variant === "accent" &&
    `
    background-color: var(--secondary-color);
    color: var(--text-color);
    border: 1.5px solid var(--text-color);
    gap: 0.25rem;
    
    font-weight: 700;

  `}
`;

const TabPanel = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 4px;
  background: var(--primary-color);
  width: 100%;
  border-radius: 6rem;
`;

const TabButton = styled(motion.button)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border: none;
  color: ${(p) => (p.$active ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)")};
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.05)"};

  &:hover {
    background: ${(p) =>
      p.$active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)"};
    color: ${(p) => (p.$active ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)")};
  }
`;

const ContentControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  margin: 0 auto;
`;

const PaginationDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px;
  border-radius: 50px;
  background: rgba(0, 0, 0, 0.15);

  span {
    height: 6px;
    width: 6px;
    background: #fff;
    opacity: 0.25;
    border-radius: 50px;
  }
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

  height: 3rem;
  width: 3rem;

  border-radius: 1rem;
  background: var(--blob-color);
  color: var(--outline-color);
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.15), 0px 0px 8px rgba(0, 0, 0, 0.1);
  z-index: 0;

  svg {
    height: 20px;
    width: 20px;
  }

  &:disabled {
    opacity: 0.25;
  }
`;

const ShopItemButton = styled.button<{
  $selected: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 0.5rem 0.75rem;
  border-radius: 0.875rem;

  background-color: ${(p) =>
    p.$selected ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.25)"};
  /* color: ${(p) => (p.$selected ? "#212121" : "#ffffff")}; */
  color: #ffffff;

  font-size: 1rem;
  font-weight: 600;

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: ${(props) => (props.$selected ? 0.5 : 1)};

  width: fit-content;

  &:hover {
    background: rgba(0, 0, 0, 0.75);
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
