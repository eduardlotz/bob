import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const tapEffectMessages = defineMessages({
  de: {
    tap_effect_default: {
      name: "Standard",
      description: "Weiße, graue und schwarze Punkte",
    },
    tap_effect_confetti: {
      name: "Konfetti",
      description: "Farbige Konfetti-Partikel",
    },
    tap_effect_smoke: {
      name: "Rauch",
      description: "Sanfte Rauchschwaden, die nach oben ziehen",
    },
    tap_effect_bubbles: {
      name: "Blasen",
      description: "Leichte Seifenblasen mit sanftem Schweben",
    },
    tap_effect_hearts: {
      name: "Herzen",
      description: "Herzen",
    },
    tap_effect_stars: {
      name: "Sterne",
      description: "Sterne",
    },
    tap_effect_laser: {
      name: "Laser",
      description: "Rote Laserblitze direkt aus der Mitte",
    },
    tap_effect_emojis: {
      name: "Emojis",
      description: "Emoji-Partikel mit Augen, Feuer und Funkeln",
    },
  },
  en: {
    tap_effect_default: {
      name: "Default",
      description: "White, gray, and black particles",
    },
    tap_effect_confetti: {
      name: "Confetti",
      description: "Colorful confetti particles",
    },
    tap_effect_smoke: {
      name: "Smoke",
      description: "Soft smoke trails drifting upward",
    },
    tap_effect_bubbles: {
      name: "Bubbles",
      description: "Light soap bubbles with a gentle float",
    },
    tap_effect_hearts: {
      name: "Hearts",
      description: "Hearts",
    },
    tap_effect_stars: {
      name: "Stars",
      description: "Stars",
    },
    tap_effect_laser: {
      name: "Laser",
      description: "Red laser bursts straight from the center",
    },
    tap_effect_emojis: {
      name: "Emojis",
      description: "Emoji particles with eyes, fire, and sparkle",
    },
  },
});

export const getTapEffectCopy = (
  effectId: keyof (typeof tapEffectMessages)["de"],
  locale: Locale = getLocale(),
) => tapEffectMessages[locale][effectId];
