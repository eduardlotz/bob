import { motion } from "motion/react";
import styled from "styled-components";
import { GameOverlay } from "./GameOverlay";

export type FloatingTextKind = "cost" | "muted" | "win" | "gold";
export type FloatingTextParticle = {
  id: number; text: string; kind: FloatingTextKind; duration: number;
  x: number; y: number; rotation: number;
};

export const FLOATING_TEXT_DURATION: Record<FloatingTextKind, number> = {
  cost: 1.4, muted: 1.8, win: 3, gold: 5,
};

export function makeFloatingTextParticle(id: number, text: string, kind: FloatingTextKind): FloatingTextParticle {
  // Keep even the widest reward label inside the screen, clear of bottom controls.
  const horizontalRoom = Math.max(0, Math.min(160, window.innerWidth / 2 - 170));
  const lane = kind === "cost" ? 80 : kind === "gold" ? -45 : 0;
  return { id, text, kind, duration: FLOATING_TEXT_DURATION[kind],
    x: (Math.random() * 2 - 1) * horizontalRoom,
    y: Math.max(-window.innerHeight * 0.25 + 70, Math.min(window.innerHeight * 0.2, lane + (Math.random() - 0.5) * 38)),
    rotation: (Math.random() - 0.5) * 12,
  };
}

export function FloatingGameText({ particles, onComplete }: {
  particles: FloatingTextParticle[]; onComplete: (id: number) => void;
}) {
  return <GameOverlay><TextStage>
    {particles.map((particle) => <TextParticle key={particle.id} $kind={particle.kind} role="status"
      initial={{ x: particle.x, y: particle.y + 20, rotate: particle.rotation, scale: 0.65, opacity: 0 }}
      animate={{ x: particle.x, y: particle.y - 65, rotate: particle.rotation * 1.25,
        scale: [0.65, 1.07, 1, 0.96], opacity: [0, 1, 1, 0] }}
      transition={{ duration: particle.duration, times: [0, 0.12, 0.76, 1], ease: "easeOut" }}
      onAnimationComplete={() => onComplete(particle.id)}>
      <span className="amount">{particle.text.replace(/ 🫵$/, "")}</span>
      {particle.text.endsWith(" 🫵") && <span className="currency"> 🫵</span>}
    </TextParticle>)}
  </TextStage></GameOverlay>;
}

const TextStage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  pointer-events: none;
  overflow: hidden;
`;
const TextParticle = styled(motion.div)<{ $kind: FloatingTextKind }>`
  grid-area: 1 / 1;
  max-width: calc(100vw - 32px);
  color: ${({ $kind }) => $kind === "cost" ? "#f26d77" : $kind === "win" ? "#77e5a5" : $kind === "gold" ? "#ffe09a" : "#a7a4af"};
  font-size: ${({ $kind }) => $kind === "gold" ? "clamp(23px, 5vw, 32px)" : "22px"};
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  text-align: center;
  .amount {
    display: inline-block;
    -webkit-text-stroke: 3px #202630;
    paint-order: stroke fill;
    text-shadow: 2px 3px 0 #202630;
    ${({ $kind }) => $kind === "gold" ? `background: linear-gradient(#fff3ca, #ffe09a 45%, #d69b38); background-clip: text; -webkit-background-clip: text; color: transparent; text-shadow: none; filter: drop-shadow(2px 3px 0 #202630);` : ""}
  }
  .currency {
    display: inline-block;
    filter: drop-shadow(2px 3px 0 #202630);
  }
`;
