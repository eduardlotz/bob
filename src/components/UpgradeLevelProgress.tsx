import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import styled from "styled-components";
import { FLOATING_CONTROL_SPRING } from "./FloatingActionButton";

interface UpgradeLevelProgressProps {
  level: number;
  maxLevel: number;
  price: string;
  enabled: boolean;
  label: string;
  maxLabel: string;
}

const PROGRESS_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.55 };

export function UpgradeLevelProgress({ level, maxLevel, price, enabled, label, maxLabel }: UpgradeLevelProgressProps) {
  const reducedMotion = useReducedMotion();
  const batteryScaleX = useSpring(1, FLOATING_CONTROL_SPRING);
  const batteryScaleY = useSpring(1, FLOATING_CONTROL_SPRING);
  const current = Math.max(0, Math.min(maxLevel, level));
  const previousLevel = useRef(current);
  const isMaxed = current === maxLevel;
  const progress = maxLevel > 0 ? current / maxLevel : 0;
  const accent = isMaxed ? "#3bce49" : "#ffffff";
  const transition = reducedMotion ? { duration: 0 } : PROGRESS_SPRING;
  const bounceTransition = reducedMotion ? { duration: 0 } : FLOATING_CONTROL_SPRING;
  const presence = {
    initial: { opacity: 0, scale: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -8 },
    transition: { ...bounceTransition, opacity: { duration: reducedMotion ? 0 : 0.12 } },
  };

  useEffect(() => {
    if (reducedMotion) {
      batteryScaleX.jump(1);
      batteryScaleY.jump(1);
    } else if (current > previousLevel.current) {
      // Restart the squash on each purchase, including rapid repeated upgrades.
      batteryScaleX.jump(1.25);
      batteryScaleY.jump(0.75);
      batteryScaleX.set(1);
      batteryScaleY.set(1);
    }
    previousLevel.current = current;
  }, [current, reducedMotion, batteryScaleX, batteryScaleY]);

  return (
    <Progress
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={maxLevel}
      aria-valuenow={current}
    >
      <PriceBubble
        initial={false}
        animate={{ color: isMaxed ? accent : enabled ? "#ffffff" : "#949494" }}
        transition={transition}
        aria-hidden="true"
      >
        <PriceRim
          initial={false}
          animate={{ borderColor: isMaxed || enabled ? accent : "#212026" }}
          transition={transition}
        />
        <AnimatePresence initial={false}>
          <PriceText
            key={`${current}-${isMaxed ? "max" : price}`}
            style={{ originX: 0.5, originY: 0.5 }}
            {...presence}
          >
            {isMaxed ? maxLabel : price}
          </PriceText>
        </AnimatePresence>
      </PriceBubble>
      <Battery aria-hidden="true" style={{ scaleX: batteryScaleX, scaleY: batteryScaleY }}>
        <BatteryRim
          initial={false}
          animate={{ borderColor: accent }}
          transition={transition}
        >
          <BatteryCharge>
            <Fill
              initial={false}
              animate={{ height: `${progress * 100}%`, backgroundColor: accent }}
              transition={transition}
            />
          </BatteryCharge>
        </BatteryRim>
      </Battery>
    </Progress>
  );
}

const Progress = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: min(100%, 9rem);
  height: 3.65rem;
  border: 3px solid #0b0b0c;
  border-radius: 999px;
  background: #212026;
  box-shadow: 0 5px 0 #0b0b0c;
`;

const PriceBubble = styled(motion.span)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;
`;

const PriceRim = styled(motion.span)`
  position: absolute;
  inset: 0;
  border: 2px solid;
  border-radius: inherit;
  pointer-events: none;
`;

const PriceText = styled(motion.span)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 900;
  white-space: nowrap;
`;

const Battery = styled(motion.span)`
  position: absolute;
  top: 50%;
  right: -0.75rem;
  display: flex;
  width: 1.65rem;
  height: 2.15rem;
  padding: 2px;
  border: 2px solid #212026;
  border-radius: 999px;
  background: #212026;
  translate: 0 -50%;
`;

const BatteryRim = styled(motion.span)`
  display: flex;
  width: 100%;
  height: 100%;
  padding: 3px;
  border: 2px solid;
  border-radius: inherit;
`;

const BatteryCharge = styled.span`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 999px;
`;

const Fill = styled(motion.span)`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  min-height: 3px;
  border-radius: 999px;
`;
