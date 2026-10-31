import { AnimatePresence, useReducedMotion } from "motion/react";
import { GameScreenBackdrop as Backdrop, GameScores as Scores, GameScore as Score, GameScoreLabel as Label, GameInstructionPrompt as Instructions } from "./GameScreenStyles";
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
