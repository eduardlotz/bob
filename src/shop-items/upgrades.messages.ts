import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const upgradeMessages = defineMessages({
  de: {
    auto_tap: {
      name: "Auto Tapper",
      description: "Lass Bob 1 Mal pro Sekunde für dich tippen",
    },
    tap_multiplier: {
      name: "Tap Multiplikator",
      description: "Verdopple deine Taps",
    },
  },
  en: {
    auto_tap: {
      name: "Auto Tapper",
      description: "Let Bob tap for you once per second",
    },
    tap_multiplier: {
      name: "Tap Multiplier",
      description: "Double your taps",
    },
  },
});

export const getUpgradeCopy = (
  upgradeId: keyof (typeof upgradeMessages)["de"],
  locale: Locale = getLocale(),
) => upgradeMessages[locale][upgradeId];
