import {
  FavoritesOverlayContent,
  SocialsOverlayContent,
  TimelineOverlayContent,
} from "./content";
import {
  FavoritesStackObject,
  SocialsGlobeObject,
  TimelineCameraObject,
} from "./sceneObjects";
import type { SocialThroneConfig } from "./types";
import { socialsMessages } from "./socials.messages";

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
      label: socialsMessages.de.timeline.label,
      description: socialsMessages.de.timeline.description,
      accentColor: "#7c8cff",
    },
    object: {
      Component: TimelineCameraObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: socialsMessages.de.timeline.subtitle,
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
      label: socialsMessages.de.socials.label,
      description: socialsMessages.de.socials.description,
      accentColor: "#56a7ff",
    },
    object: {
      Component: SocialsGlobeObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: socialsMessages.de.socials.subtitle,
      Component: SocialsOverlayContent,
      preferredWidth: "520px",
      minHeight: "500px",
      maxHeight: "780px",
    },
  },
  {
    id: "favorites",
    x: -0.2,
    z: 0.2,
    pedestalHeight: 0.46,
    baseColor: "#1d1b23",
    rimColor: "#ef6d86",
    meta: {
      label: socialsMessages.de.favorites.label,
      description: socialsMessages.de.favorites.description,
      accentColor: "#ef6d86",
    },
    object: {
      Component: FavoritesStackObject,
      focusInteraction: SHARED_FOCUS_INTERACTION,
    },
    overlay: {
      subtitle: socialsMessages.de.favorites.subtitle,
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
