import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const upgradeMessages = defineMessages({
  de: {
    auto_tap: {
      name: "Auto Tapper",
      description: "Lass Bob 1 Mal pro Sekunde für dich tippen",
    },
    bob_assistant: {
      name: "Bob-Assistent",
      description: "Ein fleissiger Assistent tippt fuer dich",
    },
    garden_gnome: {
      name: "Gartenwichtel",
      description: "Wichtel sammeln Taps aus deinem Garten",
    },
    greenhouse: {
      name: "Gewaechshaus",
      description: "Automatisierte Pflanzen produzieren Taps",
    },
    factory_line: {
      name: "Fertigungsstrasse",
      description: "Eine Fabriklinie pumpt konstant Taps",
    },
    logistics_hub: {
      name: "Logistikzentrum",
      description: "Verteilt Tap-Produktion ueberall hin",
    },
    quantum_lab: {
      name: "Quantenlabor",
      description: "Instabile Experimente erzeugen viele Taps",
    },
    temporal_engine: {
      name: "Temporalmaschine",
      description: "Leiht sich Taps aus naher Zukunft",
    },
    finger_training: {
      name: "Fingertraining",
      description: "Verbessert die Staerke deiner manuellen Taps",
    },
    precision_gloves: {
      name: "Praezisionshandschuhe",
      description: "Jeder Tap sitzt genauer und staerker",
    },
  },
  en: {
    auto_tap: {
      name: "Auto Tapper",
      description: "Let Bob tap for you once per second",
    },
    bob_assistant: {
      name: "Bob Assistant",
      description: "A diligent assistant taps on your behalf",
    },
    garden_gnome: {
      name: "Garden Gnome",
      description: "Tiny gnomes gather taps from your garden",
    },
    greenhouse: {
      name: "Greenhouse",
      description: "Automated plants keep producing taps",
    },
    factory_line: {
      name: "Factory Line",
      description: "A full production line churns out taps",
    },
    logistics_hub: {
      name: "Logistics Hub",
      description: "Distributes tap production everywhere",
    },
    quantum_lab: {
      name: "Quantum Lab",
      description: "Unstable experiments generate huge taps",
    },
    temporal_engine: {
      name: "Temporal Engine",
      description: "Borrows taps from the near future",
    },
    finger_training: {
      name: "Finger Training",
      description: "Improves your manual tap strength",
    },
    precision_gloves: {
      name: "Precision Gloves",
      description: "Every click lands stronger and cleaner",
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
