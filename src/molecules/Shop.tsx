import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import {
  useGameStore,
  triggerStoreMigration,
  Upgrade,
  BobItem,
  DecorationItem,
  WeatherEffect,
  ShopItem,
} from "@/store/gameStore";
import { getWeatherSoundById, WORLD_SOUNDS } from "@/utils/sound/configs";
import {
  setCurrentTapSound as engineSetCurrentTapSound,
  stopSoundsById,
  playWorldSound as enginePlayWorldSound,
  addSoundConfig as engineAddSoundConfig,
} from "@/utils/soundSystem";

import { useKeyPress } from "@/hooks/useKeyPress";
import { formatNumber } from "./TapCounter";
import { match } from "ts-pattern";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { usePagination } from "@/hooks/usePagination";
import { HugColumn } from "@/layout";
import { useViewStore } from "@/store";
import {
  CAMERA_Y_POSITION,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "./HeadNavigation";

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShopTab = "effects" | "decorations" | "bob";

const tabs = [
  {
    id: "bob" as ShopTab,
    name: "Bob",
  },
  {
    id: "effects" as ShopTab,
    name: "Effekte",
  },
  {
    id: "decorations" as ShopTab,
    name: "Deko",
  },
];

export function Shop({ isOpen, onClose }: ShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>("bob");
  const [currentItems, setCurrentItems] = useState<ShopItem[]>([]);

  // TODO: use record<view, items> with pagination and shared layout
  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(currentItems, 1);

  const setItems = (items: ShopItem[]) => {
    setCurrentItems(items);
    goTo(0);
  };

  const {
    tapEffects,
    decorations,
    bobItems,
    themes,
    upgrades,
    routes,
    taps,
    canAfford,
    purchaseTapEffect,
    selectTapEffect,
    unequipBobItem,
    equipBobItem,
    purchaseBobItem,
  } = useGameStore();

  const { cameraControlsRef } = useViewStore();

  const shopViewsWithItems: Record<ShopTab, ShopItem[]> = {
    bob: bobItems,
    effects: tapEffects,
    decorations: decorations,
  };

  useEffect(() => {
    setCurrentItems(shopViewsWithItems[activeTab]);
    goTo(0);
  }, [activeTab]);

  useKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  const handleBobItemClick = (bobItemId: string) => {
    const bobItem = bobItems.find((b) => b.id === bobItemId);
    if (!bobItem) return;

    if (bobItem.purchased) {
      // if already purchased, equip/unequip it
      if (bobItem.enabled) {
        unequipBobItem(bobItemId);
      } else {
        equipBobItem(bobItemId);
      }
    } else if (canAfford(bobItem.cost)) {
      // purchase and equip
      purchaseBobItem(bobItemId);
      // auto-equip after purchase
      setTimeout(() => equipBobItem(bobItemId), 100);
    }
  };

  const handleButton = (itemId: string) => {
    switch (activeTab) {
      case "effects": {
        console.log("effects handleButton ~ itemId:", itemId);
        const effect = tapEffects.find((e) => e.id === itemId);
        if (effect && effect.purchased && !effect.enabled) {
          selectTapEffect(itemId);
        } else if (effect && !effect.purchased && canAfford(effect.cost)) {
          purchaseTapEffect(itemId);
          selectTapEffect(itemId);
        }
      }
      case "bob": {
        console.log("bob handleButton ~ itemId:", itemId);
        handleBobItemClick(itemId);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ShopContainer
            key="shop-container"
            initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(6px)" }}
            animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scaleX: 0.9, y: 80, filter: "blur(6px)" }}
            transition={{
              type: "spring" as const,
              bounce: 0.5,
            }}
          >
            {data[0] && (
              <HugColumn
                $gap={"4px"}
                $align="center"
                style={{ position: "absolute", top: "30svh" }}
              >
                {data[0].purchased ? (
                  <TapCountDisplay $variant="light">Gekauft </TapCountDisplay>
                ) : data[0].enabled ? (
                  <TapCountDisplay $variant="inverted">
                    Ausgewählt
                  </TapCountDisplay>
                ) : (
                  <TapCountDisplay>{data[0].cost} 🫵</TapCountDisplay>
                )}

                <ItemInformationChip>
                  <span>{data[0].name}</span>
                  <span>{data[0].type}</span>
                </ItemInformationChip>
              </HugColumn>
            )}

            <ShopContent>
              <ContentView>
                <AnimatePresence>
                  {data.map((item) => (
                    <ShopItemButton
                      key={item.id}
                      $selected={item.enabled}
                      $purchased={item.purchased}
                      $canAfford={canAfford(item.cost)}
                      onClick={() => handleButton(item.id)}
                      role="button"
                    >
                      {item.enabled
                        ? "Entfernen"
                        : item.purchased
                        ? "Auswählen"
                        : "Kaufen"}
                    </ShopItemButton>
                  ))}
                </AnimatePresence>
              </ContentView>
            </ShopContent>

            <ContentControls>
              <PaginationButton onClick={prev}>
                <ArrowLeftIcon />
              </PaginationButton>
              <PaginationButton onClick={next}>
                <ArrowRightIcon />
              </PaginationButton>
            </ContentControls>

            <PaginationDots>
              <span></span>
            </PaginationDots>

            <TabPanel>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  $active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.name}
                </TabButton>
              ))}
            </TabPanel>
          </ShopContainer>
        </>
      )}
    </AnimatePresence>
  );
}

const ShopContainer = styled(motion.div)`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 88px;
  margin: 0 auto;
  width: 880px;
  padding: 4px;
  max-width: calc(100% - 32px);
  height: calc(100svh - 140px);

  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;

  overflow: hidden;
  pointer-events: auto;
`;

const TapCountDisplay = styled.div<{
  $variant?: "light" | "dark" | "accent" | "inverted";
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  background: #ffff54;
  color: #212121;

  ${(p) =>
    p.$variant === "light" &&
    `
    background: #fff;
    color: #212121;
  `}

  ${(p) =>
    p.$variant === "inverted" &&
    `
    background: rgba(255,255,255,0.25);
    color: #fff;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  `}

  font-size: 0.875rem;
  font-weight: 900;

  padding: 6px 10px;
  border-radius: 0.625rem;
`;

const ItemInformationChip = styled(TapCountDisplay)`
  background: #212121;
  color: white;
  font-weight: 500;
  gap: 0.25rem;

  span:first-child {
    font-weight: 600;
  }

  span:last-child {
    opacity: 0.5;
  }
`;

const ShopContent = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  padding-bottom: 2.5rem;
`;

const TabPanel = styled.div`
  display: flex;
  gap: 8px;
  border-radius: 18px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: none;
  color: #212121;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  opacity: ${(p) => (p.$active ? 1 : 0.5)};

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
`;

const ContentControls = styled.div`
  display: flex;
  width: min(100%, 500px);
  align-items: center;
  justify-content: space-between;

  position: absolute;
  margin: 0 auto;
  bottom: 25svh;
  left: 0;
  right: 0;
`;

const PaginationDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

  height: 2.5rem;
  width: 2.5rem;

  border-radius: 50%;
  background: #fff;
  color: #212121;

  svg {
    height: 20px;
    width: 20px;
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(props) => props.$progress * 100}%;
    background: var(--accent-color);
    transition: width 0.3s ease;
  }
`;

const ContentView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
`;

const ContentSubtitle = styled.p`
  font-size: 14px;
  color: #666666;
  margin: 0;
`;

const ContentItems = styled.div`
  flex: 1;
`;

const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ShopItemButton = styled.button<{
  $selected: boolean;
  $purchased: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 8px 12px;
  border-radius: 50px;
  cursor: ${(p) => (p.$canAfford || !p.$purchased ? "pointer" : "not-allowed")};

  background: rgba(0, 0, 0, 0.25);
  color: white;
  font-size: 1rem;
  font-weight: 600;

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: ${(props) => (props.$purchased || props.$canAfford ? 1 : 0.5)};

  width: fit-content;

  &:hover {
    background: ${(props) =>
      props.$purchased ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)"};
  }
`;

const ThemePreview = styled.div<{ $colors: any }>`
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const ThemeGradient = styled.div<{ $colors: any }>`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    ${(props) => props.$colors[0]} 0%,
    ${(props) => props.$colors[1]} 50%,
    ${(props) => props.$colors[2]} 100%
  );
`;

const ThemeName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
`;

const ThemeDescription = styled.div`
  font-size: 10px;
  color: #666666;
  text-align: center;
  text-wrap: balance;
`;

const ThemeStatus = styled.div<{ $purchased: boolean; $enabled: boolean }>`
  font-size: 10px;
  color: ${(props) =>
    props.$purchased ? (props.$enabled ? "#4CAF50" : "#FF9800") : "#FF9800"};
  text-align: center;
  font-weight: 500;
`;

const EffectIcon = styled.div`
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const EffectName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
`;

const EnvironmentIcon = styled.div`
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const EnvironmentName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
`;

const EffectStatus = styled.div<{ $unlocked: boolean }>`
  font-size: 10px;
  color: ${(props) => (props.$unlocked ? "#4CAF50" : "#F44336")};
  text-align: center;
  font-weight: 500;
`;

const EnvironmentStatus = styled.div<{ $unlocked: boolean }>`
  font-size: 10px;
  color: ${(props) => (props.$unlocked ? "#4CAF50" : "#F44336")};
  text-align: center;
  font-weight: 500;
`;

const ShopItemContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThemesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const SectionSubtitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin: 8px 0 0 0;
  opacity: 0.9;
`;

// Effects and Environment styled components
const EffectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
`;

const ToggleLabel = styled.div`
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
`;

const EffectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const EffectCard = styled.div<{
  $selected?: boolean;
  $unlocked: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid
    ${(props) => (props.$selected ? "var(--accent-color)" : "transparent")};
  background: ${(props) =>
    props.$selected
      ? "rgba(255, 215, 0, 0.2)"
      : props.$unlocked
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$unlocked ? 1 : props.$canAfford ? 1 : 0.5)};

  &:hover {
    background: ${(props) =>
      props.$unlocked ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)"};
  }
`;

const EnvironmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EnvironmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const EnvironmentCard = styled.div<{
  $enabled?: boolean;
  $unlocked: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${(props) => (props.$enabled ? "#4CAF50" : "transparent")};
  background: ${(props) =>
    props.$enabled
      ? "rgba(76, 175, 80, 0.2)"
      : props.$unlocked
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$unlocked ? 1 : props.$canAfford ? 1 : 0.5)};

  &:hover {
    background: ${(props) =>
      props.$unlocked ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)"};
  }
`;

// Dev styled components
const DevContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DevGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, 1fr);
`;

// Settings styles
const SettingsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GroupTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  color: #ffffff;
`;

const ToggleSwitch = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${({ $active }) =>
    $active ? "var(--primary-color)" : "rgba(255,255,255,0.1)"};
  color: ${(props) => (props.$active ? "var(--text-color)" : "#ffffff")};
  cursor: pointer;
`;

// Sub-tab navigation styling
const SubTabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  /* margin-bottom: 1.5rem; */
  /* border-bottom: 1px solid rgba(255, 255, 255, 0.1); */
  padding-bottom: 0.5rem;
`;

const SubTabButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${({ $active }) =>
    $active ? "#ffffff" : "rgba(255,255,255,0.05)"};
  color: ${({ $active }) =>
    $active ? "var(--background-color)" : "var(--text-color)"};
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "600" : "400")};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? "var(--primary-color)" : "rgba(255, 255, 255, 0.1)"};
  }
`;

const SliderRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 50px;
  align-items: center;
  gap: 8px;
`;

const SliderLabel = styled.div`
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
  }
`;

const SliderValue = styled.div`
  text-align: right;
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px 0;
`;

const DevButton = styled.button<{
  $active?: boolean;
  $variant?: "destructive" | "default";
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  max-width: 100%;

  border-radius: 8px;
  border: 1px solid transparent;
  background-color: rgba(255, 255, 255, 0.1);
  border-color: ${(props) =>
    props.$active ? "var(--text-color)" : "transparent"};
  color: ${(props) => (props.$active ? "var(--text-color)" : "#ffffff")};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: 0.2s;
  transition-property: background-color, border-color, color;

  ${(props) =>
    props.$variant === "destructive" &&
    `
    background-color: #b30f0f;
    color: #ffffff;
  `}

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;
