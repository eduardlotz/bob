import { getLocale } from "@/i18n";
import type { Locale } from "@/i18n/types";
import { routeMessages } from "./routes.messages";

export const ROUTE_PATHS = {
  HOME: "/home",
  ABOUT: "/about",
  PORTFOLIO: "/portfolio",
  TECHNICAL: "/technical",
  CREATIVE: "/creative",
  GUESTBOOK: "/guestbook",
  MINIGAMES: "/mini",
} as const;

type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export const ROUTE_PURCHASE_SEARCH_PARAM = "purchased";
export const ROUTE_PURCHASE_SEARCH_PARAM_VALUE = "true";

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
  "/mini": "route_minigames",
};

const normalizeRoutePath = (path: string): string => {
  if (!path) return ROUTE_PATHS.HOME;
  if (path === "/") return ROUTE_PATHS.HOME;

  const withoutTrailingSlash =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return withoutTrailingSlash || ROUTE_PATHS.HOME;
};

export const shouldUnlockRouteFromSearch = (
  routePath: string,
  search?: string,
): boolean => {
  if (typeof window === "undefined" && search === undefined) return false;

  const currentPath =
    typeof window === "undefined" ? routePath : window.location.pathname;
  const normalizedRoutePath = normalizeRoutePath(routePath);
  const normalizedCurrentPath = normalizeRoutePath(currentPath);

  if (normalizedRoutePath !== normalizedCurrentPath) return false;

  const routeSearch =
    search ?? (typeof window === "undefined" ? "" : window.location.search);
  const searchParams = new URLSearchParams(routeSearch);

  return (
    searchParams.get(ROUTE_PURCHASE_SEARCH_PARAM) ===
    ROUTE_PURCHASE_SEARCH_PARAM_VALUE
  );
};

export const getRouteIdByPath = (path: string): string => {
  const normalizedPath = normalizeRoutePath(path);
  return ROUTE_DICTIONARY[normalizedPath] ?? ROUTE_IDS.HOME;
};

export const ROUTE_CONFIG = {
  [ROUTE_PATHS.HOME]: {
    id: ROUTE_IDS.HOME,
    name: routeMessages.de.byPath[ROUTE_PATHS.HOME].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.HOME].description,
    cost: 0,
    icon: "🏠",
    isLocked: false,
  },
  [ROUTE_PATHS.ABOUT]: {
    id: ROUTE_IDS.ABOUT,
    name: routeMessages.de.byPath[ROUTE_PATHS.ABOUT].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.ABOUT].description,
    cost: 50,
    icon: "👤",
    isLocked: false,
  },
  [ROUTE_PATHS.PORTFOLIO]: {
    id: ROUTE_IDS.PORTFOLIO,
    name: routeMessages.de.byPath[ROUTE_PATHS.PORTFOLIO].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.PORTFOLIO].description,
    cost: 100,
    icon: "🎨",
    isLocked: false,
  },
  [ROUTE_PATHS.TECHNICAL]: {
    id: ROUTE_IDS.TECHNICAL,
    name: routeMessages.de.byPath[ROUTE_PATHS.TECHNICAL].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.TECHNICAL].description,
    cost: 0,
    icon: "⚙️",
    isLocked: true,
  },
  [ROUTE_PATHS.CREATIVE]: {
    id: ROUTE_IDS.CREATIVE,
    name: routeMessages.de.byPath[ROUTE_PATHS.CREATIVE].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.CREATIVE].description,
    cost: 0,
    icon: "🎨",
    isLocked: true,
  },
  [ROUTE_PATHS.GUESTBOOK]: {
    id: ROUTE_IDS.GUESTBOOK,
    name: routeMessages.de.byPath[ROUTE_PATHS.GUESTBOOK].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.GUESTBOOK].description,
    cost: 0,
    icon: "📝",
    isLocked: true,
  },
  [ROUTE_PATHS.MINIGAMES]: {
    id: ROUTE_IDS.MINIGAMES,
    name: routeMessages.de.byPath[ROUTE_PATHS.MINIGAMES].name,
    description: routeMessages.de.byPath[ROUTE_PATHS.MINIGAMES].description,
    cost: 200,
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

export const getRouteCopyByPath = (
  path: string,
  locale: Locale = getLocale(),
) => {
  const routeCopy =
    routeMessages[locale].byPath[path as RoutePath] ??
    routeMessages[locale].byPath[ROUTE_PATHS.HOME];

  return routeCopy;
};

export const getRouteLabelByPath = (
  path: string,
  locale: Locale = getLocale(),
): string => getRouteCopyByPath(path, locale)?.name ?? routeMessages[locale].unknown;

export const getAllRoutes = (locale: Locale = getLocale()) =>
  ROUTES.map((route) => ({
    ...route,
    label: getRouteLabelByPath(route.path, locale),
  }));
