import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { PANEL_SPRING } from "@/styles/panelMotion";
import type { ReactNode } from "react";

export function FlappyOverlay({ phase, score, highScore, instructions, scoreLabel, idleContent }: {
  phase: "idle" | "playing" | "over";
  score: string;
  highScore: string;
  instructions: string;
  scoreLabel: string;
  idleContent?: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const pop = (rotation: number, delay = 0) => ({
    initial: { scale: reducedMotion ? 1 : 0.5, rotate: reducedMotion ? 0 : rotation - 12, opacity: 0 },
    animate: { scale: 1, rotate: reducedMotion ? 0 : rotation, opacity: 1 },
    exit: { scale: reducedMotion ? 1 : 0.5, rotate: reducedMotion ? 0 : rotation + 12, opacity: 0,
      transition: { ...PANEL_SPRING, delay: 0 } },
    transition: { ...PANEL_SPRING, delay },
  });

  return <AnimatePresence>
    {phase !== "playing" && <Backdrop key={phase}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      {phase === "over" ? <Scores role="status" aria-live="polite">
        <Score {...pop(-6)}>
          <strong>{score}</strong>
          <Label>{scoreLabel}</Label>
        </Score>
        <Score className="highscore" {...pop(6, 0.08)}>
          <strong>{highScore}</strong>
          <Label>Highscore</Label>
        </Score>
      </Scores> : idleContent ?? <Instructions {...pop(0)}>{instructions}</Instructions>}
    </Backdrop>}
  </AnimatePresence>;
}

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  pointer-events: none;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  text-align: center;
`;

const Scores = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
`;

const Score = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  strong {
    color: #fff;
    font-size: clamp(96px, 14vw, 176px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.06em;
    font-variant-numeric: tabular-nums;
    -webkit-text-stroke: 6px #202630;
    paint-order: stroke fill;
    text-shadow: 4px 5px 0 #202630;
  }
  &.highscore strong {
    font-size: 40px;
    -webkit-text-stroke-width: 3px;
    text-shadow: 2px 3px 0 #202630;
  }
`;

const Label = styled.span`
  position: relative;
  border-radius: 8px;
  padding: 8px 12px;
  background: #000;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  &::before {
    content: "";
    position: absolute;
    bottom: 100%;
    left: calc(50% - 7px);
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid #000;
  }
`;

const Instructions = styled(motion.strong)`
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
  -webkit-text-stroke: 2px #202630;
  paint-order: stroke fill;
  text-shadow: 2px 2px 0 #202630;
`;
