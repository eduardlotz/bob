import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import {
  useAppStore,
  ROUTE_PATHS,
  useViewStore,
  useMiniGameStore,
  useBooksStore,
  CAMERA_VIEWS,
} from "@/store";
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
import { BackToLobbyButton } from "./BackToLobbyButton";
import { useI18n } from "@/i18n";

export function BottomNavigation() {
  const { messages } = useI18n();
  const [showPhone, setShowPhone] = useState(false);
  const {
    currentView,
    resetToDefaultView,
    isPhoneView,
    transitionToView,
    isImageFocused,
    isObjectView,
  } = useViewStore();

  const {
    currentRoute,
    showOptions,
    toggleOptions,
    closeOptionsWithAnimation,
  } = useAppStore();

  const { focusedBook } = useBooksStore();

  const { activeGame } = useMiniGameStore();

  useKeyPress("Escape", () => {
    resetToDefaultView();
    playUISound("ui-tap-close");
  });

  const isHomeRoute = currentRoute === ROUTE_PATHS.HOME;
  const isPortfolioRoute = currentRoute === ROUTE_PATHS.PORTFOLIO;

  const handleMenuButtonClick = () => {
    if (showOptions) {
      resetToDefaultView();
    } else {
      transitionToView("navigation");
    }
    toggleOptions();
    if (showPhone) setShowPhone(false);
  };

  const handlePhoneClick = (open: boolean) => {
    setShowPhone(open);
  };

  const showTapUpgrades = !showOptions && isHomeRoute && !isPhoneView();
  const showOrbitFormControls =
    !showOptions && isPortfolioRoute && !isPhoneView() && !isImageFocused;
  const showBackToLobby = activeGame !== "LOBBY";

  const hideNavigation =
    (isPortfolioRoute && isImageFocused) ||
    focusedBook ||
    currentView === CAMERA_VIEWS.bookshelf.id ||
    (isObjectView() && !isPhoneView() && !isPortfolioRoute);

  return (
    <HugColumn
      layout
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
      {/* <OrbitFormControls show={showOrbitFormControls} /> */}
      <BackToLobbyButton show={showBackToLobby} />
      <HugRow $gap={"8px"} style={{ height: showBackToLobby ? 0 : "auto" }}>
        <AnimatePresence mode="popLayout">
          {!showBackToLobby && !hideNavigation && (
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
              <span>{messages.navigation.menuLabel}</span>
            </MenuButton>
          )}

          {!showBackToLobby && !hideNavigation && (
            <BobPhone isOpen={showPhone} setIsOpen={handlePhoneClick} />
          )}
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
  z-index: 1000;

  span {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    font-size: 0.75rem;
    font-weight: 700;
  }
`;
