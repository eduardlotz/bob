import { Theme } from "./gameStore";

// Fisheye Slider Configuration
export const FISHEYE_CONFIG = {
  MIN: 0.1,
  MAX: 0.8,
  DEFAULT: 0.3,
  STEP: 0.05,
} as const;

// Theme configuration constants
export const THEME_IDS = {
  DEFAULT: "DEFAULT",
  DARK: "DARK",
  PASTEL: "PASTEL",
  NEON: "NEON",
  CUSTOM: "CUSTOM",
} as const;

// Theme Configuration
export const THEME_CONFIG: Record<keyof typeof THEME_IDS, Theme> = {
  [THEME_IDS.DEFAULT]: {
    id: THEME_IDS.DEFAULT,
    name: "Default",
    description: "The original theme",
    cost: 0,
    purchased: false,
    active: true,
    colors: {
      primary: "#2979FF",
      secondary: "#4285F4",
      accent: "#FFD700",
      background: "#000000",
      text: "#ffffff",
    },
    planetColors: ["#ffffff", "#C5BDD5", "#85799F"],
    counterColor: "#ffffff",
    blobColor: "#ffffff",
    outlineColor: "#000000",
    eyeColor: "#000000",
  },
  [THEME_IDS.DARK]: {
    id: THEME_IDS.DARK,
    name: "Dark Mode",
    description: "A sleek dark theme with inverted colors",
    cost: 0,
    purchased: false,
    active: false,
    colors: {
      primary: "#BB86FC",
      secondary: "#03DAC6",
      accent: "#FFD700",
      background: "#121212",
      text: "#ffffff",
    },
    planetColors: ["#1a1a1a", "#2d2d2d", "#404040"],
    counterColor: "#25212B",
    blobColor: "#000000",
    outlineColor: "#545454",
    eyeColor: "#ffffff",
  },
  [THEME_IDS.PASTEL]: {
    id: THEME_IDS.PASTEL,
    name: "Pastel",
    description: "A soft pastel theme",
    cost: 0,
    purchased: false,
    active: false,
    colors: {
      primary: "#FFB3BA",
      secondary: "#BAFFC9",
      accent: "#BAE1FF",
      background: "#FFF8DC",
      text: "#212121",
    },
    planetColors: ["#FFE5E5", "#E5FFE5", "#E5F0FF"],
    counterColor: "#CCF4B6",
    blobColor: "#FEF8DF",
    outlineColor: "#5B482A",
    eyeColor: "#5B482A",
  },
  [THEME_IDS.NEON]: {
    id: THEME_IDS.NEON,
    name: "Neon",
    description: "A vibrant neon theme",
    cost: 0,
    purchased: false,
    active: false,
    colors: {
      primary: "#FFFF00",
      secondary: "#FF3FF9",
      accent: "#FF3FF9",
      background: "#FFFF00",
      text: "#000000",
    },
    planetColors: ["#ADECDE", "#FF00EE", "#2a2a2a"], // Dark planet
    counterColor: "#ffffff",
    blobColor: "#FEFF55",
    outlineColor: "#000000",
    eyeColor: "#ffffff",
  },
  [THEME_IDS.CUSTOM]: {
    id: THEME_IDS.CUSTOM,
    name: "Custom",
    description: "Create your own theme",
    cost: 0,
    purchased: false,
    active: false,
    colors: {
      primary: "#2979FF",
      secondary: "#4285F4",
      accent: "#FFD700",
      background: "#ffffff",
      text: "#000000",
    },
    planetColors: ["#ffffff", "#C5BDD5", "#85799F"],
    counterColor: "#2979FF",
    blobColor: "#ffffff",
    outlineColor: "#000000",
    eyeColor: "#000000",
  },
} as const;

export type ThemeId = keyof typeof THEME_CONFIG;
