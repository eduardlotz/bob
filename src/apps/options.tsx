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
  <svg
    width={80}
    height={80}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_ii_3758_785)">
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="#6B6E75"
      />
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="url(#paint0_radial_3758_785)"
      />
    </g>
    <g clipPath="url(#clip0_3758_785)">
      <g filter="url(#filter1_dii_3758_785)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48.4995 23.9834H51.5213C52.6518 23.9857 53.7556 24.3281 54.689 24.9659C55.6225 25.6038 56.3424 26.5077 56.7554 27.5602L57.662 29.8632C57.9709 30.648 58.5368 31.3048 59.2673 31.7263L61.2084 32.8465C61.9411 33.2693 62.7958 33.4303 63.6322 33.303L66.0635 32.933C67.1834 32.7644 68.3281 32.9371 69.3484 33.4287C70.3687 33.9203 71.2172 34.7079 71.7832 35.6889L73.2903 38.2944C73.858 39.2749 74.1164 40.404 74.0318 41.5339C73.9473 42.6638 73.5236 43.7418 72.8162 44.6269L71.2811 46.547C70.7529 47.2078 70.4651 48.0286 70.4651 48.8746V51.1317C70.4651 51.9736 70.7501 52.7907 71.2737 53.4499L72.8008 55.3727C73.5062 56.2587 73.9286 57.3366 74.0132 58.466C74.0977 59.5954 73.8405 60.7241 73.2749 61.7053L71.7717 64.3108C71.2052 65.2913 70.3567 66.0786 69.3365 66.5702C68.3163 67.0617 67.1718 67.2347 66.0519 67.0666L63.6171 66.6964C62.7805 66.5693 61.9257 66.7305 61.1929 67.1536L59.2494 68.2759C58.5181 68.6982 57.9518 69.3563 57.6434 70.1425L56.7438 72.4356C56.3315 73.4888 55.6118 74.3935 54.6783 75.0321C53.7448 75.6707 52.6407 76.0136 51.5097 76.0162H48.4918C47.3608 76.0136 46.2567 75.6707 45.3232 75.0321C44.3897 74.3935 43.67 73.4888 43.2577 72.4356L42.3581 70.1425C42.0497 69.3563 41.4834 68.6982 40.7521 68.2759L38.8086 67.1536C38.0759 66.7305 37.221 66.5693 36.3845 66.6964L33.9496 67.0666C32.8301 67.2356 31.6856 67.0634 30.6654 66.5725C29.6451 66.0817 28.7964 65.2948 28.2298 64.3146L26.7267 61.7053C26.159 60.7247 25.9005 59.5956 25.9851 58.4657C26.0697 57.3358 26.4934 56.2578 27.2007 55.3727L28.7358 53.4526C29.2641 52.7918 29.5519 51.971 29.5519 51.125V48.8746C29.5519 48.0286 29.2641 47.2078 28.7358 46.547L27.2007 44.6269C26.4938 43.7418 26.07 42.664 25.9847 41.5344C25.8995 40.4047 26.1567 39.2756 26.7228 38.2944L28.226 35.6889C28.7923 34.7072 29.6414 33.9192 30.6624 33.4275C31.6835 32.9359 32.8291 32.7636 33.9496 32.933L36.3688 33.3019C37.2078 33.4299 38.0654 33.2677 38.7997 32.8421L40.7614 31.7052C41.487 31.2847 42.0496 30.6318 42.3582 29.8521L43.2654 27.5602C43.6775 26.5071 44.3972 25.6026 45.3309 24.9646C46.2645 24.3266 47.3687 23.9847 48.4995 23.9834ZM57.6997 49.9998C57.6997 54.9217 54.9285 57.693 50.0065 57.693C45.0846 57.693 42.3134 54.9217 42.3134 49.9998C42.3134 45.0779 45.0846 42.3067 50.0065 42.3067C54.9285 42.3067 57.6997 45.0779 57.6997 49.9998Z"
          fill="#D7D8DD"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_ii_3758_785"
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
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3758_785"
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
          values="0 0 0 0 0.0800314 0 0 0 0 0.00064773 0 0 0 0 0.0072895 0 0 0 0.73 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3758_785"
          result="effect2_innerShadow_3758_785"
        />
      </filter>
      <filter
        id="filter1_dii_3758_785"
        x={24.105}
        y={20.5321}
        width={51.8055}
        height={58.28}
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
        <feOffset dy={0.931853} />
        <feGaussianBlur stdDeviation={0.931853} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3758_785"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3758_785"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-3.45128} />
        <feGaussianBlur stdDeviation={5.17692} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3758_785"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.72564} />
        <feGaussianBlur stdDeviation={1.72564} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.314673 0 0 0 0 0.26899 0 0 0 0 0.370509 0 0 0 0.41 0"
        />
        <feBlend
          mode="normal"
          in2="effect2_innerShadow_3758_785"
          result="effect3_innerShadow_3758_785"
        />
      </filter>
      <radialGradient
        id="paint0_radial_3758_785"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(50 100) rotate(-90) scale(100 170.831)"
      >
        <stop stopColor="#6B6E75" />
        <stop offset={1} stopColor="#09110A" />
      </radialGradient>
      <clipPath id="clip0_3758_785">
        <rect
          width={53.96}
          height={53.96}
          fill="white"
          transform="translate(23.0156 23.0195)"
        />
      </clipPath>
    </defs>
  </svg>
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
      <FillColumn $gap="1rem" style={{ height: "fit-content" }}>
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
            width: "20rem",
            maxWidth: "100%",
            maxHeight: "23rem",
            overflowY: "auto",

            borderRadius: "1.25rem",
            background: "rgba(33, 33, 33, 0.1)",
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

const VolumeRow = styled(FillRow)`
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const VolumeControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 60%;
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
