// Theme configuration constants
export const THEME_IDS = {
  DEFAULT: "DEFAULT",
  DARK: "DARK",
  PASTEL: "PASTEL",
  NEON: "NEON",
  CUSTOM: "CUSTOM",
} as const;

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border?: string;
  cardBackground?: string;
  success?: string;
  danger?: string;
  warning?: string;
}

export const THEME_COLORS: Record<string, ThemeColors> = {
  [THEME_IDS.DEFAULT]: {
    primary: "#4285F4",
    secondary: "#2979FF",
    accent: "#FFD700",
    background: "#ffffff",
    text: "#ffffff",
  },
  [THEME_IDS.DARK]: {
    primary: "#BB86FC",
    secondary: "#03DAC6",
    accent: "#FFD700",
    background: "#121212",
    text: "#ffffff",
  },
  [THEME_IDS.PASTEL]: {
    primary: "#FFB3BA",
    secondary: "#BAFFC9",
    accent: "#BAE1FF",
    background: "#FFF8DC",
    text: "#212121",
  },
  [THEME_IDS.NEON]: {
    primary: "#FFFF00",
    secondary: "#00FFFF",
    accent: "#FFFF00",
    background: "#FFFF00",
    text: "#000000",
  },
  [THEME_IDS.CUSTOM]: {
    primary: "#4285F4",
    secondary: "#2979FF",
    accent: "#FFD700",
    background: "#ffffff",
    text: "#ffffff",
  },
} as const;

// Helper function to get theme colors
export const getThemeColors = (themeId: string): ThemeColors => {
  return THEME_COLORS[themeId] || THEME_COLORS[THEME_IDS.DEFAULT];
};
