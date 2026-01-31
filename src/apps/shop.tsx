import { usePagination } from "@/hooks/usePagination";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillRow, HugColumn } from "@/layout";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import { formatNumber } from "@/molecules/TapCounter";
import {
  CameraViewId,
  getShopItemType,
  ShopItem,
  useCoreStore,
  useViewStore,
} from "@/store";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { match } from "ts-pattern";
import {
  ItemStatusChip,
  FixedAnchor,
  ShopContainer,
  ContentControls,
  PaginationButton,
  ShopItemButton,
  PaginationDots,
  TabPanel,
  TabButton,
} from "./ui";

export const ShopIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 24C0 10.7452 10.7452 0 24 0H56C69.2548 0 80 10.7452 80 24V56C80 69.2548 69.2548 80 56 80H24C10.7452 80 0 69.2548 0 56V24Z"
      fill="#A6D4A6"
    />
    <path
      d="M0 24C0 10.7452 10.7452 0 24 0H56C69.2548 0 80 10.7452 80 24V56C80 69.2548 69.2548 80 56 80H24C10.7452 80 0 69.2548 0 56V24Z"
      fill="#518F57"
      fillOpacity={0.2}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M26.34 27.9964C26.0596 26.2672 24.5664 24.9967 22.8146 24.9967H21.2483C20.0649 24.9967 19.1055 24.0373 19.1055 22.8538C19.1055 21.6703 20.0649 20.7109 21.2483 20.7109H22.8146C26.3629 20.7109 29.4289 23.0804 30.3744 26.4252H54.746C56.324 26.4252 57.6152 27.7078 57.4786 29.2798C57.1323 33.2609 56.1226 36.6495 55.1797 38.9633C54.4895 40.657 53.0323 41.867 51.24 42.2326C49.3697 42.6141 46.5168 43.0006 42.6335 43.0006C39.8534 43.0006 37.511 42.8025 35.6545 42.5499C34.6116 42.4081 33.6729 42.0279 32.8664 41.4686L33.2995 44.1398C33.5799 45.8689 35.0731 47.1395 36.8249 47.1395H52.6769C53.8603 47.1395 54.8197 48.0989 54.8197 49.2824C54.8197 50.4659 53.8603 51.4253 52.6769 51.4253H36.8249C32.971 51.4253 29.686 48.6301 29.0691 44.8258L26.34 27.9964ZM33.6869 59.2656C35.4529 59.2656 36.8845 57.8341 36.8845 56.0681C36.8845 54.3021 35.4529 52.8704 33.6869 52.8704C31.921 52.8704 30.4894 54.3021 30.4894 56.0681C30.4894 57.8341 31.921 59.2656 33.6869 59.2656ZM55.8746 56.0681C55.8746 57.8341 54.4429 59.2656 52.6769 59.2656C50.9109 59.2656 49.4795 57.8341 49.4795 56.0681C49.4795 54.3021 50.9109 52.8704 52.6769 52.8704C54.4429 52.8704 55.8746 54.3021 55.8746 56.0681Z"
      fill="#C3F1C4"
    />
  </svg>
);

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

export const TapCounterChip = () => {
  const { taps } = useCoreStore();

  return (
    <ItemStatusChip $variant="dark-accent">
      {formatNumber(Math.floor(taps))} 🫵
    </ItemStatusChip>
  );
};

const APP_ID: CameraViewId = "phone:shop";

export function ShopApp() {
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

    resetPreview,
    previewBobItem,
    previewDecoration,
    previewTapEffect,
  } = useCoreStore();

  const { currentView, transitionToView, setViewMode } = useViewStore();

  const shopViewsWithItems: Record<ShopTab, ShopItem[]> = {
    bob: bobItems.filter((b) => b.unlocked !== false),
    effects: tapEffects,
    decorations: decorations,
  };

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(shopViewsWithItems[activeTab], 1);

  const initialIndex = useMemo(
    () => shopViewsWithItems[activeTab].findIndex((t) => t.enabled),
    [],
  );
  const currentItem = data[0];

  useEffect(() => {
    transitionToView(APP_ID);
    setViewMode("object");

    goTo(initialIndex);
  }, []);

  useEffect(() => {
    handleItemPreview();

    if (currentView !== "phone:shop") {
      resetPreview();
      transitionToView(APP_ID);
    } else {
      transitionToView("phone:shop");
    }
  }, [page, activeTab, currentView]);

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
      case "effects":
        handleEffectItemClick();
        break;
      case "bob":
        handleBobItemClick();
        break;
      case "decorations":
        handleDecoItemClick();
        break;
    }
  };

  const handleItemPreview = () => {
    if (currentItem.enabled) resetPreview();
    switch (activeTab) {
      case "effects":
        previewTapEffect(currentItem.id);
        break;
      case "bob":
        previewBobItem(currentItem.id);
        break;
      case "decorations":
        previewDecoration(currentItem.id);
        break;
    }
  };

  const buttonLabel = match(currentItem)
    .with({ enabled: true }, () => "Deaktiveren")
    .with({ purchased: true }, () => "Aktivieren")
    .otherwise(() => "Kaufen");

  const handleNext = () => {
    if (hasNext) next();
    else goTo(0);
  };

  const handlePrev = () => {
    if (hasPrev) prev();
    else goTo(pageCount - 1);
  };

  const ShopOverlays = (
    <FixedAnchor>
      <ShopContainer
        key="shop-app-container"
        initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(6px)" }}
        animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scaleX: 0.9, y: 80, filter: "blur(6px)" }}
        transition={{
          type: "spring" as const,
          bounce: 0.5,
        }}
      >
        <ContentControls>
          {currentItem && (
            <HugColumn
              key={currentItem.id + "_meta"}
              variants={MOTION_VARIANTS.springScale}
              animate={MOTION_VARIANTS.springScale.animate()}
              exit={MOTION_VARIANTS.springScale.exit}
              initial={MOTION_VARIANTS.springScale.initial}
              $gap={"4px"}
              $align="center"
            >
              {match(currentItem)
                .with({ enabled: true }, () => (
                  <ItemStatusChip $variant="accent">Ausgewählt</ItemStatusChip>
                ))
                .with({ purchased: false }, () => (
                  <ItemStatusChip>
                    {formatNumber(currentItem.cost)} 🫵
                  </ItemStatusChip>
                ))
                .otherwise(() => (
                  <></>
                ))}
            </HugColumn>
          )}

          <ItemStatusChip $variant="dark">
            <span>{currentItem.name}</span>
            <span>{getShopItemType(currentItem.type as any)}</span>
          </ItemStatusChip>

          <FillRow $justify="space-between">
            <PaginationButton onClick={handlePrev} disabled={pageCount === 1}>
              <ArrowLeftIcon />
            </PaginationButton>

            <ShopItemButton
              key={buttonLabel + "_action_button"}
              $selected={currentItem.enabled}
              $purchased={currentItem.purchased}
              $canAfford={canAfford(currentItem.cost)}
              onClick={handleButton}
              role="button"
              disabled={!currentItem.purchased && !canAfford(currentItem.cost)}
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

            <PaginationButton onClick={handleNext} disabled={pageCount === 1}>
              <ArrowRightIcon />
            </PaginationButton>
          </FillRow>

          <PaginationDots key={`shop-pagination-dots-${activeTab}`}>
            {Array(pageCount)
              .fill(null)
              .map((_, i) => (
                <motion.button
                  key={`shop_pagination_dot_${i}`}
                  animate={{
                    width: page === i ? "16px" : "12px",
                    opacity: page === i ? 1 : 0.25,
                  }}
                  initial={{ width: "12px", opacity: 0.25 }}
                  // onClick={() => goTo(i)}
                  // whileHover={{ width: "24px" }}
                  // style={{
                  //   transformOrigin: "center",
                  // }}
                ></motion.button>
              ))}
          </PaginationDots>
        </ContentControls>
      </ShopContainer>
    </FixedAnchor>
  );

  return (
    <>
      {createPortal(ShopOverlays, document.getElementById("motion-root")!)}

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
