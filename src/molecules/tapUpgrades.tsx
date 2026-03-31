import { useClickOutside } from "@/hooks/useClickOutside";
import { usePagination } from "@/hooks/usePagination";
import { CloseIcon } from "@/icons/close";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { HugColumn } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { PaginationButton } from "@/apps/ui";
import { useCoreStore, type Upgrade } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { formatNumber } from "@/utils/formatNumber";
import { useKeyPress } from "@/hooks/useKeyPress";
import { playUISound } from "@/utils/soundSystem";
import { useI18n } from "@/i18n";
import { getUpgradeCopy } from "@/shop-items/upgrades.messages";
import { calculateUpgradeCost } from "@/shop-items/upgradeMath";

const UPGRADE_PAGE_SIZE = 3;
const UPGRADE_LAYOUT_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.55,
};

const formatUpgradeMultiplier = (value: number) => {
  if (value >= 100) return formatNumber(value);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
};

const getSafeUpgradeCost = (upgrade: Upgrade) => {
  const cost = calculateUpgradeCost(upgrade);
  return Number.isFinite(cost) ? cost : Number.POSITIVE_INFINITY;
};

const getUpgradePerLevelLabel = (upgrade: Upgrade, locale: string) => {
  if (upgrade.effect.type === "autoTap") {
    return locale === "de"
      ? `+${formatNumber(upgrade.effect.value)}/s pro Level`
      : `+${formatNumber(upgrade.effect.value)}/s per level`;
  }

  const percentGain = (upgrade.effect.value - 1) * 100;
  const roundedPercent =
    percentGain % 1 === 0 ? percentGain.toFixed(0) : percentGain.toFixed(1);

  return locale === "de"
    ? `+${roundedPercent}% Tap-Staerke pro Level`
    : `+${roundedPercent}% tap power per level`;
};

const getUpgradeCurrentPowerLabel = (upgrade: Upgrade, locale: string) => {
  if (upgrade.effect.type === "autoTap") {
    return `+${formatNumber(upgrade.effect.value * upgrade.level)}/s`;
  }

  const currentMultiplier = Math.pow(upgrade.effect.value, upgrade.level);
  return locale === "de"
    ? `x${formatUpgradeMultiplier(currentMultiplier)} Tap`
    : `x${formatUpgradeMultiplier(currentMultiplier)} tap`;
};

export const TapUpgrades = ({ show }: { show: boolean }) => {
  const {
    upgrades: tapUpgrades,
    purchaseUpgrade,
    canAfford,
    taps,
  } = useCoreStore();
  const { locale } = useI18n();
  const purchasableUpgrades = useMemo(
    () => tapUpgrades.filter((upgrade) => upgrade.level < upgrade.maxLevel),
    [tapUpgrades],
  );
  const affordableUpgrades = useMemo(
    () =>
      purchasableUpgrades.filter((upgrade) =>
        canAfford(getSafeUpgradeCost(upgrade)),
      ),
    [canAfford, purchasableUpgrades, taps],
  );
  const visibleUpgrades = affordableUpgrades;
  const hasAffordableUpgrades = affordableUpgrades.length > 0;
  const hasAnyPurchasableUpgrades = purchasableUpgrades.length > 0;
  const hasVisiblePagination = visibleUpgrades.length > UPGRADE_PAGE_SIZE;
  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(visibleUpgrades, UPGRADE_PAGE_SIZE);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const [showUpgrades, setShowUpgrades] = useState(false);

  useEffect(() => {
    if (!show) {
      setShowUpgrades(false);
    }
  }, [show]);

  useClickOutside([containerRef, triggerRef], () => {
    if (!showUpgrades) return;

    setShowUpgrades(false);
    playUISound("ui-tap-close");
  });

  useKeyPress("Escape", () => {
    if (!showUpgrades) return;

    setShowUpgrades(false);
    playUISound("ui-tap-close");
  });

  const onTriggerClick = () => {
    setShowUpgrades((open) => !open);
  };

  const handleNextPage = () => {
    if (hasNext) next();
    else goTo(0);
  };

  const handlePrevPage = () => {
    if (hasPrev) prev();
    else goTo(pageCount - 1);
  };

  const handleUpgradePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };

  return (
    <AnimatePresence>
      {show && (
        <HugColumn
          key="upgrades-column"
          style={{ opacity: 0, translateZ: 0 }}
          initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 30, filter: "blur(4px)" }}
          transition={{ type: "spring", bounce: 0.22, duration: 0.24 }}
          $gap={"0.45rem"}
          $align="center"
          $justify="flex-end"
          ref={containerRef}
        >
          <AnimatePresence initial={false}>
            {showUpgrades && (
              <UpgradeOpenState
                key="tap-upgrades-open-state"
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                transition={{ duration: 0.14, ease: "easeOut" }}
              >
                <UpgradePanel>
                  <UpgradeContentArea layout transition={UPGRADE_LAYOUT_TRANSITION}>
                    <AnimatePresence mode="wait" initial={false}>
                      {data.length > 0 ? (
                        <UpgradeCardGrid
                          key={`tap-upgrades-page-${page}`}
                          $count={data.length}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={UPGRADE_LAYOUT_TRANSITION}
                        >
                          {data.map((upgrade) => {
                            const upgradeCopy = getUpgradeCopy(upgrade.id, locale);
                            const priceForNextLevel = getSafeUpgradeCost(upgrade);
                            const canBuy = canAfford(priceForNextLevel);
                            const levelLabel = `LVL ${upgrade.level} / ${upgrade.maxLevel}`;
                            const upgradeSubtitle = getUpgradePerLevelLabel(
                              upgrade,
                              locale,
                            );
                            const upgradePower = getUpgradeCurrentPowerLabel(
                              upgrade,
                              locale,
                            );

                            return (
                              <UpgradeCardButton
                                key={upgrade.id}
                                layout
                                transition={UPGRADE_LAYOUT_TRANSITION}
                                initial={{ opacity: 0, scale: 0.98, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                                onClick={() => handleUpgradePurchase(upgrade.id)}
                                disabled={!canBuy}
                                whileTap={canBuy ? { scale: 0.98 } : undefined}
                                title={upgradeCopy.name}
                                data-ui-sound-id="ui-tap"
                              >
                                <UpgradeCardHead>
                                  <UpgradeTitleGroup>
                                    <UpgradeName>{upgradeCopy.name}</UpgradeName>
                                    <UpgradePerLevel>
                                      {upgradeSubtitle}
                                    </UpgradePerLevel>
                                  </UpgradeTitleGroup>

                                  <UpgradePowerChip>{upgradePower}</UpgradePowerChip>
                                </UpgradeCardHead>

                                <UpgradeCardMeta>
                                  <UpgradeLevelValue>{levelLabel}</UpgradeLevelValue>
                                  <UpgradePriceChip $disabled={!canBuy}>
                                    {formatNumber(priceForNextLevel)} 🫵
                                  </UpgradePriceChip>
                                </UpgradeCardMeta>
                              </UpgradeCardButton>
                            );
                          })}
                        </UpgradeCardGrid>
                      ) : (
                        <EmptyUpgradeState
                          key="tap-upgrades-empty"
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                        >
                          {!hasAnyPurchasableUpgrades
                            ? locale === "de"
                              ? "Alle Upgrades sind aktuell ausgereizt."
                              : "All upgrades are currently maxed out."
                            : locale === "de"
                              ? "Du kannst dir noch kein Upgrade leisten."
                              : "You can't afford an upgrade yet."}
                        </EmptyUpgradeState>
                      )}
                    </AnimatePresence>
                  </UpgradeContentArea>
                </UpgradePanel>

                {hasVisiblePagination && (
                  <UpgradeStepperWrap
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <UpgradeStepper>
                      {Array(pageCount)
                        .fill(null)
                        .map((_, index) => (
                          <UpgradeStepperDot
                            key={`tap-upgrades-pagination-dot-${index}`}
                            type="button"
                            onClick={() => {
                              goTo(index);
                            }}
                            $active={page === index}
                            aria-label={`Go to upgrades page ${index + 1}`}
                            data-ui-sound-id="ui-tap"
                          >
                            <motion.span
                              animate={{
                                width: page === index ? "16px" : "6px",
                                opacity: page === index ? 1 : 0.35,
                              }}
                              transition={{ duration: 0.12, ease: "easeOut" }}
                            />
                          </UpgradeStepperDot>
                        ))}
                    </UpgradeStepper>
                  </UpgradeStepperWrap>
                )}
              </UpgradeOpenState>
            )}
          </AnimatePresence>

          <UpgradeControlsDock>
            <UpgradeNavRow>
              {showUpgrades && hasVisiblePagination && (
                <UpgradeNavButton
                  type="button"
                  onClick={handlePrevPage}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Previous upgrades page"
                  data-ui-sound-id="ui-tap"
                  initial={{ opacity: 0, x: -18, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <ChevronLeftIcon />
                </UpgradeNavButton>
              )}

              <TriggerShell>
                <Magnetic>
                  <TriggerContainer
                    key="tap-upgrades-container"
                    $open={showUpgrades}
                    onClick={onTriggerClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    // layout
                    style={{ borderRadius: "50px" }}
                    ref={triggerRef}
                    data-ui-sound-id={showUpgrades ? "ui-tap-close" : "ui-tap"}
                  >
                    <TriggerLabelWrap>
                      <AnimatePresence initial={false} mode="popLayout">
                        {showUpgrades ? (
                          <TriggerMotionLabel
                            key="hide-upgrades-icon"
                            initial={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                            exit={{ filter: "blur(6px)", opacity: 0, y: -20 }}
                            transition={{ type: "spring", bounce: 0.2 }}
                          >
                            <CloseIcon />
                          </TriggerMotionLabel>
                        ) : (
                          <TriggerMotionLabel
                            key="show-upgrades-icon"
                            initial={{
                              filter: "blur(6px)",
                              opacity: 0,
                              y: -20,
                            }}
                            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                            exit={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                            transition={{ type: "spring", bounce: 0.2 }}
                          >
                            Upgrades
                          </TriggerMotionLabel>
                        )}
                      </AnimatePresence>
                    </TriggerLabelWrap>
                  </TriggerContainer>
                </Magnetic>

                {!showUpgrades && hasAffordableUpgrades && (
                  <UpgradeIndicator
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  />
                )}
              </TriggerShell>

              {showUpgrades && hasVisiblePagination && (
                <UpgradeNavButton
                  type="button"
                  onClick={handleNextPage}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Next upgrades page"
                  data-ui-sound-id="ui-tap"
                  initial={{ opacity: 0, x: 18, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
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

const UpgradePanel = styled.div`
  width: min(48rem, calc(100vw - 0.5rem));
`;

const UpgradeContentArea = styled(motion.div)`
  width: 100%;
  min-height: 6.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyUpgradeState = styled(motion.div)`
  width: fit-content;
  max-width: min(18.5rem, calc(100vw - 2rem));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 0.62rem 0.9rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.92);
  color: rgba(33, 33, 33, 0.62);
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
`;

const UpgradeCardGrid = styled(motion.div)<{ $count: number }>`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(${({ $count }) => Math.min($count, 3)}, minmax(0, 1fr));
  gap: 0.6rem;
  justify-content: center;
  margin: 0 auto;
  max-width: ${({ $count }) =>
    $count <= 1 ? "18.8rem" : $count === 2 ? "38.2rem" : "100%"};

  @media (width <= 860px) {
    grid-template-columns: repeat(${({ $count }) => Math.min($count, 2)}, minmax(0, 1fr));
    max-width: ${({ $count }) => ($count <= 1 ? "18.8rem" : "100%")};
  }

  @media (width <= 580px) {
    grid-template-columns: minmax(0, 1fr);
    max-width: 100%;
  }
`;

const UpgradeCardButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.58rem;
  width: 100%;
  min-height: 6.05rem;
  padding: 0.74rem 0.84rem;

  border-radius: 1.02rem;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 7px 24px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);

  color: #212121;
  cursor: pointer;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const UpgradeCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
`;

const UpgradeTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.12rem;
  min-width: 0;
`;

const UpgradeName = styled.span`
  font-size: 1.06rem;
  font-weight: 800;
  line-height: 1.12;
  color: #212121;
  text-align: left;
`;

const UpgradePerLevel = styled.span`
  display: block;
  width: 100%;
  font-size: 0.76rem;
  line-height: 1.2;
  font-weight: 700;
  color: rgba(33, 33, 33, 0.6);
  text-align: left;
`;

const UpgradePowerChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.25rem;
  min-height: 1.8rem;
  padding: 0.3rem 0.68rem;
  border-radius: 999px;
  background: #4178f7;
  color: #ffffff;
  font-size: 0.84rem;
  line-height: 1;
  font-weight: 900;
  flex-shrink: 0;
`;

const UpgradeCardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
`;

const UpgradeLevelValue = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  flex: 1;
  min-height: 1.74rem;
  padding: 0.27rem 0.72rem;
  border-radius: 999px;
  background: rgba(33, 33, 33, 0.08);
  color: #212121;
  font-size: 0.8rem;
  line-height: 1;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UpgradePriceChip = styled.span<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.74rem;
  padding: 0.27rem 0.72rem;
  border-radius: 999px;
  background: ${({ $disabled }) =>
    $disabled ? "rgba(33, 33, 33, 0.12)" : "#1d1f24"};
  color: ${({ $disabled }) => ($disabled ? "rgba(33, 33, 33, 0.5)" : "#fff")};
  font-size: 0.81rem;
  line-height: 1;
  font-weight: 900;
  white-space: nowrap;
  flex-shrink: 0;
`;

const TriggerShell = styled.div`
  position: relative;
  display: inline-flex;
  justify-content: center;
`;

const UpgradeControlsDock = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const UpgradeNavRow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.75rem;
`;

const UpgradeNavButton = styled(PaginationButton)``;

const TriggerContainer = styled(motion.button)<{ $open: boolean }>`
  display: inline-flex;
  width: ${({ $open }) => ($open ? "2.8rem" : "6.35rem")};
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  height: 2.25rem;

  padding: 0.5rem 0.4rem;
  border-radius: 50px;
  background-color: #fff;
  opacity: 1;
  transition: width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  margin: 0 auto;
  overflow: clip;

  span {
    max-height: 1.5rem;
  }
`;

const TriggerLabelWrap = styled.span`
  position: relative;
  display: inline-flex;
  width: 100%;
  min-height: 1.5rem;
  align-items: center;
  justify-content: center;
`;

const TriggerMotionLabel = styled(motion.span)`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-height: 1.5rem;
  width: 100%;
  line-height: 1;
  text-align: center;

  svg {
    display: block;
  }
`;

const UpgradeStepperWrap = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const UpgradeStepper = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  padding: 0.18rem 0.3rem;
  background: rgba(33, 33, 3, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 999px;
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
      $active ? "#ffffff" : "rgba(255, 255, 255, 0.6)"};
  }
`;
