import { useClickOutside } from "@/hooks/useClickOutside";
import { CloseIcon } from "@/icons/close";
import { FillRow, HugColumn, HugRow } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { ROUTE_PATHS, useAppStore, useGameStore } from "@/store";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

export const TapUpgrades = ({ show }: { show: boolean }) => {
  const { currentRoute } = useAppStore();
  const {
    upgrades,
    purchaseUpgrade,
    canAfford,
    getAutoTapRateUncached,
    manualTapsPerSecond,
    getTotalTapMultiplierUncached,
  } = useGameStore();

  const containerRef = useRef(null);
  const [showUpgrades, setShowUpgrades] = useState(false);

  const tapUpgrades = upgrades.filter((u) => u.category === "upgrades");

  useClickOutside(containerRef, () => setShowUpgrades(false));

  //   const totalTapsPerSecond = useMemo(() => {
  //     const autoTapRate =
  //       getAutoTapRateUncached() * getTotalTapMultiplierUncached();
  //     return autoTapRate + manualTapsPerSecond;
  //   }, [
  //     getAutoTapRateUncached,
  //     getTotalTapMultiplierUncached,
  //     manualTapsPerSecond,
  //     upgrades, // add upgrades as dependency so calculation updates when upgrades change
  //   ]);

  const onTriggerClick = () => {
    setShowUpgrades((open) => !open);
  };

  const handleUpgradePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };

  return (
    <AnimatePresence mode="popLayout">
      {show && (
        <HugColumn
          initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          transition={{
            type: "spring" as const,
            bounce: 0.5,
          }}
          $gap={"0.75rem"}
          $align="center"
          $justify="flex-end"
        >
          <AnimatePresence>
            {showUpgrades && (
              <HugRow $gap={"0.25rem"} $align="center" ref={containerRef}>
                {tapUpgrades.map((upgrade, i) => {
                  const isMaxLevel = upgrade.level === upgrade.maxLevel;

                  const priceForNextLevel =
                    upgrade.baseCost *
                    Math.pow(upgrade.costMultiplier, upgrade.level);

                  const canAffordNextUpgrade = canAfford(priceForNextLevel);

                  const canBuy = !isMaxLevel && canAffordNextUpgrade;
                  return (
                    <UpgradeButton
                      key={upgrade.id}
                      initial={{ filter: "blur(6px)", opacity: 0 }}
                      animate={{
                        filter: "blur(0px)",
                        opacity: 1,
                        transition: {
                          delay: i * 0.05 + 0.02,
                        },
                      }}
                      exit={{ filter: "blur(6px)", opacity: 0 }}
                      transition={{
                        type: "spring" as const,
                        bounce: 0.2,
                      }}
                      onClick={() => handleUpgradePurchase(upgrade.id)}
                      disabled={!canBuy}
                    >
                      {upgrade.name}

                      <HugRow
                        $align="center"
                        $justify="center"
                        $gap={"0.325rem"}
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 4px)",
                          margin: "0 auto",
                          left: 0,
                          right: 0,
                        }}
                      >
                        <LevelContainer>
                          {isMaxLevel
                            ? "Max Level"
                            : upgrade.level + "/" + upgrade.maxLevel}
                        </LevelContainer>
                        {!isMaxLevel && (
                          <TapCosts>{priceForNextLevel} 🫵</TapCosts>
                        )}
                      </HugRow>
                    </UpgradeButton>
                  );
                })}
              </HugRow>
            )}
          </AnimatePresence>

          <Magnetic>
            <TriggerContainer
              key="tap-upgrades-container"
              onClick={onTriggerClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              style={{ borderRadius: "50px" }}
            >
              {showUpgrades ? (
                <motion.span
                  key="hide-ugprades-icon"
                  initial={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  exit={{ filter: "blur(6px)", opacity: 0, y: -20 }}
                  transition={{
                    type: "spring" as const,
                    bounce: 0.2,
                  }}
                >
                  <CloseIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="show-ugprades-icon"
                  initial={{ filter: "blur(6px)", opacity: 0, y: -20 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  exit={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                  transition={{
                    type: "spring" as const,
                    bounce: 0.2,
                  }}
                >
                  Upgrades
                </motion.span>
              )}
            </TriggerContainer>
          </Magnetic>
        </HugColumn>
      )}
    </AnimatePresence>
  );
};

const LevelContainer = styled.div`
  display: flex;
  align-items: center;

  border-radius: 0.5rem;
  padding: 0.25rem 0.4rem;

  background-color: #010101;
  color: #fff;

  font-weight: 600;
  font-size: 0.75rem;
`;

const TapCosts = styled.div`
  display: flex;
  align-items: center;

  border-radius: 1rem;
  padding: 0.25rem 0.5rem;

  background-color: #ffff54;
  color: #010101;

  font-weight: 900;
  font-size: 0.75rem;
`;

const TriggerContainer = styled(motion.button)`
  display: inline-flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  background-color: #fff;

  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  margin: 0 auto;
  overflow: clip;

  span {
    max-height: 1.5rem;
  }
`;

const UpgradeButton = styled(motion.button)`
  display: flex;
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  border-radius: 50px;

  font-size: 1rem;
  font-weight: 600;
  color: #fff;

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }
`;
