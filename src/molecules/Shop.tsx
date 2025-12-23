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
import { HugColumn, HugRow } from "@/layout";
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
    toggleDecoration,
    purchaseDecoration,
  } = useGameStore();

  const shopViewsWithItems: Record<ShopTab, ShopItem[]> = {
    bob: bobItems,
    effects: tapEffects,
    decorations: decorations,
  };

  // TODO: use record<view, items> with pagination and shared layout
  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(shopViewsWithItems[activeTab], 1);

  // const currentItem = useMemo(
  //   () => data[0],
  //   [page, data, tapEffects, decorations, bobItems]
  // );

  const currentItem = data[0];

  useKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  const handleBobItemClick = () => {
    const bobItem = bobItems.find((b) => b.id === currentItem.id);
    if (!bobItem) return;

    if (bobItem.purchased) {
      // if already purchased, equip/unequip it
      if (bobItem.enabled) {
        unequipBobItem(bobItem.id);
      } else {
        equipBobItem(bobItem.id);
      }
    } else if (canAfford(bobItem.cost)) {
      // purchase and equip
      purchaseBobItem(bobItem.id);
    }
  };

  const handleEffectItemClick = () => {
    const effect = tapEffects.find((e) => e.id === currentItem.id);
    if (!effect) return;

    if (effect.purchased) {
      selectTapEffect(currentItem.id);
    } else if (canAfford(effect.cost)) {
      purchaseTapEffect(currentItem.id);
    }
  };

  const handleDecoItemClick = () => {
    const deco = decorations.find((e) => e.id === currentItem.id);
    if (!deco) return;

    if (deco.purchased) {
      toggleDecoration(currentItem.id);
    } else if (canAfford(deco.cost)) {
      purchaseDecoration(currentItem.id);
    }
  };

  const handleTabChange = (id: ShopTab) => {
    goTo(0);
    setActiveTab(id);
  };

  const handleButton = () => {
    switch (activeTab) {
      case "effects": {
        handleEffectItemClick();
      }
      case "bob": {
        handleBobItemClick();
      }
      case "decorations": {
        handleDecoItemClick();
      }
    }
  };

  const handleNext = () => {
    if (hasNext) next();
    else goTo(0);
  };

  const handlePrev = () => {
    if (hasPrev) prev();
    else goTo(pageCount - 1);
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
                  style={{ position: "absolute", bottom: "30svh" }}
                >
                  {match(currentItem)
                    .with({ enabled: true }, () => (
                      <TapCountDisplay $variant="inverted">
                        Ausgewählt
                      </TapCountDisplay>
                    ))
                    .with({ purchased: false }, () => (
                      <TapCountDisplay>{currentItem.cost} 🫵</TapCountDisplay>
                    ))
                    .otherwise(() => (
                      // <TapCountDisplay $variant="light">
                      //   Gekauft
                      // </TapCountDisplay>
                      <></>
                    ))}
                </HugColumn>
              )}
            </AnimatePresence>

            <ContentControls>
              <PaginationButton onClick={handlePrev} disabled={pageCount === 1}>
                <ArrowLeftIcon />
              </PaginationButton>

              <HugColumn $gap="4px" $align="center" $justify="center">
                <TapCountDisplay $variant="dark">
                  <span>{currentItem.name}</span>
                  <span>{getShopItemType(currentItem.type as any)}</span>
                </TapCountDisplay>

                <ShopItemButton
                  key={currentItem.id}
                  $selected={currentItem.enabled}
                  $purchased={currentItem.purchased}
                  $canAfford={canAfford(currentItem.cost)}
                  onClick={handleButton}
                  role="button"
                  disabled={!canAfford(currentItem.cost)}
                >
                  {match(currentItem)
                    .with({ enabled: true }, () => "Deaktiveren")
                    .with({ purchased: true }, () => "Aktivieren")
                    .otherwise(() => "Kaufen")}
                </ShopItemButton>
              </HugColumn>

              <PaginationButton onClick={handleNext} disabled={pageCount === 1}>
                <ArrowRightIcon />
              </PaginationButton>
            </ContentControls>

            <PaginationDots>
              {Array(pageCount)
                .fill(null)
                .map((dot, i) => (
                  <motion.span
                    key={"dot" + i}
                    animate={{
                      width: page === i ? "12px" : "6px",
                      opacity: page === i ? 1 : 0.25,
                    }}
                    initial={{ width: "6px", opacity: 0.25 }}
                  ></motion.span>
                ))}
            </PaginationDots>

            <TabPanel>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  $active={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
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
  width: 520px;
  padding: 4px;
  max-width: calc(100% - 32px);
  height: calc(100svh - 140px);

  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;

  pointer-events: auto;
`;

const TapCountDisplay = styled(motion.div)<{
  $variant?: "light" | "dark" | "accent" | "inverted";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  background-color: #ffff54;
  color: #212121;

  font-size: 0.875rem;
  font-weight: 900;

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

    span:last-child {opacity: 0.5;}
  `}
`;

const ItemInformationChip = styled(TapCountDisplay)`
  background: #212121;
  color: white;
  font-weight: 500;
  gap: 0.25rem;

  font-weight: 600;
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
  width: min(100%, 340px);
  align-items: center;
  justify-content: space-between;

  position: absolute;
  margin: 0 auto;
  bottom: 10svh;
  left: 0;
  right: 0;
`;

const PaginationDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

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

  height: 2.75rem;
  width: 2.75rem;

  border-radius: 50%;
  background: #fff;
  color: #212121;
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
  $purchased: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 0.5rem 0.75rem;
  border-radius: 0.875rem;
  cursor: pointer;

  background-color: ${(p) =>
    p.$selected ? "rgba(255,255,255,1)" : "rgba(0,0,0,0.25)"};
  color: ${(p) => (p.$selected ? "#212121" : "#ffffff")};
  border: ${(p) =>
    p.$selected
      ? "2px solid rgba(255,255,255,1)"
      : p.$purchased
      ? "2px solid rgba(255,255,255,0.5)"
      : "2px solid transparent"};
  font-size: 1rem;
  font-weight: 600;

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: ${(props) => (props.$purchased || props.$canAfford ? 1 : 0.5)};

  width: fit-content;

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(255,255,255,0.75)" : "rgba(0, 0, 0, 0.5)"};
  }
`;
