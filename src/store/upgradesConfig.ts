// Upgrade Groups Configuration
export const UPGRADE_GROUPS = {
  EFFECTS: {
    id: "effects",
    name: "Effects",
    description: "Visual effects and particles",
    icon: "✨",
  },
  THEME: {
    id: "theme",
    name: "Theme",
    description: "Visual themes and colors",
    icon: "🎨",
  },
  OBJECTS: {
    id: "objects",
    name: "Objects",
    description: "3D objects and decorations",
    icon: "🎯",
  },
  UPGRADES: {
    id: "upgrades",
    name: "Upgrades",
    description: "Game mechanics and multipliers",
    icon: "⚡",
  },
} as const;

// Fisheye Slider Configuration
export const FISHEYE_CONFIG = {
  MIN: 0,
  MAX: 0.8,
  DEFAULT: 0.3,
  STEP: 0.05,
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT: {
    id: "default",
    name: "Default",
    description: "The original theme",
    colors: {
      primary: "#2979FF",
      secondary: "#4285F4",
      accent: "#FFD700",
      background: "#ffffff",
      text: "#ffffff",
    },
    planetColors: ["#ffffff", "#C5BDD5", "#85799F"],
    counterColor: "#ffffff",
    counterEmission: 0,
  },
  DARK: {
    id: "dark",
    name: "Dark Mode",
    description: "A sleek dark theme with inverted colors",
    colors: {
      primary: "#BB86FC",
      secondary: "#03DAC6",
      accent: "#FFD700",
      background: "#121212",
      text: "#ffffff",
    },
    planetColors: ["#1a1a1a", "#2d2d2d", "#404040"],
    counterColor: "#BB86FC",
    counterEmission: 0.5, // Cursor works as point light
  },
  PASTEL: {
    id: "pastel",
    name: "Pastel",
    description: "A soft pastel theme",
    colors: {
      primary: "#FFB3BA",
      secondary: "#BAFFC9",
      accent: "#BAE1FF",
      background: "#FFF8DC",
      text: "#212121",
    },
    planetColors: ["#FFE5E5", "#E5FFE5", "#E5F0FF"],
    counterColor: "#FFB3BA",
    counterEmission: 0,
  },
  NEON: {
    id: "neon",
    name: "Neon",
    description: "A vibrant neon theme",
    colors: {
      primary: "#FFFF00",
      secondary: "#00FFFF",
      accent: "#FFFF00",
      background: "#FFFF00",
      text: "#000000",
    },
    planetColors: ["#1a1a1a", "#2a2a2a", "#3a3a3a"], // Dark planet
    counterColor: "#FFFF00",
    counterEmission: 1.0, // Counter emits light
  },
  CUSTOM: {
    id: "custom",
    name: "Custom",
    description: "Create your own theme",
    colors: {
      primary: "#2979FF",
      secondary: "#4285F4",
      accent: "#FFD700",
      background: "#ffffff",
      text: "#000000",
    },
    planetColors: ["#ffffff", "#C5BDD5", "#85799F"],
    counterColor: "#2979FF",
    counterEmission: 0,
  },
} as const;

export type UpgradeGroupId = keyof typeof UPGRADE_GROUPS;
export type ThemeId = keyof typeof THEME_CONFIG;
