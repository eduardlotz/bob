// Theme configuration constants
export const THEME_IDS = {
  DEFAULT: "default",
  DARK: "dark",
  PASTEL: "pastel",
  NEON: "neon",
  CUSTOM: "custom",
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

// Helper function to get theme colors
export const getThemeColors = (themeId: string): ThemeColors => {
  return THEME_COLORS[themeId] || THEME_COLORS[THEME_IDS.DEFAULT];
};

// Helper function to get blob color for a specific theme and route
export const getBlobColorForTheme = (
  themeId: string,
  routeId?: string
): string => {
  // Route-specific blob colors can override theme colors
  if (routeId) {
    const routeConfig = getRouteBlobColors(routeId);
    if (routeConfig) {
      return routeConfig.blobColor;
    }
  }

  // Fall back to theme blob colors
  const themeBlobColors: Record<string, string> = {
    [THEME_IDS.DEFAULT]: "#ffffff",
    [THEME_IDS.DARK]: "#22c55e",
    [THEME_IDS.PASTEL]: "#86efac",
    [THEME_IDS.NEON]: "#00ff88",
    [THEME_IDS.CUSTOM]: "#ffffff",
  };

  return themeBlobColors[themeId] || "#ffffff";
};

// Route-specific blob color configurations
const ROUTE_BLOB_COLORS: Record<
  string,
  {
    blobColor: string;
  }
> = {
  route_home: {
    blobColor: "#ffffff",
  },
  route_about: {
    blobColor: "#3b82f6",
  },
  route_portfolio: {
    blobColor: "#8b5cf6",
  },
  route_creative: {
    blobColor: "#f59e0b",
  },
  route_technical: {
    blobColor: "#ef4444",
  },
  route_guestbook: {
    blobColor: "#ec4899",
  },
};

const getRouteBlobColors = (routeId: string) => {
  return ROUTE_BLOB_COLORS[routeId];
};
