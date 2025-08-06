// Theme configuration constants
export const THEME_IDS = {
  DEFAULT: "default",
  DARK: "dark",
  PASTEL: "pastel",
  NEON: "neon",
} as const;

export const THEME_COLORS = {
  [THEME_IDS.DEFAULT]: {
    primary: "#4285F4",
    secondary: "#2979FF",
    accent: "#FFD700",
  },
  [THEME_IDS.DARK]: {
    primary: "#BB86FC",
    secondary: "#03DAC6",
    accent: "#FFD700",
  },
  [THEME_IDS.PASTEL]: {
    primary: "#FFB3BA",
    secondary: "#BAFFC9",
    accent: "#BAE1FF",
  },
  [THEME_IDS.NEON]: {
    primary: "#FFFF00",
    secondary: "#00FFFF",
    accent: "#FFFF00",
  },
} as const;

// Route-specific theme variations
export const ROUTE_THEME_VARIATIONS = {
  about: {
    primary: "#4285F4",
    secondary: "#2979FF",
    accent: "#FFD700",
  },
  portfolio: {
    primary: "#FF6B6B",
    secondary: "#4ECDC4",
    accent: "#45B7D1",
  },
  technical: {
    primary: "#2C3E50",
    secondary: "#34495E",
    accent: "#3498DB",
  },
  creative: {
    primary: "#E74C3C",
    secondary: "#F39C12",
    accent: "#9B59B6",
  },
  guestbook: {
    primary: "#27AE60",
    secondary: "#2ECC71",
    accent: "#F1C40F",
  },
} as const;
