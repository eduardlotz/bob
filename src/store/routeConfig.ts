// Centralized route configuration to avoid circular dependencies
export const ROUTE_PATHS = {
  HOME: "/home",
  ABOUT: "/about",
  PORTFOLIO: "/portfolio",
  TECHNICAL: "/technical",
  CREATIVE: "/creative",
  GUESTBOOK: "/guestbook",
  MINIGAMES: "/mini",
} as const;

export const ROUTE_IDS = {
  HOME: "route_home",
  ABOUT: "route_about",
  PORTFOLIO: "route_portfolio",
  TECHNICAL: "route_technical",
  CREATIVE: "route_creative",
  GUESTBOOK: "route_guestbook",
  MINIGAMES: "route_minigames",
} as const;

// Route configuration
export const ROUTE_CONFIG = {
  [ROUTE_PATHS.HOME]: {
    id: ROUTE_IDS.HOME,
    name: "Home",
    description:
      "Hier kannst du Taps sammeln und die Effekte aus dem Shop nutzen.",
    cost: 0,
    icon: "🏠",
    isLocked: false,
    component: "home" as const,
  },
  [ROUTE_PATHS.ABOUT]: {
    id: ROUTE_IDS.ABOUT,
    name: "Über mich",
    description:
      "Die gute alte 'Über Mich-Seite'. Darf natürlich nicht fehlen.",
    cost: 50,
    icon: "👤",
    isLocked: false,
    component: "about" as const,
  },
  [ROUTE_PATHS.PORTFOLIO]: {
    id: ROUTE_IDS.PORTFOLIO,
    name: "Portfolio",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "💼",
    isLocked: true,
    component: "portfolio" as const,
  },
  [ROUTE_PATHS.TECHNICAL]: {
    id: ROUTE_IDS.TECHNICAL,
    name: "Technisches",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "⚙️",
    isLocked: true,
    component: "technical" as const,
  },
  [ROUTE_PATHS.CREATIVE]: {
    id: ROUTE_IDS.CREATIVE,
    name: "Kreatives",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "🎨",
    isLocked: true,
    component: "creative" as const,
  },
  [ROUTE_PATHS.GUESTBOOK]: {
    id: ROUTE_IDS.GUESTBOOK,
    name: "Gästebuch",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "📝",
    isLocked: true,
    component: "guestbook" as const,
  },
  [ROUTE_PATHS.MINIGAMES]: {
    id: ROUTE_IDS.MINIGAMES,
    name: "Minispiele",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "🎮",
    isLocked: true,
    component: "minigames" as const,
  },
} as const;

// Route definitions
export const ROUTES = [
  {
    path: ROUTE_PATHS.HOME,
    label: ROUTE_CONFIG[ROUTE_PATHS.HOME].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.HOME].component,
  },
  {
    path: ROUTE_PATHS.ABOUT,
    label: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].component,
  },
  {
    path: ROUTE_PATHS.PORTFOLIO,
    label: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].component,
  },
  {
    path: ROUTE_PATHS.TECHNICAL,
    label: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].component,
  },
  {
    path: ROUTE_PATHS.CREATIVE,
    label: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].component,
  },
  {
    path: ROUTE_PATHS.GUESTBOOK,
    label: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].component,
  },
  {
    path: ROUTE_PATHS.MINIGAMES,
    label: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].name,
    component: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].component,
  },
] as const;

// Route utilities
export const getRouteLabelByPath = (path: string): string => {
  const route = ROUTES.find((r) => r.path === path);
  return route?.label || "Unknown";
};

export const getAllRoutes = () => ROUTES;
