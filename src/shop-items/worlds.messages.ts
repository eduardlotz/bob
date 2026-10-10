import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const worldMessages = defineMessages({
  de: {
    world_default: {
      name: "Standard",
      description: "Der klassische Vorgarten mit Grid und blau-weißer Welt.",
    },
    world_forest: {
      name: "Wald",
      description: "Ein dichter Bob-Wald mit Wolken und Glühpunkten.",
    },
    world_city: {
      name: "Stadt",
      description:
        "Eine New Yorker Skyline mit Brownstones, Autos und gelben Taxis.",
    },
    world_desert: {
      name: "Wüste",
      description: "Warme Dünen, Kakteen und ein bisschen Staub in der Luft.",
    },
    world_winter: {
      name: "Winter",
      description: "Kalter Schnee, riesige Tannen und dichter Schneefall.",
    },
    world_moon: {
      name: "Mond",
      description:
        "Ein warmer Mondboden mit Kratern und fliegenden Meteoriten.",
    },
    world_space: {
      name: "Im All",
      description:
        "Ein dunkler Sternenhimmel mit weiter Tiefe und schwächerem Licht.",
    },
  },
  en: {
    world_default: {
      name: "Default",
      description: "The classic front yard with a grid and blue-white world.",
    },
    world_forest: {
      name: "Forest",
      description: "A dense Bob forest with clouds and glowing particles.",
    },
    world_city: {
      name: "City",
      description:
        "A New York-style skyline with brownstones, cars, and yellow cabs.",
    },
    world_desert: {
      name: "Desert",
      description: "Warm dunes, cacti, and a little dust in the air.",
    },
    world_winter: {
      name: "Winter",
      description: "Cold snow, towering pines, and heavy snowfall.",
    },
    world_moon: {
      name: "Moon",
      description: "A warm moon surface with craters and flying meteors.",
    },
    world_space: {
      name: "In Space",
      description: "A dark starry sky with more depth and softer lighting.",
    },
  },
});

export const getWorldCopy = (
  worldId: keyof (typeof worldMessages)["de"],
  locale: Locale = getLocale(),
) => worldMessages[locale][worldId];
