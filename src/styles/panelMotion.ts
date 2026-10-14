// Shared with the phone so navigation panels settle with the same bounce.
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
