import { useClickOutside } from "@/hooks/useClickOutside";
import { usePagination } from "@/hooks/usePagination";
import { CloseIcon } from "@/icons/close";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { HugColumn } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { useCoreStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import styled from "styled-components";
import { formatNumber } from "./TapCounter";
import { useKeyPress } from "@/hooks/useKeyPress";
import { playUISound } from "@/utils/soundSystem";
import { useI18n } from "@/i18n";
import { getUpgradeCopy } from "@/shop-items/upgrades.messages";
import { calculateUpgradeCost } from "@/shop-items/upgradeMath";

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
  const {
    upgrades: tapUpgrades,
    purchaseUpgrade,
    canAfford,
    getAutoTapRate,
    getTotalTapMultiplier,
  } = useCoreStore();
  const { locale } = useI18n();
  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(tapUpgrades, UPGRADE_PAGE_SIZE);

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
  };

  const canAffordUpgrade = tapUpgrades.some(
    (t) => t.level < t.maxLevel && canAfford(calculateUpgradeCost(t)),
  );
  const autoTapRate = getAutoTapRate();
  const tapPower = getTotalTapMultiplier();

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
          <AnimatePresence mode="wait">
            {showUpgrades && (
              <UpgradeOpenState
                key="tap-upgrades-open-state"
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                transition={{
                  type: "spring" as const,
                  bounce: 0.28,
                }}
              >
                <UpgradePanel $gap={"0.5rem"} $align="center">
                  <UpgradePanelHeader>
                    <UpgradeSummaryRow>
                      <UpgradeSummaryChip>
                        <strong>{formatNumber(autoTapRate)}</strong>
                        <span>passive / s</span>
                      </UpgradeSummaryChip>
                      <UpgradeSummaryChip>
                        <strong>x{formatMultiplier(tapPower)}</strong>
                        <span>tap power</span>
                      </UpgradeSummaryChip>
                    </UpgradeSummaryRow>
                  </UpgradePanelHeader>

                  <UpgradeCardsBody>
                    <AnimatePresence mode="wait" initial={false}>
                      <UpgradeCardGrid
                        key={`tap-upgrades-page-${page}`}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                        transition={{
                          type: "spring" as const,
                          bounce: 0.18,
                          duration: 0.22,
                        }}
                      >
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
                            <UpgradeCardButton
                              key={upgrade.id}
                              $disabled={!canBuy}
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
                              whileTap={canBuy ? { scale: 0.97 } : undefined}
                              title={`${upgradeCopy.description}\n${effectLabel}\n${currentEffectLabel}`}
                            >
                              <UpgradeCardInner>
                                <UpgradeContentGroup>
                                  <UpgradeName>{upgradeCopy.name}</UpgradeName>
                                  <UpgradeDescription>
                                    {upgradeCopy.description}
                                  </UpgradeDescription>
                                  <UpgradeEffect>{effectLabel}</UpgradeEffect>
                                  <UpgradeSubEffect>
                                    {currentEffectLabel}
                                  </UpgradeSubEffect>
                                </UpgradeContentGroup>

                                <UpgradeCardFooter>
                                  <LevelContainer>
                                    {upgrade.level}/{upgrade.maxLevel}
                                  </LevelContainer>
                                  {isMaxLevel ? (
                                    <MaxLevelBadge>MAX</MaxLevelBadge>
                                  ) : (
                                    <TapCosts $disabled={!canAffordNextUpgrade}>
                                      {formatNumber(priceForNextLevel)} 🫵
                                    </TapCosts>
                                  )}
                                </UpgradeCardFooter>
                              </UpgradeCardInner>
                            </UpgradeCardButton>
                          );
                        })}
                      </UpgradeCardGrid>
                    </AnimatePresence>
                  </UpgradeCardsBody>
                </UpgradePanel>

                {pageCount > 1 && (
                  <UpgradeStepperWrap
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  >
                    <UpgradeStepper>
                      {Array(pageCount)
                        .fill(null)
                        .map((_, i) => (
                          <UpgradeStepperDot
                            key={`tap-upgrades-pagination-dot-${i}`}
                            type="button"
                            onClick={() => {
                              goTo(i);
                              playUISound("ui-tap");
                            }}
                            $active={page === i}
                            aria-label={`Go to upgrades page ${i + 1}`}
                          >
                            <motion.span
                              animate={{
                                width: page === i ? "18px" : "6px",
                                opacity: page === i ? 1 : 0.45,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 26,
                              }}
                            />
                          </UpgradeStepperDot>
                        ))}
                    </UpgradeStepper>
                  </UpgradeStepperWrap>
                )}
              </UpgradeOpenState>
            )}
          </AnimatePresence>

          <UpgradeControlsDock ref={triggerRef}>
            <UpgradeNavRow $open={showUpgrades}>
              {showUpgrades && pageCount > 1 && (
                <UpgradeNavButton
                  type="button"
                  onClick={handlePrevPage}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Previous upgrades page"
                >
                  <ChevronLeftIcon />
                </UpgradeNavButton>
              )}

              <TriggerShell>
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

                {!showUpgrades && canAffordUpgrade && (
                  <UpgradeIndicator
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  />
                )}
              </TriggerShell>

              {showUpgrades && pageCount > 1 && (
                <UpgradeNavButton
                  type="button"
                  onClick={handleNextPage}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Next upgrades page"
                >
                  <ChevronRightIcon />
                </UpgradeNavButton>
              )}
            </UpgradeNavRow>
          </UpgradeControlsDock>
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

const UpgradeOpenState = styled(motion.div)`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
`;

const UpgradePanel = styled(HugColumn)`
  width: min(31rem, calc(100vw - 0.5rem));
  padding: 0.85rem;
  border-radius: 1.55rem;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 16px 32px rgba(17, 17, 17, 0.1),
    0 4px 12px rgba(17, 17, 17, 0.06);
  border: 1px solid rgba(17, 17, 17, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
`;

const UpgradePanelHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.42rem;
  padding: 0.12rem 0.1rem 0.28rem;
`;

const UpgradeSummaryRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
`;

const UpgradeSummaryChip = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
  min-width: 7rem;
  padding: 0.48rem 0.7rem;
  border-radius: 1rem;
  background: rgba(17, 17, 17, 0.045);
  border: 1px solid rgba(17, 17, 17, 0.08);

  strong {
    font-size: 0.92rem;
    line-height: 1;
    font-weight: 800;
    color: #171717;
  }

  span {
    font-size: 0.64rem;
    line-height: 1.1;
    font-weight: 700;
    color: rgba(23, 23, 23, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const UpgradeCardsBody = styled.div`
  width: 100%;
  padding: 0.1rem 0;
`;

const UpgradeCardGrid = styled(motion.div)`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
`;

const LevelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 0.625rem;
  min-height: 1.45rem;
  padding: 0.2rem 0.45rem;

  background-color: rgba(17, 17, 17, 0.08);
  color: #212121;

  font-weight: 700;
  font-size: 0.7rem;
`;

const TapCosts = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 0.625rem;
  min-height: 1.45rem;
  padding: 0.32rem 0.5rem;

  background-color: ${({ $disabled }) =>
    $disabled ? "rgba(23, 23, 23, 0.12)" : "#212121"};
  color: ${({ $disabled }) => ($disabled ? "rgba(23, 23, 23, 0.4)" : "#ffffff")};

  font-weight: 900;
  font-size: 0.7rem;
  word-break: none;
`;

const MaxLevelBadge = styled(TapCosts)`
  background-color: #dff7e7;
  color: #1f6b39;
`;

const UpgradeName = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.2;
  font-size: 0.84rem;
  font-weight: 700;
  color: #171717;
`;

const UpgradeDescription = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.25;
  font-size: 0.68rem;
  font-weight: 500;
  color: rgba(23, 23, 23, 0.72);
`;

const UpgradeEffect = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.2;
  font-size: 0.68rem;
  font-weight: 700;
  color: #171717;
`;

const UpgradeSubEffect = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.2;
  font-size: 0.66rem;
  font-weight: 600;
  color: rgba(23, 23, 23, 0.56);
`;

const TriggerContainer = styled(motion.button)`
  display: inline-flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.9rem;
  border-radius: 50px;
  background-color: #fff;
  opacity: 1;
  box-shadow:
    0 10px 24px rgba(17, 17, 17, 0.12),
    0 2px 8px rgba(17, 17, 17, 0.08);
  border: 1px solid rgba(17, 17, 17, 0.08);

  font-size: 0.96rem;
  font-weight: 700;
  color: #212121;
  margin: 0 auto;
  overflow: clip;

  span {
    max-height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

const UpgradeCardButton = styled(motion.button)<{ $disabled?: boolean }>`
  display: flex;
  align-items: stretch;
  justify-content: stretch;

  width: 100%;
  min-height: 7.8rem;
  padding: 0;
  background-color: ${({ $disabled }) =>
    $disabled ? "rgba(17, 17, 17, 0.025)" : "rgba(17, 17, 17, 0.04)"};
  border: 1px solid
    ${({ $disabled }) =>
      $disabled ? "rgba(17, 17, 17, 0.05)" : "rgba(17, 17, 17, 0.08)"};
  border-radius: 1.1rem;

  color: ${({ $disabled }) => ($disabled ? "rgba(23, 23, 23, 0.42)" : "#171717")};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.72 : 1)};

  &:disabled {
    color: rgba(23, 23, 23, 0.4);
    background: rgba(17, 17, 17, 0.025);
  }

  &:hover:not(:disabled) {
    background: rgba(17, 17, 17, 0.07);
  }
`;

const UpgradeCardInner = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 0.4rem;
  width: 100%;
  padding: 0.72rem 0.62rem 0.62rem;
`;

const UpgradeContentGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.18rem;
  width: 100%;
`;

const UpgradeCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const TriggerShell = styled.div`
  position: relative;
  display: inline-flex;
  justify-content: center;
`;

const UpgradeControlsDock = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-top: 0.05rem;
`;

const UpgradeNavRow = styled.div<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  position: relative;
  z-index: 1;
`;

const UpgradeNavButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #171717;
  border: 1px solid rgba(17, 17, 17, 0.08);
  box-shadow:
    0 10px 24px rgba(17, 17, 17, 0.12),
    0 2px 8px rgba(17, 17, 17, 0.08);

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const UpgradeStepperWrap = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 0.35rem;
`;

const UpgradeStepper = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  padding: 0.2rem 0.28rem;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  box-shadow:
    0 8px 20px rgba(17, 17, 17, 0.1),
    0 2px 6px rgba(17, 17, 17, 0.06);
`;

const UpgradeStepperDot = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.16rem;
  border-radius: 999px;
  background: transparent;

  span {
    display: block;
    height: 6px;
    border-radius: 999px;
    background: ${({ $active }) =>
      $active ? "rgba(23, 23, 23, 0.95)" : "rgba(23, 23, 23, 0.45)"};
  }
`;
