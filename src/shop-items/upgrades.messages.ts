import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const upgradeMessages = defineMessages({
  de: {
    auto_tap: {
      name: "Tapper",
      description: "Sorgt fur einen konstanten passiven Tap-Strom",
    },
    bob_assistant: {
      name: "Super-Tapper",
      description: "Ein starker Helfer fur schnellere passive Taps",
    },
    garden_gnome: {
      name: "Mega-Tapper",
      description: "Grober passiver Schub fur die Mid-Game Okonomie",
    },
    greenhouse: {
      name: "Ultra-Tapper",
      description: "Industrielles Wachstum mit stabiler Preissteigerung",
    },
    factory_line: {
      name: "Hyper-Tapper",
      description: "Schwere Automatisierung fur das Late Game",
    },
    logistics_hub: {
      name: "Giga-Tapper",
      description: "Skaliertes passives Produktionsnetz",
    },
    quantum_lab: {
      name: "Quantum-Tapper",
      description: "Spater Sprung bei passiver Produktion",
    },
    temporal_engine: {
      name: "Temporal-Tapper",
      description: "Endgame-Maschine fur passives Einkommen",
    },
    finger_training: {
      name: "Finger Training",
      description: "Verbessert deine manuelle Tap-Starke",
    },
    rhythm_drills: {
      name: "Rhythm Drills",
      description: "Baut einen schnelleren und saubereren Tap-Rhythmus auf",
    },
    precision_gloves: {
      name: "Precision Gloves",
      description: "Boostet manuelle Taps durch bessere Kontrolle",
    },
    kinetic_wrists: {
      name: "Kinetic Wrists",
      description: "Speichert Bewegung und entlaedt kraftigere Taps",
    },
    neural_exosuit: {
      name: "Neural Exosuit",
      description: "Late-Game Schub fur starke manuelle Tap-Spitzen",
    },
  },
  en: {
    auto_tap: {
      name: "Tapper",
      description: "Steady passive tap generation",
    },
    bob_assistant: {
      name: "Super-Tapper",
      description: "A stronger helper for faster passive gain",
    },
    garden_gnome: {
      name: "Mega-Tapper",
      description: "Large passive output for mid-game scaling",
    },
    greenhouse: {
      name: "Ultra-Tapper",
      description: "Industrial passive growth with stable pricing",
    },
    factory_line: {
      name: "Hyper-Tapper",
      description: "Heavy automation for late-game income",
    },
    logistics_hub: {
      name: "Giga-Tapper",
      description: "Large-scale passive network",
    },
    quantum_lab: {
      name: "Quantum-Tapper",
      description: "Late-game spike in passive production",
    },
    temporal_engine: {
      name: "Temporal-Tapper",
      description: "Endgame passive engine",
    },
    finger_training: {
      name: "Finger Training",
      description: "Improves your manual tap strength",
    },
    rhythm_drills: {
      name: "Rhythm Drills",
      description: "Builds a faster, cleaner tapping cadence",
    },
    precision_gloves: {
      name: "Precision Gloves",
      description: "Boosts manual taps with better control",
    },
    kinetic_wrists: {
      name: "Kinetic Wrists",
      description: "Stores motion energy and releases stronger taps",
    },
    neural_exosuit: {
      name: "Neural Exosuit",
      description: "Late-game manual boost for big tap spikes",
    },
  },
});

export type UpgradeMessageId = keyof (typeof upgradeMessages)["de"];

const DEFAULT_UPGRADE_COPY = {
  name: "Unknown Upgrade",
  description: "",
};

export const getUpgradeCopy = (
  upgradeId: string,
  locale: Locale = getLocale(),
) => {
  const messages = upgradeMessages[locale] as Record<
    string,
    (typeof upgradeMessages)["de"][UpgradeMessageId]
  >;

  return messages[upgradeId] ?? DEFAULT_UPGRADE_COPY;
};
