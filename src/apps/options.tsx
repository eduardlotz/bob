import { usePagination } from "@/hooks/usePagination";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillColumn, FillRow, HugRow, ListItemContainer } from "@/layout";
import { Divider, RowLabel, ValueChip, ValueSlider } from "@/layout/atoms";
import { CameraViewId, useCoreStore, useViewStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { match } from "ts-pattern";
import {
  AppInfo,
  ContentControls,
  FixedAnchor,
  ItemStatusChip,
  PaginationButton,
  PaginationDots,
  ShopContainer,
  ShopItemButton,
  TabButton,
  TabPanel,
} from "./ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";

export const OptionsIcon = () => (
  <img src="/images/app-logos/options.png" height={80} width={80} />
);

type OptionsTab = "theme" | "audio";

const tabs = [
  {
    id: "audio" as OptionsTab,
    name: "Audio",
  },
  {
    id: "theme" as OptionsTab,
    name: "Theme",
  },
];

const APP_ID: CameraViewId = "phone:options";

export function OptionsApp() {
  const [activeTab, setActiveTab] = useState<OptionsTab>("audio");

  const { themes, activateTheme, previewTheme, resetPreview } = useCoreStore();

  const { transitionToView } = useViewStore();

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(themes, 1);

  const initialIndex = useMemo(
    () => themes.findIndex((t) => t.active),
    [activeTab],
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

  interface VolumeItemProps {
    label: string;
    value: number; // 0–1
    onDecrease: () => void;
    onIncrease: () => void;
  }

  const VolumeItem: React.FC<VolumeItemProps> = ({
    label,
    value,
    onDecrease,
    onIncrease,
  }) => {
    const pct = Math.round(value * 100);

    return (
      <VolumeRow>
        <RowLabel>{label}</RowLabel>
        <VolumeControls>
          <StepButton
            style={{ background: "rgba(33,33,33,0.1)", color: "#212121" }}
            $flex={value}
            $visible={pct > 0}
            onClick={onDecrease}
          >
            <MinusIcon />
          </StepButton>

          <ValueChip>{pct}%</ValueChip>

          <StepButton
            $flex={1 - value}
            $visible={pct < 100}
            onClick={onIncrease}
          >
            <PlusIcon />
          </StepButton>
        </VolumeControls>
      </VolumeRow>
    );
  };

  const AudioView = useCallback(() => {
    const sound = useSoundSystem();

    const step = (current: number, dir: 1 | -1) =>
      Math.min(1, Math.max(0, Math.round((current + dir * 0.1) * 100) / 100));

    const rows: VolumeItemProps[] = [
      {
        label: "Master",
        value: sound.masterVolume,
        onDecrease: () => sound.setMasterVolume(step(sound.masterVolume, -1)),
        onIncrease: () => sound.setMasterVolume(step(sound.masterVolume, +1)),
      },
      {
        label: "Musik",
        value: sound.worldVolume,
        onDecrease: () => sound.setWorldVolume(step(sound.worldVolume, -1)),
        onIncrease: () => sound.setWorldVolume(step(sound.worldVolume, +1)),
      },
      {
        label: "Effekte",
        value: sound.tapVolume,
        onDecrease: () => sound.setTapVolume(step(sound.tapVolume, -1)),
        onIncrease: () => sound.setTapVolume(step(sound.tapVolume, +1)),
      },
      {
        label: "UI",
        value: sound.uiVolume,
        onDecrease: () => sound.setUIVolume(step(sound.uiVolume, -1)),
        onIncrease: () => sound.setUIVolume(step(sound.uiVolume, +1)),
      },
      {
        label: "Chat",
        value: sound.textVolume,
        onDecrease: () => sound.setTextVolume(step(sound.textVolume, -1)),
        onIncrease: () => sound.setTextVolume(step(sound.textVolume, +1)),
      },
    ];

    return (
      <FillColumn $gap="1rem" style={{ height: "fit-content", width: "24rem" }}>
        <FillRow $align="center" $justify="center" $gap="1rem">
          <Divider />
          <AppInfo>Audio Status: {sound.audioStatus}</AppInfo>
          <Divider />
        </FillRow>

        <FillColumn $gap="1.5rem">
          {rows.map((row) => (
            <VolumeItem key={row.label} {...row} />
          ))}
        </FillColumn>
      </FillColumn>
    );
  }, []);

  // TODO: fix re-render every second
  const ThemeOverlays = useCallback(
    ({ visible }: { visible: boolean }) => (
      <FixedAnchor>
        {visible && (
          <ShopContainer>
            <ContentControls>
              <ItemStatusChip $variant="dark">
                <span>{currentItem.name}</span>
              </ItemStatusChip>

              <ShopItemButton
                key={buttonLabel + "_action_button"}
                $selected={currentItem.active}
                $purchased // themes are for free (for now)
                $canAfford
                whileTap={{ scale: 0.95 }}
                disabled={currentItem.active}
                onClick={handleButton}
                role="button"
                layout
              >
                <motion.span
                  key={buttonLabel + "_action_label"}
                  animate={{ filter: "blur(0px)", scale: 1 }}
                  initial={{ filter: "blur(2px)", scale: 0.9 }}
                  exit={{ filter: "blur(2px)", scale: 0.9 }}
                  layout="preserve-aspect"
                >
                  {buttonLabel}
                </motion.span>
              </ShopItemButton>

              <PaginationDots>
                <PaginationButton
                  onClick={handlePrev}
                  disabled={pageCount === 1}
                >
                  <ChevronLeftIcon />
                </PaginationButton>

                <HugRow $gap={"4px"}>
                  {Array(pageCount)
                    .fill(null)
                    .map((_, i) => (
                      <motion.div
                        key={`options-pagination-dots-${i}`}
                        animate={{
                          width: page === i ? "20px" : "8px",
                          opacity: page === i ? 1 : 0.5,
                        }}
                      />
                    ))}
                </HugRow>

                <PaginationButton
                  onClick={handleNext}
                  disabled={pageCount === 1}
                >
                  <ChevronRightIcon />
                </PaginationButton>
              </PaginationDots>
            </ContentControls>
          </ShopContainer>
        )}
      </FixedAnchor>
    ),
    [currentItem],
  );

  const OPTIONS = [
    { label: "Auto", value: "auto" },
    { label: "Niedrig", value: "low" },
    { label: "Hoch", value: "high" },
  ] as const;

  return (
    <>
      {createPortal(
        <ThemeOverlays visible={activeTab === "theme"} />,
        document.getElementById("motion-root")!,
      )}

      {activeTab !== "theme" && (
        <FillColumn
          style={{
            // width: "24rem",
            maxWidth: "100%",
            maxHeight: "23rem",
            overflowY: "auto",

            borderRadius: "1.25rem",
            background: "rgba(33, 33, 33, 0.05)",
            padding: "1rem",
            // zIndex: -1,
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
          key={activeTab + "-views-container"}
          layout
        >
          {activeTab === "audio" && <AudioView />}
        </FillColumn>
      )}

      <TabPanel
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

const VolumeRow = styled.div`
  display: grid;
  grid-template-columns: 0.25fr 1fr;

  align-items: center;
  justify-content: space-between;
  grid-gap: 1rem;
  width: 100%;
`;

const VolumeControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
`;

const StepButton = styled.button<{ $flex: number; $visible: boolean }>`
  flex: ${({ $flex }) => $flex};
  min-width: 0;
  height: 2.2rem;
  border-radius: 999px;
  border: none;
  background: #1a1a1a;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 400;
  cursor: pointer;
  display: ${({ $visible }) => ($visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: flex 0.2s ease;
  overflow: hidden;

  svg {
    min-width: 1rem;
    min-height: 1rem;
  }

  &:active {
    opacity: 0.7;
    transform: scale(0.93);
  }
`;

const MinusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.00781 7.99512L12.0078 7.99512"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 12V4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.00781 7.99512L12.0078 7.99512"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
