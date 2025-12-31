import { Upgrade } from "@/store";

export const initialTapUpgrades: Upgrade[] = [
  {
    id: "auto_tap",
    name: "Auto Tapper",
    description: "Lass Bob 1 Mal pro Sekunde für dich tippen",
    baseCost: 15,
    costMultiplier: 5,
    level: 0,
    maxLevel: 20,
    effect: { type: "autoTap", value: 1 },
    unlocked: true,
  },
  {
    id: "tap_multiplier",
    name: "Tap Multiplikator",
    description: "Verdopple deine Taps",
    baseCost: 50,
    costMultiplier: 5,
    level: 0,
    maxLevel: 20,
    effect: { type: "tapMultiplier", value: 2 },
    unlocked: true,
  },
];
