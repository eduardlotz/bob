import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/gameStore";
import {
  useAppStore,
  ROUTE_PATHS,
  useViewStore,
  ViewMode,
  CameraViewId,
} from "@/store";
import { CartIcon } from "@/icons/cart";
import { MenuIcon } from "@/icons/menu";
import { CloseIcon } from "@/icons/close";
import { Shop } from "./Shop";
import { ProgressTracker } from "./ProgressTracker";
import { useKeyPress } from "@/hooks/useKeyPress";
import { Magnetic } from "@/layout/Magnetic";
import { HugColumn, HugRow } from "@/layout";
import { TapUpgrades } from "./tapUpgrades";
import { MenuButton } from "@/layout/atoms";
import {
  CAMERA_Y_POSITION,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "./HeadNavigation";

export function BottomNavigation() {
  const { currentView, setViewMode, transitionToView } = useViewStore();

  const {
    currentRoute,
    showOptions,
    toggleOptions,
    closeOptionsWithAnimation,
  } = useAppStore();

  useKeyPress("Escape", () => {
    transitionToView("default");
  });

  const isHomeRoute = currentRoute === ROUTE_PATHS.HOME;

  const handleMenuButtonClick = () => {
    toggleOptions();
    handleNavigationClick("default");
  };

  const handleNavigationClick = (view: CameraViewId) => {
    if (currentView === view) {
      transitionToView("default");
    } else {
      transitionToView(view);
    }

    if (showOptions) closeOptionsWithAnimation();
  };

  const showTapUpgrades =
    isHomeRoute && ["default", "upgrades"].includes(currentView);

  return (
    <HugColumn
      $align="center"
      $gap="0.75rem"
      style={{ position: "fixed", bottom: "20px" }}
    >
      <TapUpgrades show={showTapUpgrades} />
      <HugRow $gap={"8px"} layout>
        <AnimatePresence mode="popLayout">
          {!isHomeRoute && <ProgressTracker />}

          <Magnetic key="menu-button-magnet">
            <MenuButton
              key="menu-button"
              onClick={handleMenuButtonClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              $isActive={showOptions}
              initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
              transition={{
                type: "spring" as const,
                bounce: 0.5,
              }}
              layout="position"
            >
              <AnimatePresence mode="popLayout">
                {showOptions ? (
                  <motion.span
                    key="close-menu-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      type: "spring" as const,
                      bounce: 0.5,
                    }}
                  >
                    <CloseIcon />
                  </motion.span>
                ) : (
                  <motion.span
                    key="show-menu-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      type: "spring" as const,
                      bounce: 0.5,
                    }}
                  >
                    <MenuIcon />
                  </motion.span>
                )}
              </AnimatePresence>
            </MenuButton>
          </Magnetic>
          <Magnetic key="shop-button-magnet">
            <NavButton
              layout="position"
              key="shop-button"
              onClick={() => handleNavigationClick("shop")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              $isActive={currentView === "shop"}
              initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
              transition={{
                // duration: 0.25,
                type: "spring" as const,
                bounce: 0.5,
                delay: 0.1,
              }}
            >
              <AnimatePresence mode="popLayout">
                {currentView === "shop" ? (
                  <motion.span
                    key="close-shop-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      type: "spring" as const,
                      bounce: 0.5,
                    }}
                  >
                    <CloseIcon color="#ffffff" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="show-shop-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      type: "spring" as const,
                      bounce: 0.5,
                    }}
                  >
                    <CartIcon color="#ffffff" />
                  </motion.span>
                )}
              </AnimatePresence>
            </NavButton>
          </Magnetic>
        </AnimatePresence>
      </HugRow>

      <Shop
        isOpen={currentView === "shop"}
        onClose={() => setViewMode("fixed")}
      />
    </HugColumn>
  );
}

export const NavButton = styled(motion.button)<{ $isActive?: boolean }>`
  height: 58px;
  padding: 16px 28px;
  border-radius: 24px;

  background: var(--primary-color);

  outline: 2px solid transparent;
  outline-color: ${(props) => (props.$isActive ? "#ffffff" : "transparent")};
  outline-offset: ${(props) => (props.$isActive ? "3px" : "0")};

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  pointer-events: auto;

  box-shadow: 0 0px 0px rgba(41, 121, 255, 0.3);
  transition-duration: ease-out 0.2s box-shadow;

  &:hover {
    box-shadow: 0 6px 16px rgba(41, 121, 255, 0.4);
  }

  span {
    max-height: 1.5rem;
  }
`;

const UpgradesPanel = styled(motion.div)`
  position: fixed;
  bottom: 120px;
  left: 0;
  right: 0;
  margin: 0 auto;

  width: 320px;
  max-width: calc(100% - 32px);
  background: rgba(20, 20, 20, 1);
  border-radius: 16px;
  z-index: 999;
  overflow: hidden;
  pointer-events: auto;
`;

const UpgradesContent = styled.div`
  padding: 20px;
`;

const UpgradesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const UpgradesTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const UpgradesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UpgradeItem = styled.div<{ $canAfford: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  opacity: ${(props) => (props.$canAfford ? 1 : 0.5)};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const UpgradeIcon = styled.div`
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const UpgradeInfo = styled.div`
  flex: 1;
`;

const UpgradeName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const UpgradeDescription = styled.div`
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
`;

const UpgradeCost = styled.div`
  font-size: 12px;
  color: var(--accent-color);
  font-weight: 500;
  margin-top: 4px;
`;

const UpgradeLevel = styled.div`
  font-size: 10px;
  color: var(--text-color);
  font-weight: 500;
`;
