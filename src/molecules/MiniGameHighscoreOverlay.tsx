import { ROUTE_PATHS, useMiniGameStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

export function MiniGameHighscoreOverlay() {
  const location = useLocation();
  const activeGame = useMiniGameStore((s) => s.activeGame);
  const score = useMiniGameStore((s) => s.session.score);
  const highScores = useMiniGameStore((s) => s.highScores);

  const showChip =
    location.pathname === ROUTE_PATHS.MINIGAMES &&
    activeGame !== "LOBBY" &&
    activeGame !== "SLOT_MACHINE";

  const rawCurrentHighScore =
    activeGame === "LOBBY"
      ? 0
      : Number(highScores[activeGame as keyof typeof highScores] ?? 0);
  const currentGameHighScore = Number.isFinite(rawCurrentHighScore)
    ? rawCurrentHighScore
    : 0;
  const displayedHighScore = Math.max(currentGameHighScore, score);
  const isNewHighscore = activeGame !== "LOBBY" && score > currentGameHighScore;
  const label = isNewHighscore
    ? `New Highscore: ${displayedHighScore.toLocaleString("de-DE", {
        maximumFractionDigits: 0,
      })}`
    : `Highscore: ${displayedHighScore.toLocaleString("de-DE", {
        maximumFractionDigits: 0,
      })}`;

  if (typeof document === "undefined") return null;
  const root = document.getElementById("motion-root") ?? document.body;

  return createPortal(
    <AnimatePresence>
      {showChip && (
        <MiniGameHighscoreChip
          key="minigame-highscore-chip"
          initial={{ y: -120, filter: "blur(6px)" }}
          animate={{ y: 0, filter: "blur(0px)" }}
          exit={{ y: -120, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: "circInOut" }}
        >
          {label}
        </MiniGameHighscoreChip>
      )}
    </AnimatePresence>,
    root,
  );
}

const MiniGameHighscoreChip = styled(motion.div)`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  margin: 0 auto;

  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);
  word-wrap: nowrap;
  pointer-events: none;

  color: #ffffff;
  padding: 12px 16px;
  border-radius: 50px;
  background-color: rgba(0, 0, 0, 0.2);
  -webkit-backdrop-filter: blur(32px);
  backdrop-filter: blur(32px);
  font-size: 16px;
  letter-spacing: -2%;
  font-weight: 600;
  z-index: 1000;
`;
