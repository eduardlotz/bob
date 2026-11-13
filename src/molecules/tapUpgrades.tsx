import { useShallow } from "zustand/react/shallow";
import { useClickOutside } from "@/hooks/useClickOutside";
import { CloseIcon } from "@/icons/close";
import { AnimatedSegmentedControl } from "@/components/AnimatedSegmentedControl";
import { UpgradeLevelProgress } from "@/components/UpgradeLevelProgress";
import { floatingActionButtonStyles, FLOATING_CONTROL_SPRING } from "@/components/FloatingActionButton";
import {
  getRevealedUpgradeGroup,
  getRevealedUpgrades,
  UPGRADE_GROUPS,
  type UpgradeGroup,
} from "@/shop-items/upgradeGroups";
import { Magnetic } from "@/layout/Magnetic";
import { useCoreStore, type Upgrade } from "@/store";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useIsPresent,
  usePresenceData,
  useReducedMotion,
} from "motion/react";
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import styled from "styled-components";
import { formatNumber } from "@/utils/formatNumber";
import { useKeyPress } from "@/hooks/useKeyPress";
import { playUISound } from "@/utils/soundSystem";
import { useI18n } from "@/i18n";
import { getUpgradeCopy } from "@/shop-items/upgrades.messages";
import { calculateUpgradeCost } from "@/shop-items/upgradeMath";
import {
  PANEL_LAYOUT_SPRING,
  PANEL_SPRING,
  PANEL_ITEM_STAGGER,
  usePanelMotion,
} from "@/styles/panelMotion";

const UPGRADE_SPRING = { ...PANEL_SPRING, layout: PANEL_LAYOUT_SPRING };
const UPGRADE_BOUNCE_SPRING = { ...FLOATING_CONTROL_SPRING, damping: 20 };
const UPGRADE_CARD_HEIGHT = "7.6rem";
const UPGRADE_CARD_GAP = "0.6rem";
const UPGRADE_CARD_SLIDE = 24;

type UpgradeSelection = { group: UpgradeGroup; direction: -1 | 0 | 1 };

function getUpgradeItemMotion(index: number, reducedMotion: boolean | null) {
  const spring = reducedMotion ? { duration: 0 } : UPGRADE_BOUNCE_SPRING;
  const delay = reducedMotion ? 0 : index * PANEL_ITEM_STAGGER;
  const fade = { duration: reducedMotion ? 0 : 0.12 };
  const hidden = { opacity: 0, scale: reducedMotion ? 1 : 0 };

  return {
    initial: hidden,
    animate: {
      opacity: 1,
      scale: 1,
      transition: { ...spring, delay, opacity: { ...fade, delay } },
    },
    // Exit immediately so closing and interrupted level changes stay responsive.
    exit: {
      ...hidden,
      transition: { ...spring, delay: 0, opacity: { ...fade, delay: 0 } },
    },
    transition: {
      ...spring,
      opacity: fade,
      layout: reducedMotion ? { duration: 0 } : PANEL_LAYOUT_SPRING,
    },
    style: { originX: 0.5, originY: 0.5 },
  };
}

function UpgradeCardsPresence({
  direction,
  children,
}: {
  direction: number;
  children: ReactNode;
}) {
  const isPanelPresent = useIsPresent();
  return (
    <AnimatePresence
      mode="popLayout"
      custom={isPanelPresent ? direction : 0}
    >
      {children}
    </AnimatePresence>
  );
}

const UpgradeCardPresence = forwardRef<
  HTMLLIElement,
  {
    direction: number;
    reducedMotion: boolean | null;
    index: number;
    children: ReactNode;
  }
>(function UpgradeCardPresence(
  { direction, reducedMotion, index, children },
  ref,
) {
  const isPresent = useIsPresent();
  const presenceDirection = usePresenceData() as number;
  const exitDirection = useRef<number>();
  // Keep an exit's direction when another level change interrupts it.
  if (isPresent) exitDirection.current = undefined;
  else exitDirection.current ??= presenceDirection;
  const itemMotion = getUpgradeItemMotion(index, reducedMotion);

  return (
    <UpgradeListItem
      ref={ref}
      aria-hidden={!isPresent}
      layout="position"
      {...itemMotion}
      initial={{
        ...itemMotion.initial,
        x: reducedMotion ? 0 : direction * UPGRADE_CARD_SLIDE,
      }}
      animate={{ ...itemMotion.animate, x: 0 }}
      exit={{
        ...itemMotion.exit,
        x: reducedMotion
          ? 0
          : -(exitDirection.current ?? 0) * UPGRADE_CARD_SLIDE,
      }}
    >
      {children}
    </UpgradeListItem>
  );
});

const getSafeUpgradeCost = (upgrade: Upgrade) => {
  const cost = calculateUpgradeCost(upgrade);
  return Number.isFinite(cost) ? cost : Number.POSITIVE_INFINITY;
};

const getUpgradePerLevelLabel = (upgrade: Upgrade) => {
  if (upgrade.effect.type === "autoTap") {
    return `+${formatNumber(upgrade.effect.value)}/s`;
  }

  const percentGain = Number(((upgrade.effect.value - 1) * 100).toFixed(1));
  const roundedPercent =
    percentGain % 1 === 0 ? percentGain.toFixed(0) : percentGain.toFixed(1);

  return `+${roundedPercent}%`;
};

export const TapUpgrades = ({ show }: { show: boolean }) => {
  const {
    upgrades,
    purchaseUpgrade,
    affordableUpgradeIds,
    highestGroup,
    showLevelControls,
    revealUpgradeGroup,
    revealUpgradeLevelControls,
  } = useCoreStore(useShallow(state => {
    const firstLevelTwoUpgrade = state.upgrades.find(
      upgrade => upgrade.id === UPGRADE_GROUPS[1].ids[0],
    );
    return {
      upgrades: state.upgrades,
      purchaseUpgrade: state.purchaseUpgrade,
      revealUpgradeGroup: state.revealUpgradeGroup,
      revealUpgradeLevelControls: state.revealUpgradeLevelControls,
      highestGroup: getRevealedUpgradeGroup(state.upgrades, state.taps, state.revealedUpgradeGroup),
      showLevelControls: state.upgradeLevelControlsRevealed || state.revealedUpgradeGroup > 2 ||
        (!!firstLevelTwoUpgrade && (firstLevelTwoUpgrade.level > 0 || state.taps >= getSafeUpgradeCost(firstLevelTwoUpgrade))),
      // Subscribe to affordability thresholds, not every auto-tap payout.
      affordableUpgradeIds: state.upgrades
        .filter(upgrade => state.taps >= getSafeUpgradeCost(upgrade))
        .map(upgrade => upgrade.id).join(","),
    };
  }));
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion();
  const panelMotion = usePanelMotion();
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(width < 768px)").matches,
  );
  const affordableUpgrades = useMemo(
    () => new Set(affordableUpgradeIds.split(",")),
    [affordableUpgradeIds],
  );
  const revealedUpgrades = useMemo(
    () => getRevealedUpgrades(upgrades, highestGroup),
    [upgrades, highestGroup],
  );
  const [{ group, direction }, setSelection] = useState<UpgradeSelection>({
    group: "1",
    direction: 0,
  });
  const activeGroup = UPGRADE_GROUPS.find((item) => item.value === group)!;
  const groupUpgrades = revealedUpgrades.filter((upgrade) =>
    (activeGroup.ids as readonly string[]).includes(upgrade.id),
  );
  const orderedGroupUpgrades = isMobile
    ? [...groupUpgrades].reverse()
    : groupUpgrades;
  const previousGroup = UPGRADE_GROUPS[Number(group) - 2];
  const prerequisiteId = previousGroup?.ids[previousGroup.ids.length - 1];
  const prerequisite = prerequisiteId
    ? getUpgradeCopy(prerequisiteId, locale).name
    : "";
  const groupOptions = UPGRADE_GROUPS.slice(0, highestGroup).map(
    ({ value }) => ({ value, label: `Level ${value}` }),
  );
  const hasAffordableUpgrades = useMemo(
    () =>
      revealedUpgrades.some(
        (upgrade) =>
          upgrade.level < upgrade.maxLevel &&
          affordableUpgrades.has(upgrade.id),
      ),
    [revealedUpgrades, affordableUpgrades],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const triggerTransition = reducedMotion
    ? { duration: 0, layout: { duration: 0 } }
    : UPGRADE_SPRING;
  const triggerInteractionTransition = reducedMotion
    ? { duration: 0 }
    : FLOATING_CONTROL_SPRING;
  const labelBounceTransition = reducedMotion
    ? { duration: 0 }
    : UPGRADE_BOUNCE_SPRING;

  const selectGroup = (nextGroup: UpgradeGroup) => {
    setSelection((previous) =>
      previous.group === nextGroup
        ? previous
        : {
            group: nextGroup,
            direction: Number(nextGroup) > Number(previous.group) ? -1 : 1,
          },
    );
  };

  const resetSlideDirection = () => {
    setSelection((previous) =>
      previous.direction === 0 ? previous : { ...previous, direction: 0 },
    );
  };

  useEffect(() => {
    if (!show) setShowUpgrades(false);
  }, [show]);

  useEffect(() => {
    const media = window.matchMedia("(width < 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    revealUpgradeGroup(highestGroup);
  }, [highestGroup, revealUpgradeGroup]);

  useEffect(() => {
    if (showLevelControls) revealUpgradeLevelControls();
  }, [showLevelControls, revealUpgradeLevelControls]);

  const closeUpgrades = () => {
    if (!showUpgrades) return;
    resetSlideDirection();
    setShowUpgrades(false);
    playUISound("ui-tap-close");
  };
  useClickOutside([containerRef, triggerRef], closeUpgrades);
  useKeyPress("Escape", closeUpgrades);

  return (
    <AnimatePresence>
      {show && (
        <UpgradeRoot key="upgrades" ref={containerRef}>
          {/* An empty boundary must not hold the trigger's outer exit open. */}
          <AnimatePresence initial={false} propagate={showUpgrades}>
            {showUpgrades && (
              <UpgradePanel
                key="upgrade-list"
                {...panelMotion}
              >
                <LayoutGroup>
                  <GroupContent
                    layout="position"
                    layoutScroll
                    transition={triggerTransition}
                  >
                    {groupUpgrades.length > 0 ? (
                      <UpgradeList
                        layout="position"
                        id="tap-upgrades-list"
                        aria-label={`Upgrades, Level ${group}`}
                        $count={groupUpgrades.length}
                        transition={triggerTransition}
                      >
                        <UpgradeCardsPresence direction={direction}>
                          {orderedGroupUpgrades.map((upgrade, index) => {
                            const copy = getUpgradeCopy(upgrade.id, locale);
                            const cost = getSafeUpgradeCost(upgrade);
                            const isMaxed = upgrade.level >= upgrade.maxLevel;
                            const canBuy = !isMaxed && affordableUpgrades.has(upgrade.id);
                            const maxLabel = "Maximum";
                            const unaffordableLabel =
                              locale === "de"
                                ? "Nicht genug Taps"
                                : "Not enough taps";
                            const price = `${formatNumber(cost)} ✊`;
                            const statusLabel = isMaxed
                              ? maxLabel
                              : `${price}${canBuy ? "" : `, ${unaffordableLabel}`}`;
                            return (
                              <UpgradeCardPresence
                                key={upgrade.id}
                                direction={direction}
                                reducedMotion={reducedMotion}
                                index={index}
                              >
                                <UpgradeCardButton
                                  type="button"
                                  disabled={!canBuy}
                                  onClick={() => purchaseUpgrade(upgrade.id)}
                                  whileTap={
                                    canBuy && !reducedMotion
                                      ? { scale: 0.98 }
                                      : undefined
                                  }
                                  aria-label={`${copy.name}, Level ${upgrade.level} / ${upgrade.maxLevel}, ${statusLabel}`}
                                  data-upgrade-id={upgrade.id}
                                  data-ui-sound-id="ui-tap"
                                >
                                  <UpgradeLabel>
                                    <UpgradeName
                                      initial={false}
                                      animate={{ color: "#ffffff" }}
                                      transition={triggerTransition}
                                    >
                                      {copy.name}
                                    </UpgradeName>
                                    <UpgradePerLevel
                                      initial={false}
                                      animate={{ color: "#949494" }}
                                      transition={triggerTransition}
                                    >
                                      {getUpgradePerLevelLabel(upgrade)}
                                    </UpgradePerLevel>
                                  </UpgradeLabel>
                                  <UpgradeLevelProgress
                                    level={upgrade.level}
                                    maxLevel={upgrade.maxLevel}
                                    price={price}
                                    enabled={canBuy}
                                    label={`${copy.name}, Level`}
                                    maxLabel={maxLabel}
                                  />
                                </UpgradeCardButton>
                              </UpgradeCardPresence>
                            );
                          })}
                        </UpgradeCardsPresence>
                      </UpgradeList>
                    ) : (
                      <EmptyUpgradeState
                        id="tap-upgrades-list"
                      >
                        {prerequisite
                          ? locale === "de"
                            ? `Kaufe zuerst ein Level von ${prerequisite}, um Level ${group} freizuschalten.`
                            : `Buy a level of ${prerequisite} to reveal Level ${group}.`
                          : locale === "de"
                            ? "Keine Upgrades verfügbar."
                            : "No upgrades available."}
                      </EmptyUpgradeState>
                    )}
                  </GroupContent>
                  <AnimatePresence>
                    {showLevelControls && (
                      <GroupControl
                        key="upgrade-level-controls"
                        layout
                        {...getUpgradeItemMotion(orderedGroupUpgrades.length, reducedMotion)}
                        aria-label={
                          locale === "de" ? "Upgrade-Level" : "Upgrade levels"
                        }
                      >
                        <AnimatedSegmentedControl
                          options={groupOptions}
                          value={group}
                          onChange={selectGroup}
                          theme="light"
                          size="sm"
                          fullWidth={false}
                        />
                      </GroupControl>
                    )}
                  </AnimatePresence>
                </LayoutGroup>
              </UpgradePanel>
            )}
          </AnimatePresence>

          <TriggerShell
            {...panelMotion}
          >
            <Magnetic>
              <TriggerContainer
                $variant="muted"
                ref={triggerRef}
                type="button"
                onClick={() => {
                  resetSlideDirection();
                  setShowUpgrades((open) => !open);
                }}
                aria-expanded={showUpgrades}
                aria-controls={showUpgrades ? "tap-upgrades-list" : undefined}
                aria-label={
                  showUpgrades
                    ? locale === "de"
                      ? "Upgrades schließen"
                      : "Close upgrades"
                    : "Upgrades"
                }
                style={{
                  borderRadius: 50,
                }}
                transition={{ ...triggerTransition, scale: triggerInteractionTransition }}
                whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                whileTap={reducedMotion ? undefined : { scale: 0.88 }}
                data-ui-sound-id={showUpgrades ? "ui-tap-close" : "ui-tap"}
              >
                <TriggerSizeSpacer
                  aria-hidden="true"
                  initial={false}
                  animate={{ width: showUpgrades ? "1.5rem" : "4.8rem" }}
                  transition={reducedMotion ? { duration: 0 } : PANEL_LAYOUT_SPRING}
                />
                <TriggerLabelWrap
                  aria-hidden="true"
                >
                  <AnimatePresence initial={false}>
                    <TriggerMotionLabel
                      key={showUpgrades ? "close" : "label"}
                      style={{ originX: 0.5, originY: 0.5 }}
                      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0 }}
                      transition={{
                        scale: labelBounceTransition,
                        opacity: { duration: reducedMotion ? 0 : 0.12 },
                      }}
                    >
                      {showUpgrades ? <CloseIcon /> : "Upgrades"}
                    </TriggerMotionLabel>
                  </AnimatePresence>
                </TriggerLabelWrap>
              </TriggerContainer>
            </Magnetic>
            <AnimatePresence initial={false}>
              {!showUpgrades && hasAffordableUpgrades && (
                <UpgradeIndicator
                  key="affordable-upgrades"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={triggerTransition}
                />
              )}
            </AnimatePresence>
          </TriggerShell>
        </UpgradeRoot>
      )}
    </AnimatePresence>
  );
};

const UpgradeRoot = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof UpgradeRootElement>
>(function UpgradeRoot(props, ref) {
  const isPresent = useIsPresent();
  return <UpgradeRootElement {...props} ref={ref} aria-hidden={!isPresent} />;
});

const UpgradeRootElement = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3rem;
  gap: 0.75rem;
  flex-shrink: 0;

  &[aria-hidden="true"],
  &[aria-hidden="true"] * {
    pointer-events: none !important;
  }
`;

// The panel leaves the trigger in a fixed slot in the bottom navigation.
const UpgradePanel = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof UpgradePanelElement>
>(function UpgradePanel(props, ref) {
  const isPresent = useIsPresent();
  return <UpgradePanelElement {...props} ref={ref} aria-hidden={!isPresent} inert={!isPresent} />;
});

const UpgradePanelElement = styled(motion.div)`
  position: absolute;
  bottom: calc(100% + 0.75rem);
  width: min(48rem, calc(100vw - 2rem));
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;

  &[aria-hidden="true"],
  &[aria-hidden="true"] * {
    pointer-events: none !important;
  }

  @media (width < 768px) {
    width: min(22rem, calc(100vw - 2rem));
  }
`;

const GroupControl = styled(motion.div)`
  width: fit-content;
  max-width: 100%;
  align-self: center;
  border-radius: 999px;
  background: #fff;
`;

const GroupContent = styled(motion.div)`
  width: 100%;
  overflow: visible;
  overscroll-behavior: contain;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (768px <= width < 800px) {
    overflow-x: auto;
  }

  @media (width < 768px) {
    max-height: calc(100dvh - 10rem);
    overflow-y: auto;
  }
`;

const UpgradeList = styled(motion.ul)<{ $count: number }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: ${UPGRADE_CARD_GAP};
  column-gap: 0.3rem;
  /* popLayout removes exiting cards from flow; keep their containing row stable. */
  min-height: calc(${UPGRADE_CARD_HEIGHT} + 1rem);
  width: min(100%, ${({ $count }) => $count * 11}rem);
  padding: 0.5rem;
  margin: 0 auto;
  list-style: none;

  @media (width < 768px) {
    width: min(100%, 18.7rem);
    grid-template-columns: minmax(0, 1fr);
    min-height: calc(
      ${({ $count }) => $count} * ${UPGRADE_CARD_HEIGHT} +
        ${({ $count }) => $count - 1} * ${UPGRADE_CARD_GAP} + 1rem
    );
  }
`;

const UpgradeListItem = styled(motion.li)`
  min-width: 0;

  &[aria-hidden="true"],
  &[aria-hidden="true"] * {
    pointer-events: none !important;
  }
`;

const UpgradeCardButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  height: ${UPGRADE_CARD_HEIGHT};
  padding: 0 0.75rem 0.4rem;
  border: none;
  border-radius: 1.5rem;
  background: transparent;
  color: #fff;
  text-align: center;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 4px;
  }
`;

const UpgradeLabel = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: max-content;
  max-width: calc(100% + 1.5rem);
  padding: 0.3rem 0.55rem;
  border-radius: 0.65rem;
  background: #212121;
  line-height: 1.2;
`;

const UpgradeName = styled(motion.span)`
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.2;
`;

const UpgradePerLevel = styled(motion.span)`
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 900;
  white-space: nowrap;
`;

const EmptyUpgradeState = styled(motion.div)`
  margin: 0.5rem;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: #fff;
  color: rgba(33, 33, 33, 0.6);
  font-size: 0.8rem;
  text-align: center;
`;

const TriggerShell = styled(motion.div)`
  position: relative;
  display: inline-flex;
  justify-content: center;
`;

const TriggerContainer = styled(motion.button)<{ $variant: "muted" }>`
  ${floatingActionButtonStyles}
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 3rem;
  padding: 0.5rem 20px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: clip;
`;

// Animate the button's real width without scaling or repositioning its labels.
const TriggerSizeSpacer = styled(motion.span)`
  display: block;
  height: 1.5rem;
  flex-shrink: 0;
`;

const TriggerLabelWrap = styled.span`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const TriggerMotionLabel = styled(motion.span)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  svg {
    display: block;
  }
`;

const UpgradeIndicator = styled(motion.span)`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: red;
  pointer-events: none;
`;
