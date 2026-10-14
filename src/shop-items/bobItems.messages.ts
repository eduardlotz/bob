import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const bobItemMessages = defineMessages({
  de: {
    propellerHat: { name: "Propellermütze", description: "Immer eine Drehung voraus." },
    bobMoustache: { name: "Schnubbi", description: "Ein Schnurrbart wie bei Bob Belcher." },
    royalCrown: { name: "Krone", description: "Eine Krone für zehn Millionen." },
    wizardHat: { name: "Zauberer", description: "Ein bisschen Magie für Bob." },
    flatCap: { name: "Schiebermütze", description: "Ein Klassiker in Braun." },
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
    astronautHelmet: {
      name: "Spacebob",
      description: "A childhood dream",
    },
    rastaBeanie: {
      name: "Marley",
      description: "Rastafari",
    },
  },
  en: {
    propellerHat: { name: "Propeller Hat", description: "Always one spin ahead." },
    bobMoustache: { name: "Moustache", description: "A moustache like Bob Belcher's." },
    royalCrown: { name: "Crown", description: "A crown worth ten million." },
    wizardHat: { name: "Wizard", description: "A little magic for Bob." },
    flatCap: { name: "Flat Cap", description: "A classic in brown." },
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
    astronautHelmet: {
      name: "Spacebob",
      description: "Der Kindheitstraum",
    },
    rastaBeanie: {
      name: "Marley",
      description: "Rastafari",
    },
  },
});

export const getBobItemCopy = (
  itemId: keyof (typeof bobItemMessages)["de"],
  locale: Locale = getLocale(),
) => bobItemMessages[locale][itemId];
