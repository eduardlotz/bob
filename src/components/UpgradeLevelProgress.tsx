import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type MotionStyle } from "motion/react";
import styled from "styled-components";
import { priceTagStyles } from "./StatusChips";

interface UpgradeLevelProgressProps {
  level: number;
  maxLevel: number;
  price: string;
  enabled: boolean;
  label: string;
  maxLabel: string;
  unaffordableLabel: string;
}

const PROGRESS_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.55 };
const STEP_GAP = 3;

export function UpgradeLevelProgress({ level, maxLevel, price, enabled, label, maxLabel, unaffordableLabel }: UpgradeLevelProgressProps) {
  const railRef = useRef<HTMLSpanElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);
  const hasMeasured = useRef(false);
  const [sizes, setSizes] = useState({ rail: 0, price: 0 });
  const reducedMotion = useReducedMotion();
  const current = Math.max(0, Math.min(maxLevel, level));
  const isMaxed = current === maxLevel;
  const stepWidth = Math.max(0, (sizes.rail - (maxLevel - 1) * STEP_GAP) / maxLevel);
  const anchor = (current + 0.5) * stepWidth + current * STEP_GAP;
  const fillWidth = current > 0 ? current * stepWidth + (current - 1) * STEP_GAP : 0;
  const bubbleX = isMaxed
    ? (sizes.rail - sizes.price) / 2
    : Math.max(0, Math.min(sizes.rail - sizes.price, anchor - sizes.price / 2));
  const labelOnLeft = bubbleX > (sizes.rail - sizes.price) / 2;
  const transition = reducedMotion || !hasMeasured.current ? { duration: 0 } : PROGRESS_SPRING;
  const presence = {
    initial: { opacity: 0, scale: reducedMotion ? 1 : 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: reducedMotion ? 1 : 0.92 },
    transition,
  };

  useLayoutEffect(() => {
    const rail = railRef.current;
    const bubble = priceRef.current;
    if (!rail || !bubble) return;
    const measure = () => {
      const railWidth = rail.clientWidth;
      const priceWidth = bubble.offsetWidth;
      setSizes((previous) => previous.rail === railWidth && previous.price === priceWidth
        ? previous : { rail: railWidth, price: priceWidth });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    observer.observe(bubble);
    measure();
    return () => observer.disconnect();
  }, []);

  // Mount at the saved level; only subsequent upgrades move the fill and tag.
  useEffect(() => {
    if (sizes.rail > 0) hasMeasured.current = true;
  }, [sizes.rail]);

  return (
    <Progress role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={maxLevel} aria-valuenow={current}>
      <PriceArea aria-hidden="true">
        <PriceBubble
          ref={priceRef}
          layout={!reducedMotion}
          initial={false}
          style={{ left: bubbleX, borderRadius: 999, "--warning-opacity": 0 } as MotionStyle}
          animate={{
            color: isMaxed ? "#ffffff" : enabled ? "#212121" : "#949494",
            "--warning-opacity": !enabled && !isMaxed ? 1 : 0,
          }}
          transition={transition}
        >
          <PriceSurface
            initial={false}
            animate={{ backgroundColor: isMaxed ? "#949494" : enabled ? "#f5ff42" : "#faff9c" }}
            transition={transition}
          />
          <AnimatePresence initial={false} mode="popLayout">
            <PriceText key={isMaxed ? "max" : price} layout="position" {...presence}>
              {isMaxed ? maxLabel : price}
            </PriceText>
          </AnimatePresence>
        </PriceBubble>
        <AnimatePresence initial={false} mode="popLayout">
          {!enabled && !isMaxed && (
            <UnaffordableLabel
              key="unaffordable"
              layout="position"
              style={{ justifyContent: labelOnLeft ? "flex-start" : "flex-end" }}
              {...presence}
            ><motion.span layout="position" transition={transition}>{unaffordableLabel}</motion.span></UnaffordableLabel>
          )}
        </AnimatePresence>
      </PriceArea>
      <Rail ref={railRef} aria-hidden="true">
        {Array.from({ length: maxLevel }, (_, index) => (
          <Step key={index} initial={false} animate={{ opacity: index < current ? 0 : enabled ? 1 : 0.55 }} transition={transition} />
        ))}
        <Fill
          initial={false}
          animate={{ width: fillWidth, backgroundColor: isMaxed || !enabled ? "#949494" : "#212121" }}
          transition={transition}
        />
      </Rail>
    </Progress>
  );
}

const Progress = styled.span`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: auto;
`;

const PriceArea = styled.span`
  position: relative;
  display: block;
  height: 2.1rem;
  margin-bottom: 0.5rem;
`;

const PriceBubble = styled(motion.span)`
  ${priceTagStyles}
  position: absolute;
  top: 0;
  isolation: isolate;
  z-index: 2;

  &::after {
    content: "";
    position: absolute;
    inset: -0.125rem -0.8rem;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent, #fff 14%, #fff 86%, transparent);
    opacity: var(--warning-opacity, 0);
    pointer-events: none;
    z-index: 0;
  }
`;

const PriceSurface = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
`;

const PriceText = styled(motion.span)`
  position: relative;
  display: block;
  z-index: 2;
`;

const UnaffordableLabel = styled(motion.span)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  height: 100%;
  color: #bcbcbc;
  font-size: 0.63rem;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
`;

const Rail = styled.span`
  position: relative;
  display: flex;
  gap: ${STEP_GAP}px;
  width: 100%;
  height: 0.6rem;
`;

const Step = styled(motion.span)`
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: #c9c9c9;
`;

const Fill = styled(motion.span)`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 999px;
`;
