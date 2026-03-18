import {
  FavoritesOverlayContent,
  FunFactsOverlayContent,
  SocialsOverlayContent,
  TimelineOverlayContent,
} from "./content";
import {
  FavoritesStackObject,
  FunFactsDeckObject,
  SocialsGlobeObject,
  TimelineCameraObject,
} from "./sceneObjects";
import type { SocialThroneConfig } from "./types";

const SHARED_FOCUS_INTERACTION = {
  allowDrag: true,
  dismissOnClick: true,
  dragSensitivity: 0.00395,
  idleSpinSpeed: 0.00062,
  yawLimit: null,
  pitchLimit: null,
};

export const THRONE_CONFIG = [
  {
    id: "timeline",
    x: -0.2,
    z: -0.2,
    pedestalHeight: 0.38,
    baseColor: "#171a22",
    rimColor: "#7c8cff",
    meta: {
      label: "Timeline",
      description: "Milestones, turns, and a few good detours.",
      accentColor: "#7c8cff",
    },
    object: {
      Component: TimelineCameraObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: "Ereignisse in meinem Leben",
      Component: TimelineOverlayContent,
      preferredWidth: "420px",
      minHeight: "440px",
      maxHeight: "760px",
    },
  },
  {
    id: "socials",
    x: 0.2,
    z: -0.2,
    pedestalHeight: 0.58,
    baseColor: "#162032",
    rimColor: "#56a7ff",
    meta: {
      label: "Socials",
      description: "A tiny internet snow globe with the usual suspects.",
      accentColor: "#56a7ff",
    },
    object: {
      Component: SocialsGlobeObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: "Andere Ecken im Internet",
      Component: SocialsOverlayContent,
      preferredWidth: "520px",
      minHeight: "500px",
      maxHeight: "780px",
    },
  },
  {
    id: "funFacts",
    x: -0.2,
    z: 0.2,
    pedestalHeight: 0.31,
    baseColor: "#231b18",
    rimColor: "#f0a95f",
    meta: {
      label: "Fun Facts",
      description: "Little cards with more personality than they need.",
      accentColor: "#f0a95f",
    },
    object: {
      Component: FunFactsDeckObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: "Kleine Karten mit unnuetzem Wissen",
      Component: FunFactsOverlayContent,
      preferredWidth: "430px",
      minHeight: "520px",
      maxHeight: "820px",
    },
  },
  {
    id: "favorites",
    x: 0.2,
    z: 0.2,
    pedestalHeight: 0.46,
    baseColor: "#1d1b23",
    rimColor: "#ef6d86",
    meta: {
      label: "Favorites",
      description: "Songs, covers, and things I keep looping back to.",
      accentColor: "#ef6d86",
    },
    object: {
      Component: FavoritesStackObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: "Sachen, die ich gerade mag",
      Component: FavoritesOverlayContent,
      preferredWidth: "460px",
      minHeight: "460px",
      maxHeight: "760px",
    },
  },
] satisfies readonly SocialThroneConfig[];

export type ThroneId = (typeof THRONE_CONFIG)[number]["id"];

export const THRONE_ORDER = THRONE_CONFIG.map(
  (throne) => throne.id,
) as ThroneId[];

export const THRONE_BY_ID = Object.fromEntries(
  THRONE_CONFIG.map((throne) => [throne.id, throne]),
) as Record<ThroneId, (typeof THRONE_CONFIG)[number]>;
