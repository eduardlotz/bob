import { usePagination } from "@/hooks/usePagination";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { HugColumn } from "@/layout";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import {
  CameraViewId,
  getShopItemType,
  ShopItem,
  useGameStore,
  useViewStore,
} from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { match } from "ts-pattern";

export const ShopIcon = () => (
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
  } = useGameStore();

  const { currentView, transitionToView, previousView } = useViewStore();

  useEffect(() => {
    transitionToView(APP_ID);

    // return () => {
    //   transitionToView(previousView);
    // };
  }, []);

  const shopViewsWithItems: Record<ShopTab, ShopItem[]> = {
    bob: bobItems,
    effects: tapEffects,
    decorations: decorations,
  };

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(shopViewsWithItems[activeTab], 1);

  // const currentItem = useMemo(
  //   () => data[0],
  //   [page, data, tapEffects, decorations, bobItems]
  // );

  const currentItem = data[0];

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
    <>
      <FixedAnchor>
        <ShopContainer
          key="shop-app-container"
          initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(6px)" }}
          animate={{
            opacity: 1,
            scaleX: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          exit={{ opacity: 0, scaleX: 0.9, y: 80, filter: "blur(6px)" }}
          transition={{
            type: "spring" as const,
            bounce: 0.5,
          }}
        >
          {currentItem && (
            <HugColumn
              key={currentItem.id + "_meta"}
              variants={MOTION_VARIANTS.slideUp}
              animate={MOTION_VARIANTS.slideUp.animate()}
              exit={MOTION_VARIANTS.slideUp.exit}
              initial={MOTION_VARIANTS.slideUp.initial}
              $gap={"4px"}
              $align="center"
              style={{ position: "absolute", bottom: "25svh" }}
            >
              {match(currentItem)
                .with({ enabled: true }, () => (
                  <TapCountDisplay $variant="accent">
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
                key={currentItem.id + "_action_button"}
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
                  key={"shop_pagination_dot_" + i}
                  animate={{
                    width: page === i ? "12px" : "6px",
                    opacity: page === i ? 1 : 0.25,
                  }}
                  initial={{ width: "6px", opacity: 0.25 }}
                ></motion.span>
              ))}
          </PaginationDots>
        </ShopContainer>
      </FixedAnchor>

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

const FixedAnchor = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 100px;
  margin: 0 auto;
`;

const ShopContainer = styled(motion.div)`
  width: 520px;
  padding: 4px;
  max-width: 100%;
  /* height: calc(100svh - 140px); */

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

const ItemInformationChip = styled(TapCountDisplay)`
  background: #212121;
  color: white;
  font-weight: 500;
  gap: 0.25rem;

  font-weight: 600;
`;

const TabPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 4px;

  width: 100%;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 100%;
  align-items: center;
  justify-content: space-between;

  position: absolute;
  margin: 0 auto;
  bottom: 2rem;
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

  border-radius: 1rem;
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
    p.$selected ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.25)"};
  /* color: ${(p) => (p.$selected ? "#212121" : "#ffffff")}; */
  color: #ffffff;
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
    background: rgba(0, 0, 0, 0.75);
  }
`;
