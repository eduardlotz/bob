import { SocialsOverlayContent } from "./content";
import { SocialsGlobeObject } from "./sceneObjects";
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
    id: "socials",
    x: 0,
    y: 0.5,
    z: 0,
    pedestalHeight: 0,
    showPedestal: false,
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
      preferredWidth: "320px",
      minHeight: "520px",
      maxHeight: "520px",
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
