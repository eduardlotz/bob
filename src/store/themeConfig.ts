import { Theme } from "./gameStore";

export const FISHEYE_CONFIG = {
  MIN: 0.1,
  MAX: 0.8,
  DEFAULT: 0.3,
  STEP: 0.05,
} as const;

export const THEME_IDS = {
  DEFAULT: "DEFAULT",
  DARK: "DARK",
  PASTEL: "PASTEL",
  NEON: "NEON",
  CUSTOM: "CUSTOM",
} as const;

export const THEME_CONFIG: Record<keyof typeof THEME_IDS, Theme> = {
  [THEME_IDS.DEFAULT]: {
    id: THEME_IDS.DEFAULT,
    name: "Default",
    description: "The original theme",
    active: true,
    preview: false,
    colors: {
      primary: "#212121",
      secondary: "#4178F7",
      accent: "#FFD700",
      background: "#212121",
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
    active: false,
    preview: false,
    colors: {
      primary: "#151417",
      secondary: "#151417",
      accent: "#FFD700",
      background: "#151417",
      text: "#ffffff",
    },
    planetColors: ["#1a1a1a", "#2d2d2d", "#09080a"],
    counterColor: "#49484aff",
    blobColor: "#0d0d0f",
    outlineColor: "#b4b4b4ff",
    eyeColor: "#f1f1f1",
  },
  [THEME_IDS.PASTEL]: {
    id: THEME_IDS.PASTEL,
    name: "Pastel",
    description: "A soft pastel theme",
    preview: false,
    active: false,
    colors: {
      primary: "#515B40",
      secondary: "#C3E9AE",
      accent: "#FFD700",
      background: "#FFF8DC",
      text: "#ffffff",
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
    preview: false,
    active: false,
    colors: {
      primary: "#FFFF00",
      secondary: "#FF3FF9",
      accent: "#FFD700",
      background: "#FFFF00",
      text: "#000000",
    },
    planetColors: ["#ADECDE", "#FF00EE", "#2a2a2a"], // Dark planet
    counterColor: "#ffffff",
    blobColor: "#FEFF55",
    outlineColor: "#000000",
    eyeColor: "#191919",
  },
  [THEME_IDS.CUSTOM]: {
    id: THEME_IDS.CUSTOM,
    name: "Custom",
    description: "Create your own theme",
    preview: false,
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
