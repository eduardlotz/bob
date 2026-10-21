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
      description: "Warme Dünen, rollende Steppenläufer, Schlangen und ein verwitterter Sandsteinbogen.",
    },
    world_winter: {
      name: "Winter",
      description: "Verschneite Tannen, bunte Weihnachtslichter und große und kleine Schneemänner.",
    },
    world_halloween: {
      name: "Halloween",
      description: "Ein riesiges Spukschloss, leuchtende Kürbisse und tanzende Herbstblätter.",
    },
    world_island: {
      name: "Einsame Insel",
      description: "Eine winzige Palmeninsel mit türkisblauem Meer und nächtlichem Lagerfeuer.",
    },
    world_underwater: {
      name: "Unter Wasser",
      description: "Tropische Korallen, Fischschwärme und Sonnenstrahlen im türkisblauen Wasser.",
    },
    world_space: {
      name: "Im All",
      description:
        "Mondkrater, Planeten, Meteoriten und UFOs unter einem weiten Sternenhimmel.",
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
      description: "Warm dunes, rolling tumbleweeds, snakes, and a weathered sandstone arch.",
    },
    world_winter: {
      name: "Winter",
      description: "Snowy pines, colorful Christmas lights, and snowmen big and small.",
    },
    world_halloween: {
      name: "Halloween",
      description: "A towering haunted castle, glowing pumpkins, and drifting autumn leaves.",
    },
    world_island: {
      name: "Lonely Island",
      description: "A tiny palm island with turquoise water and a campfire after sunset.",
    },
    world_underwater: {
      name: "Underwater",
      description: "Tropical corals, schools of fish, and sunbeams in turquoise water.",
    },
    world_space: {
      name: "In Space",
      description: "Moon craters, planets, meteors, and UFOs beneath a vast starry sky.",
    },
  },
});

export const getWorldCopy = (
  worldId: keyof (typeof worldMessages)["de"],
  locale: Locale = getLocale(),
) => worldMessages[locale][worldId];
