import { useClickOutside } from "@/hooks/useClickOutside";
import { usePagination } from "@/hooks/usePagination";
import { CloseIcon } from "@/icons/close";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { HugColumn, HugRow } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { useCoreStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import styled from "styled-components";
import { formatNumber } from "./TapCounter";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useQuestActions } from "@/hooks/useQuestSystem";
import { playUISound } from "@/utils/soundSystem";
import { useI18n } from "@/i18n";
import { getUpgradeCopy } from "@/shop-items/upgrades.messages";
import { calculateUpgradeCost } from "@/shop-items/upgradeMath";
import { PaginationButton, PaginationDots } from "@/apps/ui";

const UPGRADE_PAGE_SIZE = 3;

const formatMultiplier = (value: number): string => {
  if (value >= 1_000) return formatNumber(value);
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/\.?0+$/, "");
};

const getUpgradeEffectLabel = (upgrade: {
  effect: { type: "autoTap" | "tapMultiplier"; value: number };
}) => {
  if (upgrade.effect.type === "autoTap") {
    return `+${formatNumber(upgrade.effect.value)}/s each level`;
  }

  return `x${formatMultiplier(upgrade.effect.value)} tap power per level`;
};

const getUpgradeCurrentEffectLabel = (upgrade: {
  level: number;
  effect: { type: "autoTap" | "tapMultiplier"; value: number };
}) => {
  if (upgrade.effect.type === "autoTap") {
    const current = upgrade.effect.value * upgrade.level;
    return `Current: +${formatNumber(current)}/s`;
  }

  const currentMultiplier = Math.pow(upgrade.effect.value, upgrade.level);
  return `Current: x${formatMultiplier(currentMultiplier)}`;
};

export const TapUpgrades = ({ show }: { show: boolean }) => {
  const { upgrades: tapUpgrades, purchaseUpgrade, canAfford } = useCoreStore();
  const { locale } = useI18n();
  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(tapUpgrades, UPGRADE_PAGE_SIZE);

  const { triggerQuest } = useQuestActions();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const [showUpgrades, setShowUpgrades] = useState(false);

  useClickOutside([containerRef, triggerRef], () => setShowUpgrades(false));
  useKeyPress("Escape", () => {
    setShowUpgrades(false);
    playUISound("ui-tap-close");
  });

  const onTriggerClick = () => {
    setShowUpgrades((open) => !open);
    playUISound();
  };

  const handleNextPage = () => {
    if (hasNext) next();
    else goTo(0);
    playUISound("ui-tap");
  };

  const handlePrevPage = () => {
    if (hasPrev) prev();
    else goTo(pageCount - 1);
    playUISound("ui-tap");
  };

  const handleUpgradePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);

    triggerQuest(`${upgradeId}_level`);
  };

  const canAffordUpgrade = tapUpgrades.some(
    (t) => t.level < t.maxLevel && canAfford(calculateUpgradeCost(t)),
  );

  return (
    <AnimatePresence>
      {show && (
        <HugColumn
          key="upgrades-column"
          style={{ opacity: 0, translateZ: 0 }}
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
          ref={containerRef}
        >
          <AnimatePresence>
            {showUpgrades && (
              <HugColumn $align="center" $gap={"0.5rem"}>
                <HugRow $gap={"0.25rem"} $align="center">
                  {data.map((upgrade, i) => {
                    const upgradeCopy = getUpgradeCopy(upgrade.id, locale);
                    const isMaxLevel = upgrade.level === upgrade.maxLevel;
                    const priceForNextLevel = calculateUpgradeCost(upgrade);
                    const canAffordNextUpgrade = canAfford(priceForNextLevel);
                    const canBuy = !isMaxLevel && canAffordNextUpgrade;
                    const effectLabel = getUpgradeEffectLabel(upgrade);
                    const currentEffectLabel =
                      getUpgradeCurrentEffectLabel(upgrade);

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
                        whileTap={{ scale: 0.97 }}
                        title={`${upgradeCopy.description}\n${effectLabel}\n${currentEffectLabel}`}
                      >
                        <UpgradeName>{upgradeCopy.name}</UpgradeName>
                        <UpgradeEffect>{effectLabel}</UpgradeEffect>
                        <UpgradeSubEffect>{currentEffectLabel}</UpgradeSubEffect>

                        <HugRow
                          $align="center"
                          $justify="space-between"
                          style={{ width: "100%" }}
                        >
                          <LevelContainer>Lvl {upgrade.level}</LevelContainer>

                          {isMaxLevel ? (
                            <MaxLevelBadge>MAX</MaxLevelBadge>
                          ) : (
                            <TapCosts>{formatNumber(priceForNextLevel)} 🫵</TapCosts>
                          )}
                        </HugRow>
                      </UpgradeButton>
                    );
                  })}
                </HugRow>

                {pageCount > 1 && (
                  <PaginationDots $contrastMode>
                    <PaginationButton onClick={handlePrevPage}>
                      <ChevronLeftIcon />
                    </PaginationButton>

                    <HugRow $gap={"4px"}>
                      {Array(pageCount)
                        .fill(null)
                        .map((_, i) => (
                          <motion.div
                            key={`tap-upgrades-pagination-dot-${i}`}
                            animate={{
                              width: page === i ? "20px" : "8px",
                              opacity: page === i ? 1 : 0.35,
                            }}
                          />
                        ))}
                    </HugRow>

                    <PaginationButton onClick={handleNextPage}>
                      <ChevronRightIcon />
                    </PaginationButton>
                  </PaginationDots>
                )}
              </HugColumn>
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
              ref={triggerRef}
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
            {!showUpgrades && canAffordUpgrade && (
              <UpgradeIndicator
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              />
            )}
          </Magnetic>
        </HugColumn>
      )}
    </AnimatePresence>
  );
};

const UpgradeIndicator = styled(motion.span)`
  position: absolute;
  top: -2px;
  right: -2px;
  height: 12px;
  width: 12px;
  background: red;
  border-radius: 50%;
`;

const LevelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 0.625rem;
  padding: 0.2rem 0.45rem;

  background-color: #010101;
  color: #fff;

  font-weight: 600;
  font-size: 0.7rem;
`;

const TapCosts = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 0.625rem;
  padding: 0.2rem 0.45rem;

  background-color: #ffff54;
  color: #010101;

  font-weight: 900;
  font-size: 0.7rem;
  word-break: none;
`;

const MaxLevelBadge = styled(TapCosts)`
  background-color: #7af9a5;
`;

const UpgradeName = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.2;
  font-size: 0.9rem;
  font-weight: 700;
`;

const UpgradeEffect = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.2;
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.9;
`;

const UpgradeSubEffect = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.2;
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.75;
  margin-bottom: 0.15rem;
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
  opacity: 1;

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
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.25rem;

  width: 162px;
  min-height: 106px;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  border-radius: 0.875rem;

  color: #fff;

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.5);
  }
`;
