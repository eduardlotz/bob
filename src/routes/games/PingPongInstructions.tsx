import { motion, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { PANEL_SPRING } from "@/styles/panelMotion";

type ControlMode = "mouse" | "touch" | "tilt";

const messages = {
  de: {
    title: "Halte den Ball in der Luft",
    mouse: "Bewege die Maus, um den Schläger unter den Ball zu führen.",
    touch: "Ziehe deinen Finger über den Bildschirm, um den Schläger unter den Ball zu führen.",
    tilt: "Neige dein Handy nach links, rechts, vorne und hinten, um den Schläger unter den Ball zu führen.",
    desktopStart: "Klicken oder Leertaste zum Spielen",
    mobileStart: "Tippen zum Spielen",
  },
  en: {
    title: "Keep the ball in the air",
    mouse: "Move your mouse to guide the bat under the ball.",
    touch: "Drag your finger across the screen to guide the bat under the ball.",
    tilt: "Tilt your phone left, right, forwards and backwards to guide the bat under the ball.",
    desktopStart: "Click or press space to play",
    mobileStart: "Tap to play",
  },
};

export function PingPongInstructions({ locale, mode }: { locale: "de" | "en"; mode: ControlMode }) {
  const reducedMotion = useReducedMotion();
  const copy = messages[locale];
  const slide = reducedMotion ? { x: 0, y: 0 } : { x: [-24, 24, -24], y: [4, -4, 4] };
  const loop = { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const };

  return <Instructions
    initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={PANEL_SPRING}>
    <motion.svg key={mode} width="240" height="176" viewBox="0 0 240 176" fill="none" aria-hidden="true">
      <g stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <path d="M39 65h25m-19-6-6 6 6 6m19-12 6 6-6 6M176 65h25m-19-6-6 6 6 6m19-12 6 6-6 6" />
        <path d="M120 12v12m-5-7 5-5 5 5" />
      </g>
      <motion.g animate={slide} transition={loop}>
        <motion.circle cx="120" cy="35" r="8" fill="white" stroke="#202630" strokeWidth="3"
          animate={reducedMotion ? { y: 0 } : { y: [-9, 10, -9] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
        <g transform="rotate(-18 120 72)" stroke="#202630" strokeWidth="3">
          <rect x="114" y="76" width="12" height="32" rx="4" fill="#dd9944" />
          <ellipse cx="120" cy="65" rx="26" ry="21" fill="#f44336" />
          <path d="M100 59c4-7 13-10 20-10" stroke="white" strokeOpacity="0.5" strokeLinecap="round" />
        </g>
      </motion.g>
      <g transform="translate(120 145)">
        <motion.g animate={mode === "tilt"
          ? { rotate: reducedMotion ? 0 : [-15, 15, -15] }
          : { x: reducedMotion ? 0 : [-24, 24, -24] }} transition={loop}
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {mode === "mouse" ? <>
            <rect x="-12" y="-20" width="24" height="36" rx="12" fill="#202630" />
            <path d="M0-14v8m-12 1h24" />
          </> : mode === "touch" ? <>
            <path d="M-10 12-17 2c-3-5 2-9 5-5l4 5v-21c0-6 8-6 8 0v13c7-4 18 0 18 7v7c0 5-3 8-3 8H-5Z" fill="#202630" />
            <path d="M-18-16h-10m4-4-4 4 4 4M14-16h10m-4-4 4 4-4 4" />
          </> : <>
            <rect x="-11" y="-22" width="22" height="40" rx="4" fill="#202630" />
            <path d="M-3 12h6M-24-9l-5 6 5 6M24-9l5 6-5 6" />
          </>}
        </motion.g>
      </g>
    </motion.svg>
    <h2>{copy.title}</h2>
    <p>{copy[mode]}</p>
    <strong>{mode === "mouse" ? copy.desktopStart : copy.mobileStart}</strong>
  </Instructions>;
}

const Instructions = styled(motion.div)`
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
