import { useClickOutside } from "@/hooks/useClickOutside";
import { usePagination } from "@/hooks/usePagination";
import { CloseIcon } from "@/icons/close";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { HugColumn } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { useCoreStore, type Upgrade } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { formatNumber } from "@/utils/formatNumber";
import { useKeyPress } from "@/hooks/useKeyPress";
import { playUISound } from "@/utils/soundSystem";
import { useI18n } from "@/i18n";
import { getUpgradeCopy } from "@/shop-items/upgrades.messages";
import { calculateUpgradeCost } from "@/shop-items/upgradeMath";

const UPGRADE_PAGE_SIZE = 3;

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

export const TapUpgrades = ({ show }: { show: boolean }) => {
  const { upgrades: tapUpgrades, purchaseUpgrade, canAfford } = useCoreStore();
  const { locale } = useI18n();
  const unlockedUpgrades = tapUpgrades.filter((upgrade) => upgrade.unlocked);
  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(unlockedUpgrades, UPGRADE_PAGE_SIZE);

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

  const canAffordUpgrade = unlockedUpgrades.some(
    (upgrade) =>
      upgrade.level < upgrade.maxLevel &&
      canAfford(calculateUpgradeCost(upgrade)),
  );

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
                  <AnimatePresence mode="popLayout" initial={false}>
                    <UpgradeCardGrid
                      key={`tap-upgrades-page-${page}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                    >
                      {data.map((upgrade) => {
                        const upgradeCopy = getUpgradeCopy(upgrade.id, locale);
                        const isMaxLevel = upgrade.level >= upgrade.maxLevel;
                        const priceForNextLevel = calculateUpgradeCost(upgrade);
                        const canAffordNextUpgrade =
                          canAfford(priceForNextLevel);
                        const canBuy = !isMaxLevel && canAffordNextUpgrade;
                        const levelLabel = `${upgrade.level} / ${upgrade.maxLevel}`;
                        const maxLevelLabel = "Max Level";
                        const upgradeSubtitle = getUpgradePerLevelLabel(
                          upgrade,
                          locale,
                        );

                        return (
                          <UpgradeCardButton
                            key={upgrade.id}
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

                              <UpgradeLevelGroup>
                                <UpgradeLevelLabel>LVL</UpgradeLevelLabel>
                                <UpgradeLevelValue $max={isMaxLevel}>
                                  {isMaxLevel ? "MAX" : levelLabel}
                                </UpgradeLevelValue>
                              </UpgradeLevelGroup>
                            </UpgradeCardHead>

                            <UpgradePriceBar
                              $disabled={!canBuy}
                              $max={isMaxLevel}
                            >
                              {isMaxLevel
                                ? maxLevelLabel
                                : `${formatNumber(priceForNextLevel)} 🫵`}
                            </UpgradePriceBar>
                          </UpgradeCardButton>
                        );
                      })}
                    </UpgradeCardGrid>
                  </AnimatePresence>
                </UpgradePanel>

                {pageCount > 1 && (
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
              {showUpgrades && pageCount > 1 && (
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

const UpgradeCardGrid = styled(motion.div)`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;

  @media (width <= 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 580px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const UpgradeCardButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.32rem;
  width: 100%;
  min-height: 7.5rem;
  padding: 0.72rem 0.25rem 0.25rem;

  border-radius: 1.3rem;
  border: none;
  background: rgba(255, 255, 255, 0.92);

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
  gap: 0.42rem;
  padding: 0 0.43rem;
`;

const UpgradeTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.12rem;
  min-width: 0;
`;

const UpgradeName = styled.span`
  font-size: 1.08rem;
  font-weight: 800;
  line-height: 1.12;
  color: #212121;
  text-align: left;
`;

const UpgradePerLevel = styled.span`
  display: block;
  width: 100%;
  font-size: 0.92rem;
  line-height: 1.2;
  font-weight: 700;
  color: rgba(33, 33, 33, 0.6);
  text-align: left;
`;

const UpgradeLevelGroup = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.18rem;
  min-width: 4.5rem;
`;

const UpgradeLevelLabel = styled.span`
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.74rem;
  line-height: 1;
  font-weight: 900;
  color: #212121;
`;

const UpgradeLevelValue = styled.span<{ $max: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.65rem;
  min-width: 4.3rem;
  padding: 0.25rem 0.55rem;
  border-radius: 0.72rem;

  background: ${({ $max }) => ($max ? "#69e69a" : "rgba(33, 33, 33, 0.08)")};
  color: #212121;

  font-size: 1.02rem;
  line-height: 1;
  font-weight: 900;
`;

const UpgradePriceBar = styled.span<{ $disabled: boolean; $max: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  margin-top: auto;
  min-height: 2.35rem;
  border-radius: 0.625rem 0.625rem 1.25rem 1.25rem;
  width: 100%;
  padding: 0.3rem 0.55rem;

  background: ${({ $max, $disabled }) => {
    if ($max) return "rgba(33, 33, 33, 0.12)";
    if ($disabled) return "rgba(33, 33, 33, 0.18)";
    return "#1d1f24";
  }};

  color: ${({ $max, $disabled }) =>
    $max || $disabled ? "rgba(33, 33, 33, 0.48)" : "#fff"};
  font-size: 1.04rem;
  line-height: 1;
  font-weight: 900;
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

const UpgradeNavButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.55rem;
  height: 2.55rem;
  border-radius: 999px;

  background: #ffffff;
  color: #212121;
  border: 1px solid rgba(33, 33, 33, 0.14);

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

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
  background: rgba(33, 33, 33, 0.15);
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
