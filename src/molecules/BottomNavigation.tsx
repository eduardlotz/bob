import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/gameStore";
import { useAppStore, ROUTE_PATHS } from "@/store";
import { UpgradesIcon } from "@/icons/upgrades";
import { CartIcon } from "@/icons/cart";
import { MenuIcon } from "@/icons/menu";
import { CloseIcon } from "@/icons/close";
import { Shop } from "./Shop";

export function BottomNavigation() {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);

  const {
    upgrades,
    purchaseUpgrade,
    canAfford,
    getAutoTapRate,
    manualTapsPerSecond,
  } = useGameStore();
  const { currentRoute, showOptions, setShowOptions } = useAppStore();

  // Only show upgrade/shop buttons on home route
  const isHomeRoute = currentRoute === ROUTE_PATHS.HOME;
  const autoTapRate = getAutoTapRate();

  const totalTapsPerSecond = autoTapRate + manualTapsPerSecond;
  const tapUpgrades = upgrades.filter((u) => u.category === "upgrades");
  const hasAnyUpgrade = tapUpgrades.some((u) => u.unlocked);

  const handleUpgradePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };

  return (
    <>
      <NavigationContainer>
        {isHomeRoute && (
          <NavButton
            onClick={() => setIsUpgradesOpen(!isUpgradesOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            $isActive={isUpgradesOpen}
          >
            <AnimatePresence mode="popLayout">
              {isUpgradesOpen ? (
                <motion.div
                  key="close"
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
                </motion.div>
              ) : (
                <motion.div
                  key="upgrade"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    type: "spring" as const,
                    bounce: 0.5,
                  }}
                >
                  {hasAnyUpgrade ? (
                    <UpgradeButtonContent>
                      <FingerIcon>🫵</FingerIcon>
                      <TapMultiplier>{totalTapsPerSecond}/s</TapMultiplier>
                    </UpgradeButtonContent>
                  ) : (
                    <UpgradesIcon color="#ffffff" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </NavButton>
        )}

        <MenuButton
          onClick={() => setShowOptions(!showOptions)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          $isActive={showOptions}
        >
          <AnimatePresence mode="popLayout">
            {showOptions ? (
              <motion.div
                key="close"
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
              </motion.div>
            ) : (
              <motion.div
                key="menu"
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
              </motion.div>
            )}
          </AnimatePresence>
        </MenuButton>

        {isHomeRoute && (
          <NavButton
            onClick={() => setIsShopOpen(!isShopOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            $isActive={isShopOpen}
          >
            <AnimatePresence mode="popLayout">
              {isShopOpen ? (
                <motion.div
                  key="close"
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
                </motion.div>
              ) : (
                <motion.div
                  key="cart"
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
                </motion.div>
              )}
            </AnimatePresence>
          </NavButton>
        )}
      </NavigationContainer>

      <Shop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />

      <AnimatePresence>
        {isUpgradesOpen && (
          <UpgradesPanel
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <UpgradesContent>
              <UpgradesHeader>
                <UpgradesTitle>Tap Upgrades</UpgradesTitle>
                <CloseButton onClick={() => setIsUpgradesOpen(false)}>
                  ×
                </CloseButton>
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
                      <UpgradeCost>
                        Cost:{" "}
                        {Math.floor(
                          upgrade.baseCost *
                            Math.pow(upgrade.costMultiplier, upgrade.level)
                        )}
                      </UpgradeCost>
                    </UpgradeInfo>
                    <UpgradeLevel>
                      {upgrade.unlocked
                        ? `Level ${upgrade.level}/${upgrade.maxLevel}`
                        : "Locked"}
                    </UpgradeLevel>
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
const NavigationContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  pointer-events: auto;
`;

const NavButton = styled(motion.button)<{ $isActive?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(14px);
  border: ${(props) =>
    props.$isActive
      ? "2px solid #ffffff"
      : "1px solid rgba(255, 255, 255, 0.1)"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  opacity: ${(props) => (props.$isActive ? 1 : 0.75)};

  &:hover {
    background: rgba(0, 0, 0, 0.9);
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
  color: #ffd700;
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
  border: ${(props) => (props.$isActive ? "2px solid #ffffff" : "none")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(41, 121, 255, 0.3);
  transition: all 0.2s;
  pointer-events: auto;
  /* opacity: ${(props) => (props.$isActive ? 1 : 0.3)}; */
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
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666666;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: #ffffff;
  }
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
  margin-bottom: 2px;
`;

const UpgradeDescription = styled.div`
  font-size: 12px;
  color: #666666;
`;

const UpgradeCost = styled.div`
  font-size: 10px;
  color: #ffd700;
  font-weight: 500;
  margin-top: 4px;
`;

const UpgradeLevel = styled.div`
  font-size: 12px;
  color: #ffd700;
  font-weight: 500;
`;
