import { motion } from "motion/react";
import styled from "styled-components";

export const GameScreenBackdrop = styled(motion.div)`
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

export const GameScores = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
`;

export const GameScore = styled(motion.div)`
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

export const GameScoreLabel = styled.span`
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

export const GameInstructionPrompt = styled(motion.strong)`
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
  -webkit-text-stroke: 2px #202630;
  paint-order: stroke fill;
  text-shadow: 2px 2px 0 #202630;
`;

export const GameTutorial = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 360px;
  color: #fff;
  svg { flex-shrink: 0; max-width: 100%; }
  h2, p { margin: 0; }
  h2 {
    font-size: clamp(24px, 5vw, 32px);
    font-weight: 800;
    line-height: 1.2;
    -webkit-text-stroke: 3px #202630;
    paint-order: stroke fill;
    text-shadow: 2px 2px 0 #202630;
  }
  p { font-size: 16px; line-height: 1.5; }
  strong {
    font-size: 16px;
    font-weight: 800;
    line-height: 1.4;
    -webkit-text-stroke: 2px #202630;
    paint-order: stroke fill;
    text-shadow: 2px 2px 0 #202630;
  }
  @media (max-height: 520px) {
    gap: 10px;
    svg { width: 164px; height: 120px; }
  }
`;
