import React, { useEffect, useState } from "react";
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
import { HugColumn, HugRow } from "@/layout";
import { TapUpgrades } from "./tapUpgrades";
import { MenuButton } from "@/layout/atoms";
import { BobPhone } from "./BobPhone";
import { playUISound } from "@/utils/soundSystem";
import { BackToLobbyButton } from "./BackToLobbyButton";
import { useI18n } from "@/i18n";
import { ShopOverlay } from "@/apps/shop";
import { CartIcon } from "@/icons/cart";

export function BottomNavigation() {
  const { messages } = useI18n();
  const [showPhone, setShowPhone] = useState(false);
  const [showShop, setShowShop] = useState(false);
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
    isOptionsClosing,
    openOptions,
    closeOptionsWithAnimation,
  } = useAppStore();

  const { focusedBook } = useBooksStore();

  const { activeGame } = useMiniGameStore();

  useKeyPress("Escape", () => {
    if (showPhone) return;
    if (showShop) {
      setShowShop(false);
      playUISound("ui-tap-close");
      return;
    }
    if (showOptions) closeOptionsWithAnimation();
    else resetToDefaultView();
    playUISound("ui-tap-close");
  });

  const isHomeRoute = currentRoute === ROUTE_PATHS.HOME;
  const isPortfolioRoute = currentRoute === ROUTE_PATHS.PORTFOLIO;
  const menuButtonSoundId =
    showOptions || showPhone ? "ui-tap-close" : "ui-tap";

  const handleMenuButtonClick = () => {
    setShowShop(false);
    if (showOptions && !isOptionsClosing) {
      closeOptionsWithAnimation();
    } else {
      transitionToView("navigation");
      openOptions();
    }
    if (showPhone) setShowPhone(false);
  };

  const handlePhoneClick = (open: boolean) => {
    if (open) setShowShop(false);
    setShowPhone(open);
  };

  useEffect(() => {
    setShowShop(false);
  }, [currentRoute, activeGame]);

  useEffect(() => {
    if (showOptions) setShowShop(false);
  }, [showOptions]);

  const handleShopClick = () => {
    if (showShop) {
      setShowShop(false);
    } else {
      setShowPhone(false);
      closeOptionsWithAnimation();
      resetToDefaultView();
      setShowShop(true);
    }
  };

  const showTapUpgrades = !showShop && !showOptions && isHomeRoute && !isPhoneView();

  const showBackToLobby = activeGame !== "LOBBY";

  const hideNavigation =
    (isPortfolioRoute && isImageFocused) ||
    focusedBook ||
    currentView === CAMERA_VIEWS.bookshelf.id ||
    (isObjectView() && !isPhoneView() && !isPortfolioRoute && currentView !== "shop:preview");

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
        zIndex:
          activeGame === "FLAPPY_BIRD" || activeGame === "PING_PONG"
            ? 1000
            : undefined,
      }}
    >
      <AnimatePresence>{showShop && <ShopOverlay key="shop-overlay" />}</AnimatePresence>
      <TapUpgrades show={showTapUpgrades} />
      <BackToLobbyButton show={showBackToLobby} />
      <HugRow data-bob-navigation $gap={"8px"} style={{ height: showBackToLobby ? 0 : "auto" }}>
        <AnimatePresence mode="popLayout">
          {!showBackToLobby && !hideNavigation && (
            <MenuButton
              key="menu-button"
              onClick={handleMenuButtonClick}
              data-ui-sound-id={menuButtonSoundId}
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
            <motion.div key="bob-phone-wrapper">
              <BobPhone isOpen={showPhone} setIsOpen={handlePhoneClick} />
            </motion.div>
          )}
          {!showBackToLobby && !hideNavigation && (
            <ShopNavButton
              key="shop-button"
              onClick={handleShopClick}
              data-ui-sound-id={showShop ? "ui-tap-close" : "ui-tap"}
              aria-expanded={showShop}
              $isActive={showShop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
              transition={{ type: "spring", bounce: 0.5 }}
              layout="position"
            >
              <span>{showShop ? <CloseIcon /> : <CartIcon />}</span>
              <span>{messages.navigation.shopLabel}</span>
            </ShopNavButton>
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

  /* background: var(--primary-color); */
  background: #212026;
  box-shadow: 0 6px 0 #0b0b0c;
  border: 3px solid #0b0b0c;
  color: var(--text-color);

  outline: 2px solid transparent;
  outline-color: ${(props) => (props.$isActive ? "#ffffff" : "transparent")};
  outline-offset: ${(props) => (props.$isActive ? "6px 3px" : "0")};

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
    font-weight: 900;
  }
`;

const ShopNavButton = styled(MenuButton)`
  background: #4178f7;
  border-color: #2a5ee2;
  box-shadow: 0 6px 0 #2a5ee2;
  outline-offset: 1px;
`;
