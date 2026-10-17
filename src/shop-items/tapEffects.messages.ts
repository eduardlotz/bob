import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const tapEffectMessages = defineMessages({
  de: {
    tap_effect_comic: { name: "Comic", description: "POP! BAM! Kleine Comic-Explosionen." },
    tap_effect_flowers: { name: "Flower Power", description: "Bunte Blumen wirbeln durch die Luft." },
    tap_effect_ducks: { name: "Quietscheenten", description: "Kleine gelbe Enten hüpfen davon." },
    tap_effect_electric: { name: "Funken", description: "Gelbe Blitze springen nach außen." },

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
      description: "Rote Laserblitze fächern seitlich auf",
    },
    tap_effect_emojis: {
      name: "Emojis",
      description: "Emoji-Partikel mit Augen, Feuer und Funkeln",
    },
  },
  en: {
    tap_effect_comic: { name: "Comic Bursts", description: "POP! BAM! Little comic explosions." },
    tap_effect_flowers: { name: "Flower Power", description: "Colorful flowers spin through the air." },
    tap_effect_ducks: { name: "Rubber Ducks", description: "Little yellow ducks bounce away." },
    tap_effect_electric: { name: "Electric Sparks", description: "Yellow sparks jump outward." },

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
      description: "Red laser bursts spread outward around Bob",
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
