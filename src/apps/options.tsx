import { usePagination } from "@/hooks/usePagination";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SegmentedValueSlider } from "@/components/SegmentedValueSlider";
import { FillColumn, FillRow, HugRow, ListItemContainer } from "@/layout";
import { Divider, RowLabel } from "@/layout/atoms";
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

  const { currentView, transitionToView } = useViewStore();

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(themes, 1);

  const initialIndex = useMemo(
    () => themes.findIndex((t) => t.active),
    [activeTab],
  );
  const currentItem = data[0];
  const isViewActive = currentView === APP_ID;

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
    onChange: (value: number) => void;
  }

  const VolumeItem = ({ label, value, onChange }: VolumeItemProps) => {
    const pct = Math.round(value * 100);

    return (
      <VolumeRow>
        <RowLabel>{label}</RowLabel>
        <SegmentedValueSlider
          value={value}
          min={0}
          max={1}
          step={0.1}
          onChange={onChange}
          formatValue={() => `${pct}%`}
        />
      </VolumeRow>
    );
  };

  const AudioView = useCallback(() => {
    const sound = useSoundSystem();

    const normalizeVolumeValue = (next: number) =>
      Math.min(1, Math.max(0, Math.round(next * 100) / 100));

    const rows: VolumeItemProps[] = [
      {
        label: "Master",
        value: sound.masterVolume,
        onChange: (value) => sound.setMasterVolume(normalizeVolumeValue(value)),
      },
      {
        label: "Musik",
        value: sound.worldVolume,
        onChange: (value) => sound.setWorldVolume(normalizeVolumeValue(value)),
      },
      {
        label: "Effekte",
        value: sound.tapVolume,
        onChange: (value) => sound.setTapVolume(normalizeVolumeValue(value)),
      },
      {
        label: "UI",
        value: sound.uiVolume,
        onChange: (value) => sound.setUIVolume(normalizeVolumeValue(value)),
      },
      {
        label: "Chat",
        value: sound.textVolume,
        onChange: (value) => sound.setTextVolume(normalizeVolumeValue(value)),
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
        <ThemeOverlays visible={activeTab === "theme" && isViewActive} />,
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
