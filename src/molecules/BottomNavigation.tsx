import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore, ROUTE_PATHS, useViewStore } from "@/store";
import { MenuIcon } from "@/icons/menu";
import { CloseIcon } from "@/icons/close";
import { useKeyPress } from "@/hooks/useKeyPress";
import { Magnetic } from "@/layout/Magnetic";
import { HugColumn, HugRow } from "@/layout";
import { TapUpgrades } from "./tapUpgrades";
import { MenuButton } from "@/layout/atoms";
import { BobPhone } from "./BobPhone";
import { playUISound } from "@/utils/soundSystem";
import { SCENE_REVEAL_DURATION } from "./SceneWithLoader";

export function BottomNavigation() {
  const { currentView, resetToDefaultView, setViewMode, transitionToView } =
    useViewStore();

  const {
    currentRoute,
    showOptions,
    toggleOptions,
    closeOptionsWithAnimation,
  } = useAppStore();

  useKeyPress("Escape", () => {
    resetToDefaultView();
    playUISound("ui-tap-close");
    console.info("resetToDefaultView(); in BOTTOMNAVIGATION.tsx");
  });

  const isHomeRoute = currentRoute === ROUTE_PATHS.HOME;

  const handleMenuButtonClick = () => {
    if (showOptions) {
      resetToDefaultView();
    } else {
      transitionToView("navigation");
    }
    toggleOptions();
  };

  const showTapUpgrades =
    !showOptions && isHomeRoute && ["default"].includes(currentView);

  return (
    <HugColumn
      $align="center"
      $gap="0.75rem"
      style={{
        position: "fixed",
        bottom: "20px",
        margin: "0 auto",
        left: 0,
        right: 0,
      }}
      transition={{ delay: SCENE_REVEAL_DURATION }}
    >
      <TapUpgrades show={showTapUpgrades} />
      <HugRow $gap={"8px"} layout>
        <AnimatePresence mode="popLayout">
          {/* {!isHomeRoute && <ProgressTracker />} */}

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
              <span>Menü</span>
            </MenuButton>
          </Magnetic>

          <BobPhone />
        </AnimatePresence>
      </HugRow>
    </HugColumn>
  );
}

export const NavButton = styled(motion.button)<{ $isActive?: boolean }>`
  height: 3.625rem;
  width: 5.625rem;
  padding: 16px 28px;
  border-radius: 1.5rem;
  gap: 0.125rem;

  background: var(--primary-color);
  color: var(--text-color);

  outline: 2px solid transparent;
  outline-color: ${(props) => (props.$isActive ? "#ffffff" : "transparent")};
  outline-offset: ${(props) => (props.$isActive ? "3px" : "0")};

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  pointer-events: auto;

  span {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    font-size: 0.75rem;
    font-weight: 700;
  }
`;
