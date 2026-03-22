import { usePagination } from "@/hooks/usePagination";
import { HugColumn, HugRow } from "@/layout";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import { formatNumber } from "@/molecules/TapCounter";
import {
  CameraViewId,
  ShopItem,
  useCoreStore,
  useViewStore,
} from "@/store";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
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
import { useI18n } from "@/i18n";
import { getShopItemCopy } from "@/shop-items/copy";

export const ShopIcon = () => (
  <img src="/images/app-logos/shop.png" height={80} width={80} />
);

type ShopTab = "effects" | "worlds" | "bob";

export const TapCounterChip = () => {
  const { taps } = useCoreStore();

  return <ItemStatusChip>{formatNumber(Math.floor(taps))} 🫵</ItemStatusChip>;
};

const APP_ID: CameraViewId = "phone:shop";

export function ShopApp() {
  const [activeTab, setActiveTab] = useState<ShopTab>("bob");
  const { locale, messages } = useI18n();

  const {
    tapEffects,
    worlds,
    bobItems,
    canAfford,
    purchaseTapEffect,
    selectTapEffect,
    unequipBobItem,
    equipBobItem,
    purchaseBobItem,
    selectWorld,
    purchaseWorld,

    resetPreview,
    previewBobItem,
    previewWorld,
    previewTapEffect,
  } = useCoreStore();

  const { currentView, transitionToView } = useViewStore();

  const shopViewsWithItems: Record<ShopTab, ShopItem[]> = {
    bob: bobItems.filter((b) => b.unlocked !== false),
    effects: tapEffects,
    worlds,
  };

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(shopViewsWithItems[activeTab], 1);

  const currentItem = data[0];
  const currentItemCopy = currentItem ? getShopItemCopy(currentItem.id, locale) : null;
  const isViewActive = currentView === APP_ID;
  const tabs = [
    {
      id: "bob" as ShopTab,
      name: messages.shop.tabs.bob,
    },
    {
      id: "effects" as ShopTab,
      name: messages.shop.tabs.effects,
    },
    {
      id: "worlds" as ShopTab,
      name: messages.shop.tabs.worlds,
    },
  ];
  const getInitialIndex = (tab: ShopTab) =>
    Math.max(
      0,
      shopViewsWithItems[tab].findIndex((item) => item.enabled),
    );

  useEffect(() => {
    transitionToView(APP_ID);

    goTo(getInitialIndex(activeTab));
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

  const handleWorldItemClick = () => {
    const world = worlds.find((entry) => entry.id === currentItem.id);
    if (!world) return;

    if (world.purchased) {
      selectWorld(currentItem.id);
    } else if (canAfford(world.cost)) {
      purchaseWorld(currentItem.id);
    }
  };

  const handleTabChange = (id: ShopTab) => {
    setActiveTab(id);
    goTo(getInitialIndex(id));
  };

  const handleButton = () => {
    switch (activeTab) {
      case "effects":
        handleEffectItemClick();
        break;
      case "bob":
        handleBobItemClick();
        break;
      case "worlds":
        handleWorldItemClick();
        break;
    }
  };

  const handleItemPreview = () => {
    if (currentItem.enabled) {
      resetPreview();
      return;
    }

    switch (activeTab) {
      case "effects":
        previewTapEffect(currentItem.id);
        break;
      case "bob":
        previewBobItem(currentItem.id);
        break;
      case "worlds":
        previewWorld(currentItem.id);
        break;
    }
  };

  const buttonLabel =
    activeTab === "worlds"
      ? match(currentItem)
          .with({ enabled: true }, () => messages.shop.actions.selected)
          .with({ purchased: true }, () => messages.shop.actions.activate)
          .otherwise(() => messages.shop.actions.purchase)
      : activeTab === "bob"
        ? match(currentItem)
            .with({ enabled: true }, () => messages.shop.actions.takeOff)
            .with({ purchased: true }, () => messages.shop.actions.activate)
            .otherwise(() => messages.shop.actions.purchase)
        : match(currentItem)
          .with({ enabled: true }, () => messages.shop.actions.deactivate)
          .with({ purchased: true }, () => messages.shop.actions.activate)
          .otherwise(() => messages.shop.actions.purchase);

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
                  <ItemStatusChip $variant="accent">
                    {messages.shop.actions.selected}
                  </ItemStatusChip>
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
            <span>{currentItemCopy?.name ?? currentItem.name}</span>
            <span>
              {
                messages.shop.itemTypes[
                  currentItem.type as keyof typeof messages.shop.itemTypes
                ]
              }
            </span>
          </ItemStatusChip>

          <ShopItemButton
            key={buttonLabel + "_action_button"}
            $selected={currentItem.enabled}
            $purchased={currentItem.purchased}
            $canAfford={canAfford(currentItem.cost)}
            onClick={handleButton}
            role="button"
            disabled={
              (activeTab === "worlds" && currentItem.enabled) ||
              (!currentItem.purchased && !canAfford(currentItem.cost))
            }
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
