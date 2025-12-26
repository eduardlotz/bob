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

export function BottomNavigation() {
  const { currentView, transitionToView } = useViewStore();

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
    transitionToView("default");
  };

  const showTapUpgrades =
    !showOptions && isHomeRoute && ["default"].includes(currentView);

  return (
    <HugColumn
      $align="center"
      $gap="0.75rem"
      style={{ position: "fixed", bottom: "20px" }}
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

      {/* <Shop
        isOpen={currentView === "shop"}
        onClose={() => setViewMode("fixed")}
      /> */}
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
  cursor: pointer;

  pointer-events: auto;

  box-shadow: 0 0px 0px rgba(41, 121, 255, 0.3);
  transition-duration: ease-out 0.2s box-shadow;

  &:hover {
    box-shadow: 0 6px 16px rgba(41, 121, 255, 0.4);
  }

  span {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    font-size: 0.75rem;
    font-weight: 700;
  }
`;
