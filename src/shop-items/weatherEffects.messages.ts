import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const weatherEffectMessages = defineMessages({
  de: {
    environment_rain: {
      name: "Regen",
      description: "",
    },
    environment_clouds: {
      name: "Wolken/Nebel",
      description: "Noch nicht so ganz fertig",
    },
    environment_stars: {
      name: "Sterne",
      description: "",
    },
  },
  en: {
    environment_rain: {
      name: "Rain",
      description: "",
    },
    environment_clouds: {
      name: "Clouds/Fog",
      description: "Not quite finished yet",
    },
    environment_stars: {
      name: "Stars",
      description: "",
    },
  },
});

export const getWeatherEffectCopy = (
  effectId: keyof (typeof weatherEffectMessages)["de"],
  locale: Locale = getLocale(),
) => weatherEffectMessages[locale][effectId];
