import { usePagination } from "@/hooks/usePagination";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillColumn, FillRow, HugColumn, HugRow } from "@/layout";
import {
  DevSlider,
  DevSliderValue,
  Divider,
  RowLabel,
  ValueChip,
  ValueSlider,
} from "@/layout/atoms";
import { CameraViewId, useGameStore, useViewStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { match } from "ts-pattern";

export const OptionsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 2H56C68.1503 2 78 11.8497 78 24V56C78 68.1503 68.1503 78 56 78H24C11.8497 78 2 68.1503 2 56V24C2 11.8497 11.8497 2 24 2Z"
      fill="#A6D4A6"
      stroke="#518F57"
      strokeWidth={4}
    />
    <path
      d="M60.1512 27.5167C59.7198 32.08 58.5344 35.9741 57.4127 38.6759C56.5402 40.777 54.7069 42.2579 52.4741 42.695C50.1866 43.1428 46.7196 43.5921 42.0173 43.5921C38.7083 43.5921 35.9066 43.3696 33.6663 43.0817C29.7228 42.575 26.9419 39.3495 26.3077 35.4245L24.4531 23.9492H56.7494C58.7219 23.9492 60.3369 25.553 60.1512 27.5167Z"
      fill="#C3F1C4"
    />
    <path
      d="M60.1512 27.5167C59.7198 32.08 58.5344 35.9741 57.4127 38.6759C56.5402 40.777 54.7069 42.2579 52.4741 42.695C50.1866 43.1428 46.7196 43.5921 42.0173 43.5921C38.7083 43.5921 35.9066 43.3696 33.6663 43.0817C29.7228 42.575 26.9419 39.3495 26.3077 35.4245L24.4531 23.9492H56.7494C58.7219 23.9492 60.3369 25.553 60.1512 27.5167Z"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M54.9654 52.5202H35.1504C31.6468 52.5202 28.6605 49.979 28.0997 46.5206L24.6883 25.4839C24.1275 22.0255 21.1411 19.4844 17.6375 19.4844H15.6797"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M31.2313 60.5141C33.4387 60.5141 35.2282 58.7248 35.2282 56.5173C35.2282 54.3098 33.4387 52.5205 31.2313 52.5205C29.0238 52.5205 27.2344 54.3098 27.2344 56.5173C27.2344 58.7248 29.0238 60.5141 31.2313 60.5141Z"
      fill="#518F57"
    />
    <path
      d="M31.2313 60.5141C33.4387 60.5141 35.2282 58.7248 35.2282 56.5173C35.2282 54.3098 33.4387 52.5205 31.2313 52.5205C29.0238 52.5205 27.2344 54.3098 27.2344 56.5173C27.2344 58.7248 29.0238 60.5141 31.2313 60.5141Z"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M54.9655 60.5141C57.173 60.5141 58.9623 58.7248 58.9623 56.5173C58.9623 54.3098 57.173 52.5205 54.9655 52.5205C52.758 52.5205 50.9688 54.3098 50.9688 56.5173C50.9688 58.7248 52.758 60.5141 54.9655 60.5141Z"
      fill="#518F57"
    />
    <path
      d="M54.9655 60.5141C57.173 60.5141 58.9623 58.7248 58.9623 56.5173C58.9623 54.3098 57.173 52.5205 54.9655 52.5205C52.758 52.5205 50.9688 54.3098 50.9688 56.5173C50.9688 58.7248 52.758 60.5141 54.9655 60.5141Z"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type OptionsTab = "theme" | "general" | "graphics";

const tabs = [
  {
    id: "theme" as OptionsTab,
    name: "Theme",
  },
  {
    id: "general" as OptionsTab,
    name: "Allgemein",
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

  const initialIndex = useMemo(() => themes.findIndex((t) => t.active), []);
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

  const GeneralView = () => {
    const sound = useSoundSystem();

    return (
      <FillColumn layout $gap={"1rem"}>
        <FillColumn $gap={"1.5rem"}>
          <FillRow $align="center" $justify="space-between" $gap={"1rem"}>
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
          </FillRow>

          <FillRow $align="center" $justify="space-between" $gap={"1rem"}>
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
          </FillRow>

          <FillRow $align="center" $justify="space-between" $gap={"1rem"}>
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
          </FillRow>

          <FillRow $align="center" $justify="space-between" $gap={"1rem"}>
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
          </FillRow>

          <FillRow $align="center" $justify="space-between" $gap={"1rem"}>
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
          </FillRow>
        </FillColumn>

        <Divider />

        <FillRow $align="center" $justify="center" $gap={"1rem"}>
          <AppInfo>Audio Status: {sound.audioStatus}</AppInfo>
        </FillRow>
      </FillColumn>
    );
  };

  const GraphicsView = () => (
    <FillRow $align="center" $justify="center">
      <AppInfo>Noch nicht verfügbar</AppInfo>
    </FillRow>
  );

  return (
    <>
      {activeTab === "theme" &&
        createPortal(
          <ThemeOverlays />,
          document.getElementById("motion-root")!
        )}

      {activeTab !== "theme" && (
        <HugColumn
          key="options-container"
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
          }}
          layout
        >
          {activeTab === "general" && <GeneralView />}
          {activeTab === "graphics" && <GraphicsView />}
        </HugColumn>
      )}

      <TabPanel>
        {tabs.map((tab) => (
          <TabButton
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

const AppInfo = styled.p`
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

const TabButton = styled.button<{ $active: boolean }>`
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
