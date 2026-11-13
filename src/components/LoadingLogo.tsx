import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import styled from "styled-components";

// Keep the reference recoil for loading, without deforming the logo.
const RECOIL_SPRING = {
  type: "spring", stiffness: 70, damping: 6, mass: 1,
  restDelta: .002, restSpeed: .015,
} as const;
const FINISH_SPRING = {
  type: "spring", stiffness: 230, damping: 16, mass: .8,
  restDelta: .002, restSpeed: .015,
} as const;
// The scale spring first returns to 1 here; sync Start and confetti to that beat.
export const LOADING_LOGO_LANDING_TIME = Math.PI / Math.sqrt(
  FINISH_SPRING.stiffness / FINISH_SPRING.mass -
  (FINISH_SPRING.damping / (2 * FINISH_SPRING.mass)) ** 2,
);
const COLORS = ["#ff7da5", "#ffd65a", "#71dbb5", "#75a7ff", "#c49aff"];

function smoothstep(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

const BURST_TIMES = Array.from({ length: 25 }, (_, index) => index / 24);

function createConfetti() {
  return Array.from({ length: 12 }, (_, index) => {
    // A narrow upward cone, followed by a gravity-driven arc.
    const angle = -Math.PI / 2 + (Math.random() - .5) * Math.PI / 3;
    const speed = 200 + Math.random() * 50;
    return {
      originX: (Math.random() - .5) * 10,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      lifetime: .95 + Math.random() * .2,
      width: index % 3 ? 5 : 6,
      height: index % 3 ? 10 + index % 2 * 2 : 6,
      rotation: (Math.random() - .5) * 90,
      spin: (index % 2 ? 1 : -1) * (360 + Math.random() * 360),
      color: COLORS[index % COLORS.length],
    };
  });
}

export function LoadingLogo({ progress, finished, label, interactionLabel }: {
  progress?: number;
  finished: boolean;
  label: string;
  interactionLabel: string;
}) {
  const reducedMotion = useReducedMotion();
  const pitch = useMotionValue(0);
  const yaw = useMotionValue(0);
  const roll = useMotionValue(0);
  const finishScale = useMotionValue(1);
  const interactionScale = useMotionValue(1);
  const hovered = useRef(false);
  const pressed = useRef(false);
  const completionBurstEmitted = useRef(false);
  const [burst, setBurst] = useState<{ id: number; pieces: ReturnType<typeof createConfetti> } | null>(null);

  const emitBurst = useCallback(() => {
    if (reducedMotion) return;
    // Replace the previous burst so rapid clicks never accumulate particles.
    setBurst((previous) => ({ id: (previous?.id ?? 0) + 1, pieces: createConfetti() }));
  }, [reducedMotion]);

  const handleHover = (active: boolean) => {
    hovered.current = active;
    if (reducedMotion || pressed.current) return;
    animate(interactionScale, active ? 1.06 : 1, FINISH_SPRING);
    if (active) {
      animate(pitch, 0, { ...RECOIL_SPRING, velocity: 14 });
      animate(yaw, 0, { ...RECOIL_SPRING, velocity: -12 });
      animate(roll, 0, { ...RECOIL_SPRING, velocity: 9 });
    }
  };

  const handlePressStart = () => {
    pressed.current = true;
    completionBurstEmitted.current = true;
    if (reducedMotion) return;
    animate(interactionScale, .94, FINISH_SPRING);
  };

  const handlePressEnd = () => {
    pressed.current = false;
    if (reducedMotion) return;
    animate(interactionScale, hovered.current ? 1.06 : 1, FINISH_SPRING);
  };

  const handleClick = () => {
    if (reducedMotion) return;
    completionBurstEmitted.current = true;
    emitBurst();
  };

  useMotionValueEvent(finishScale, "change", (value) => {
    if (finished && !completionBurstEmitted.current && value <= 1 && (finishScale.getPrevious() ?? 1) > 1) {
      completionBurstEmitted.current = true;
      emitBurst();
    }
  });

  useEffect(() => {
    setBurst(null);
    completionBurstEmitted.current = false;
    interactionScale.set(1);
    hovered.current = false;
    pressed.current = false;
    if (reducedMotion) {
      finishScale.set(1);
      return;
    }
    if (finished) {
      finishScale.set(1);
      const animation = animate(finishScale, 1, { ...FINISH_SPRING, velocity: 3.2 });
      return () => animation.stop();
    }

    finishScale.set(1);
    let direction = 1;
    function jiggle() {
      animate(pitch, 0, { ...RECOIL_SPRING, velocity: 32 * direction });
      animate(yaw, 0, { ...RECOIL_SPRING, velocity: -24 * direction });
      animate(roll, 0, { ...RECOIL_SPRING, velocity: 9 * direction });
      direction *= -1;
    }
    jiggle();
    const timer = window.setInterval(jiggle, 2400);
    return () => {
      window.clearInterval(timer);
      for (const value of [pitch, yaw, roll]) {
        value.stop();
        value.set(0);
      }
    };
  }, [finishScale, finished, interactionScale, pitch, reducedMotion, roll, yaw]);

  useEffect(() => () => {
    for (const value of [interactionScale, pitch, yaw, roll]) value.stop();
  }, [interactionScale, pitch, yaw, roll]);

  return (
    <LogoArea>
      <LogoLift role="progressbar" aria-label={label}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress === undefined ? undefined : Math.round(progress)} aria-busy={!finished}
        style={{ scale: finishScale }}>
        <LogoLift aria-hidden="true" style={{ scale: interactionScale }}>
          <LogoRecoil style={{ rotateX: pitch, rotateY: yaw, rotate: roll }}>
            <LogoSilhouette />
            <LogoFill initial={false} animate={{ clipPath: `inset(${100 - (progress ?? 100)}% 0 0 0)` }}
              transition={{ duration: reducedMotion ? 0 : .45, ease: "easeOut" }} />
          </LogoRecoil>
        </LogoLift>
      </LogoLift>
      {finished && (
        <LogoInteraction type="button" aria-label={interactionLabel}
          onHoverStart={() => handleHover(true)} onHoverEnd={() => handleHover(false)}
          onTapStart={handlePressStart} onTap={handlePressEnd} onTapCancel={handlePressEnd}
          onClick={handleClick} />
      )}
      {finished && burst && !reducedMotion && (
        <ConfettiField key={burst.id} aria-hidden="true">
          {burst.pieces.map((piece, index) => (
            <Confetti key={index} style={{ width: piece.width, height: piece.height, background: piece.color }}
              initial={{ opacity: 0, x: piece.originX, y: 0, scale: 1, rotate: piece.rotation }}
              animate={{
                x: BURST_TIMES.map((age) => piece.originX + piece.velocityX * age * piece.lifetime),
                y: BURST_TIMES.map((age) => {
                  const time = age * piece.lifetime;
                  return piece.velocityY * time + .5 * 360 * time * time;
                }),
                opacity: BURST_TIMES.map((age) => 1 - smoothstep((age - .55) / .45)),
                scale: BURST_TIMES.map((age) => 1 - age * .15),
                rotate: BURST_TIMES.map((age) => piece.rotation + piece.spin * age),
                rotateX: BURST_TIMES.map((age) => age * 540),
                rotateY: BURST_TIMES.map((age) => age * (index % 2 ? 270 : -270)),
              }}
              transition={{ duration: piece.lifetime, times: BURST_TIMES, ease: "linear" }}
            />
          ))}
        </ConfettiField>
      )}
    </LogoArea>
  );
}

const LogoArea = styled.div`
  position: relative;
  width: 112px;
  height: 120px;
  flex-shrink: 0;
  perspective: 500px;

  @media (max-height: 600px) { width: 96px; height: 103px; }
`;

const LogoLift = styled(motion.div)`
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
`;

const LogoRecoil = styled(LogoLift)``;

const LogoInteraction = styled(motion.button)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 18px;
  background: transparent;
`;

const LogoSilhouette = styled.div`
  position: absolute;
  inset: 0;
  background: #40403f;
  mask: url('/images/bob-loading-logo.svg') center / contain no-repeat;
  -webkit-mask: url('/images/bob-loading-logo.svg') center / contain no-repeat;
`;

const LogoFill = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: #fff;
  mask: url('/images/bob-loading-logo.svg') center / contain no-repeat;
  -webkit-mask: url('/images/bob-loading-logo.svg') center / contain no-repeat;
`;

const ConfettiField = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  perspective: 500px;
`;

const Confetti = styled(motion.span)`
  position: absolute;
  left: 50%;
  top: 2px;
  translate: -50% -50%;
  opacity: 0;
  border-radius: 1px;
`;
