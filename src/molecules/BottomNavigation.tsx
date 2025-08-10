import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, stagger } from "motion/react";
import { useGameStore } from "@/store/gameStore";
import { useAppStore, ROUTE_PATHS } from "@/store";
import { UpgradesIcon } from "@/icons/upgrades";
import { CartIcon } from "@/icons/cart";
import { MenuIcon } from "@/icons/menu";
import { CloseIcon } from "@/icons/close";
import { Shop } from "./Shop";
import { ProgressTracker } from "./ProgressTracker";

type NavigationView = "shop" | "upgrades" | "quests" | "menu" | "default";

export function BottomNavigation() {
  // const [isShopOpen, setIsShopOpen] = useState(false);
  // const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [currentView, setCurrentView] = useState<NavigationView>("default");

  const {
    upgrades,
    purchaseUpgrade,
    canAfford,
    getAutoTapRateUncached,
    manualTapsPerSecond,
    getTotalTapMultiplierUncached,
  } = useGameStore();
  const { currentRoute, showOptions, toggleOptions } = useAppStore();

  // Only show upgrade/shop buttons on home route
  const isHomeRoute = currentRoute === ROUTE_PATHS.HOME;

  const totalTapsPerSecond = useMemo(() => {
    const autoTapRate =
      getAutoTapRateUncached() * getTotalTapMultiplierUncached();
    return autoTapRate + manualTapsPerSecond;
  }, [
    getAutoTapRateUncached,
    getTotalTapMultiplierUncached,
    manualTapsPerSecond,
    upgrades, // add upgrades as dependency so calculation updates when upgrades change
  ]);
  const tapUpgrades = upgrades.filter((u) => u.category === "upgrades");
  const hasAnyUpgrade = tapUpgrades.some((u) => u.unlocked);

  const handleUpgradePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };

  const handleMenuButtonClick = () => {
    toggleOptions();
    handleNavigationClick("menu");
  };

  const handleNavigationClick = (view: NavigationView) => {
    if (currentView === view) {
      setCurrentView("default");
    } else {
      setCurrentView(view);
    }
  };

  return (
    <>
      <NavigationContainer
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{
          duration: 0.5,
          type: "spring",
          mass: 0.5,
        }}
      >
        {isHomeRoute ? (
          <NavButton
            onClick={() => handleNavigationClick("upgrades")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            $isActive={currentView === "upgrades"}
            data-ui-sound-id="ui-tap-2"
          >
            <AnimatePresence mode="popLayout">
              {currentView === "upgrades" ? (
                <motion.span
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
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    type: "spring" as const,
                    bounce: 0.5,
                  }}
                >
                  <UpgradeButtonContent>
                    <FingerIcon>🫵</FingerIcon>
                    <TapMultiplier>{totalTapsPerSecond}/s</TapMultiplier>
                  </UpgradeButtonContent>
                </motion.span>
              )}
            </AnimatePresence>
          </NavButton>
        ) : (
          <ProgressTracker />
        )}

        <MenuButton
          onClick={handleMenuButtonClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          $isActive={showOptions}
          data-ui-sound-id="ui-tap-2"
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

        <NavButton
          onClick={() => handleNavigationClick("shop")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          $isActive={currentView === "shop"}
          data-ui-sound-id="ui-tap-2"
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
      </NavigationContainer>

      <Shop
        isOpen={currentView === "shop"}
        onClose={() => setCurrentView("default")}
      />

      <AnimatePresence>
        {currentView === "upgrades" && (
          <UpgradesPanel
            key="upgrades-panel"
            initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <UpgradesContent>
              <UpgradesHeader>
                <UpgradesTitle>Upgrades</UpgradesTitle>
              </UpgradesHeader>
              <UpgradesList>
                {tapUpgrades.map((upgrade) => (
                  <UpgradeItem
                    key={upgrade.id}
                    onClick={() => handleUpgradePurchase(upgrade.id)}
                    $canAfford={canAfford(
                      upgrade.baseCost *
                        Math.pow(upgrade.costMultiplier, upgrade.level)
                    )}
                  >
                    <UpgradeIcon>{upgrade.icon}</UpgradeIcon>
                    <UpgradeInfo>
                      <UpgradeName>{upgrade.name}</UpgradeName>
                      <UpgradeDescription>
                        {upgrade.description}
                      </UpgradeDescription>
                      <UpgradeLevel>
                        {upgrade.unlocked
                          ? `Level ${upgrade.level}/${upgrade.maxLevel}`
                          : "Locked"}
                      </UpgradeLevel>
                    </UpgradeInfo>
                    <UpgradeCost>
                      {Math.floor(
                        upgrade.baseCost *
                          Math.pow(upgrade.costMultiplier, upgrade.level)
                      )}
                      {" taps"}
                    </UpgradeCost>
                  </UpgradeItem>
                ))}
              </UpgradesList>
            </UpgradesContent>
          </UpgradesPanel>
        )}
      </AnimatePresence>
    </>
  );
}

// Styled Components
const NavigationContainer = styled(motion.div)`
  position: fixed;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  pointer-events: auto;
`;

export const NavButton = styled(motion.button)<{ $isActive?: boolean }>`
  height: 58px;
  min-width: 64px;
  width: 64px;
  max-width: 64px;
  padding: 20px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.25);

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  outline: 2px solid transparent;
  outline-color: ${(props) => (props.$isActive ? "#ffffff" : "transparent")};
  outline-offset: ${(props) => (props.$isActive ? "3px" : "0")};

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition-duration: 0.2s;
  transition-property: box-shadow, opacity, border, background-color, width,
    height;
  pointer-events: auto;

  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
    border-color: ${(props) =>
      props.$isActive ? "#ffffff" : "rgba(255, 255, 255, 0.2)"};
    opacity: 1;
  }
`;

const UpgradeButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const TapMultiplier = styled.div`
  font-size: 12px;
  font-weight: bold;
  color: var(--accent-color);
  line-height: 1;
`;

const FingerIcon = styled.div`
  font-size: 16px;
  line-height: 1;
`;

const MenuButton = styled(motion.button)<{ $isActive?: boolean }>`
  padding: 20px 30px;
  border-radius: 24px;
  background: var(--primary-color);

  outline: 2px solid transparent;
  outline-color: ${(props) => (props.$isActive ? "#ffffff" : "transparent")};
  outline-offset: ${(props) => (props.$isActive ? "3px" : "0")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(41, 121, 255, 0.3);
  transition-duration: 0.2s;
  transition-property: box-shadow, opacity, border-color;
  pointer-events: auto;
  color: var(--text-color);

  &:hover {
    box-shadow: 0 6px 16px rgba(41, 121, 255, 0.4);
    opacity: 1;
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
