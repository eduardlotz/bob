import { useReducedMotion } from "motion/react";

// Panels and their triggers share the navigation's flat slide/fade/blur.
export const PANEL_SPRING = {
  type: "spring" as const,
  bounce: 0.5,
  visualDuration: 0.3,
};

export const PANEL_LAYOUT_SPRING = {
  type: "spring" as const,
  mass: 0.5,
  damping: 12,
};

const PANEL_ENTER = {
  opacity: 0,
  y: 40,
  filter: "blur(6px)",
};
const PANEL_OPEN = {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
};

export function usePanelMotion() {
  const reducedMotion = useReducedMotion();
  return {
    initial: reducedMotion ? { ...PANEL_OPEN, opacity: 0 } : PANEL_ENTER,
    animate: PANEL_OPEN,
    exit: reducedMotion ? { ...PANEL_OPEN, opacity: 0 } : PANEL_ENTER,
    transition: reducedMotion
      ? { duration: 0, layout: { duration: 0 } }
      : { ...PANEL_SPRING, layout: PANEL_LAYOUT_SPRING },
    style: { transformOrigin: "bottom center" },
  };
}

export const PANEL_ITEM_STAGGER = 0.04;

export function getPanelItemMotion(index: number, reducedMotion: boolean | null) {
  const hidden = {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.9,
    y: reducedMotion ? 0 : 8,
  };
  const transition = reducedMotion ? { duration: 0 } : PANEL_SPRING;
  return {
    initial: hidden,
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        ...transition,
        delay: reducedMotion ? 0 : index * PANEL_ITEM_STAGGER,
      },
    },
    // Only entrance is staggered; closing/reversing never waits on a delay.
    exit: { ...hidden, transition: { ...transition, delay: 0 } },
    transition: {
      ...transition,
      layout: reducedMotion ? { duration: 0 } : PANEL_LAYOUT_SPRING,
    },
  };
}
