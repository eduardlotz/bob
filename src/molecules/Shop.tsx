import React, { useEffect, useMemo, useState } from "react";
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
import { getShopItemType, useViewStore } from "@/store";
import {
  CAMERA_Y_POSITION,
  MOTION_VARIANTS,
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

  const currentItem = useMemo(() => data[0], [page, data]);

  const {
    tapEffects,
    decorations,
    bobItems,
    canAfford,
    purchaseTapEffect,
    selectTapEffect,
    unequipBobItem,
    equipBobItem,
    purchaseBobItem,
  } = useGameStore();

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

  const handleButton = () => {
    switch (activeTab) {
      case "effects": {
        const effect = tapEffects.find((e) => e.id === currentItem.id);
        if (effect && effect.purchased && !effect.enabled) {
          selectTapEffect(currentItem.id);
        } else if (effect && !effect.purchased && canAfford(effect.cost)) {
          purchaseTapEffect(currentItem.id);
          selectTapEffect(currentItem.id);
        }
      }
      case "bob": {
        handleBobItemClick(currentItem.id);
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
            <AnimatePresence mode="popLayout">
              {currentItem && (
                <HugColumn
                  key={currentItem.id}
                  variants={MOTION_VARIANTS.slideUp}
                  animate={MOTION_VARIANTS.slideUp.animate()}
                  exit={MOTION_VARIANTS.slideUp.exit}
                  initial={MOTION_VARIANTS.slideUp.initial}
                  $gap={"4px"}
                  $align="center"
                  style={{ position: "absolute", top: "30svh" }}
                >
                  {currentItem.purchased ? (
                    <TapCountDisplay $variant="light">Gekauft </TapCountDisplay>
                  ) : currentItem.enabled ? (
                    <TapCountDisplay $variant="inverted">
                      Ausgewählt
                    </TapCountDisplay>
                  ) : (
                    <TapCountDisplay>{currentItem.cost} 🫵</TapCountDisplay>
                  )}

                  <ItemInformationChip>
                    <span>{currentItem.name}</span>
                    <span>{getShopItemType(currentItem.type as any)}</span>
                  </ItemInformationChip>
                </HugColumn>
              )}
            </AnimatePresence>

            <ShopContent>
              <ContentView>
                <ShopItemButton
                  key={currentItem.id}
                  $selected={currentItem.enabled}
                  $purchased={currentItem.purchased}
                  $canAfford={canAfford(currentItem.cost)}
                  onClick={handleButton}
                  role="button"
                  disabled={currentItem.enabled}
                >
                  {currentItem.enabled
                    ? "Entfernen"
                    : currentItem.purchased
                    ? "Auswählen"
                    : "Kaufen"}
                </ShopItemButton>
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

            {/* <PaginationDots>
              <span></span>
            </PaginationDots> */}

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

const TapCountDisplay = styled(motion.div)<{
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
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.15);

  @keyframes float {
    0% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-0.625rem);
    }

    100% {
      transform: translateY(0);
    }
  }

  animation: float 6s ease-in-out infinite;
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
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.15), 0px 0px 8px rgba(0, 0, 0, 0.1);

  svg {
    height: 20px;
    width: 20px;
  }
`;

const ContentView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
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
