import { TapEffect } from "@/store";

export const initialTapEffects: TapEffect[] = [
  {
    id: "tap_effect_default",
    name: "Standard",
    description: "Weiße, graue und schwarze Punkte",
    cost: 0,
    purchased: true,
    type: "tapEffect",
    enabled: true,
    effectId: 0,
  },
  {
    id: "tap_effect_confetti",
    name: "Konfetti",
    description: "Farbige Confetti-Partikel",
    cost: 100,
    purchased: false,
    type: "tapEffect",
    enabled: false,
    effectId: 1,
  },
  {
    id: "tap_effect_hearts",
    name: "Herzen",
    description: "Herzen",
    cost: 250,
    purchased: false,
    type: "tapEffect",
    enabled: false,
    effectId: 2,
  },
  {
    id: "tap_effect_stars",
    name: "Sterne",
    description: "Sterne",
    cost: 500,
    purchased: false,
    type: "tapEffect",
    enabled: false,
    effectId: 3,
  },
];

export const getTapEffectsIds = () => {
  return initialTapEffects.map((t) => t.id);
};
