import { usePagination } from "@/hooks/usePagination";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillRow, HugColumn, HugRow } from "@/layout";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";

export const ShopIcon = () => (
  <img src="/images/app-logos/shop.png" height={80} width={80} />
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

  return <ItemStatusChip>{formatNumber(Math.floor(taps))} 🫵</ItemStatusChip>;
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
  const isViewActive = currentView === APP_ID;
  const initialIndexRef = useRef(initialIndex);

  useEffect(() => {
    transitionToView(APP_ID);
    setViewMode("object");

    goTo(initialIndexRef.current);
    return () => resetPreview();
  }, []);

  useEffect(() => {
    handleItemPreview();
  }, [activeTab, page]);

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
        layoutRoot
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
                  <ItemStatusChip $variant="light">
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

          <PaginationDots
            key={`shop-pagination-dots-${activeTab}`}
            $contrastMode
          >
            <PaginationButton onClick={handlePrev} disabled={pageCount === 1}>
              <ChevronLeftIcon />
            </PaginationButton>

            <HugRow $gap={"4px"}>
              {Array(pageCount)
                .fill(null)
                .map((_, i) => (
                  <motion.div
                    key={`shop_pagination_dot_${i}`}
                    animate={{
                      width: page === i ? "20px" : "8px",
                      opacity: page === i ? 1 : 0.3,
                    }}
                  />
                ))}
            </HugRow>

            <PaginationButton onClick={handleNext} disabled={pageCount === 1}>
              <ChevronRightIcon />
            </PaginationButton>
          </PaginationDots>
        </ContentControls>
      </ShopContainer>
    </FixedAnchor>
  );

  return (
    <>
      {isViewActive &&
        createPortal(ShopOverlays, document.getElementById("motion-root")!)}

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
