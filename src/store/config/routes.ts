export const ROUTE_PATHS = {
  HOME: "/home",
  ABOUT: "/about",
  PORTFOLIO: "/portfolio",
  TECHNICAL: "/technical",
  CREATIVE: "/creative",
  GUESTBOOK: "/guestbook",
  MINIGAMES: "/mini",
} as const;

// TODO: check if paths are enough
export const ROUTE_IDS = {
  HOME: "route_home",
  ABOUT: "route_about",
  PORTFOLIO: "route_portfolio",
  TECHNICAL: "route_technical",
  CREATIVE: "route_creative",
  GUESTBOOK: "route_guestbook",
  MINIGAMES: "route_minigames",
} as const;

// TODO: clean up this mix of data structures
export const ROUTE_DICTIONARY: { [key: string]: string } = {
  "/home": "route_home",
  "/about": "route_about",
  "/portfolio": "route_portfolio",
  "/creative": "route_creative",
  "/technical": "route_technical",
  "/guestbook": "route_guestbook",
};

export const ROUTE_CONFIG = {
  [ROUTE_PATHS.HOME]: {
    id: ROUTE_IDS.HOME,
    name: "Home",
    description:
      "Hier kannst du Taps sammeln und die Effekte aus dem Shop nutzen.",
    cost: 0,
    icon: "🏠",
    isLocked: false,
  },
  [ROUTE_PATHS.ABOUT]: {
    id: ROUTE_IDS.ABOUT,
    name: "Über mich",
    description:
      "Die gute alte 'Über Mich-Seite'. Darf natürlich nicht fehlen.",
    cost: 50,
    icon: "👤",
    isLocked: false,
  },
  [ROUTE_PATHS.PORTFOLIO]: {
    id: ROUTE_IDS.PORTFOLIO,
    name: "Portfolio",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "💼",
    isLocked: true,
  },
  [ROUTE_PATHS.TECHNICAL]: {
    id: ROUTE_IDS.TECHNICAL,
    name: "Technisches",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "⚙️",
    isLocked: true,
  },
  [ROUTE_PATHS.CREATIVE]: {
    id: ROUTE_IDS.CREATIVE,
    name: "Kreatives",
    description: "Meine kreative Seite",
    cost: 50,
    icon: "🎨",
    isLocked: false,
  },
  [ROUTE_PATHS.GUESTBOOK]: {
    id: ROUTE_IDS.GUESTBOOK,
    name: "Gästebuch",
    description: "Noch nicht verfügbar.",
    cost: 0,
    icon: "📝",
    isLocked: true,
  },
  [ROUTE_PATHS.MINIGAMES]: {
    id: ROUTE_IDS.MINIGAMES,
    name: "Minispiele",
    description: "Noch nicht verfügbar.",
    cost: 500,
    icon: "🎮",
    isLocked: false,
  },
} as const;

export const ROUTES = [
  {
    path: ROUTE_PATHS.HOME,
    label: ROUTE_CONFIG[ROUTE_PATHS.HOME].name,
  },
  {
    path: ROUTE_PATHS.ABOUT,
    label: ROUTE_CONFIG[ROUTE_PATHS.ABOUT].name,
  },
  {
    path: ROUTE_PATHS.PORTFOLIO,
    label: ROUTE_CONFIG[ROUTE_PATHS.PORTFOLIO].name,
  },
  {
    path: ROUTE_PATHS.TECHNICAL,
    label: ROUTE_CONFIG[ROUTE_PATHS.TECHNICAL].name,
  },
  {
    path: ROUTE_PATHS.CREATIVE,
    label: ROUTE_CONFIG[ROUTE_PATHS.CREATIVE].name,
  },
  {
    path: ROUTE_PATHS.GUESTBOOK,
    label: ROUTE_CONFIG[ROUTE_PATHS.GUESTBOOK].name,
  },
  {
    path: ROUTE_PATHS.MINIGAMES,
    label: ROUTE_CONFIG[ROUTE_PATHS.MINIGAMES].name,
  },
] as const;

export const getRouteLabelByPath = (path: string): string => {
  const route = ROUTES.find((r) => r.path === path);
  return route?.label || "Unknown";
};

export const getAllRoutes = () => ROUTES;
