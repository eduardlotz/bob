import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const bobItemMessages = defineMessages({
  de: {
    builderHelmet: {
      name: "Baumeister",
      description: "Jo wir schaffen das!",
    },
    krustyKrabHat: {
      name: "Burger Boy",
      description: "Ist da die Krosse Krabbe?",
    },
    afroHair: {
      name: "Künstler",
      description: "Happy little accidents",
    },
    chickenLittleGlasses: {
      name: "Brillenschlange",
      description: "Eddies Brille",
    },
    simsPlumbob: {
      name: "Sim",
      description: "Sul Sul",
    },
    blackCap: {
      name: "Cap",
      description: "Eddies schwarze Kappe",
    },
  },
  en: {
    builderHelmet: {
      name: "Builder",
      description: "Yes we can!",
    },
    krustyKrabHat: {
      name: "Burger Boy",
      description: "Is this the Krusty Krab?",
    },
    afroHair: {
      name: "Artist",
      description: "Happy little accidents",
    },
    chickenLittleGlasses: {
      name: "Four Eyes",
      description: "Eddie's glasses",
    },
    simsPlumbob: {
      name: "Sim",
      description: "Sul Sul",
    },
    blackCap: {
      name: "Cap",
      description: "Eddie's black cap",
    },
  },
});

export const getBobItemCopy = (
  itemId: keyof (typeof bobItemMessages)["de"],
  locale: Locale = getLocale(),
) => bobItemMessages[locale][itemId];
