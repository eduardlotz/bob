import { Upgrade } from "@/store";

type AutoTapUpgradeConfig = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  tapsPerLevel: number;
};

type TapPowerUpgradeConfig = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  multiplierPerLevel: number;
};

const createAutoTapUpgrade = ({
  id,
  name,
  description,
  baseCost,
  costMultiplier,
  maxLevel,
  tapsPerLevel,
}: AutoTapUpgradeConfig): Upgrade => ({
  id,
  name,
  description,
  baseCost,
  costMultiplier,
  level: 0,
  maxLevel,
  effect: { type: "autoTap", value: tapsPerLevel },
  unlocked: true,
});

const createTapPowerUpgrade = ({
  id,
  name,
  description,
  baseCost,
  costMultiplier,
  maxLevel,
  multiplierPerLevel,
}: TapPowerUpgradeConfig): Upgrade => ({
  id,
  name,
  description,
  baseCost,
  costMultiplier,
  level: 0,
  maxLevel,
  effect: { type: "tapMultiplier", value: multiplierPerLevel },
  unlocked: true,
});

const autoTapUpgrades: Upgrade[] = [
  createAutoTapUpgrade({
    id: "auto_tap",
    name: "Tapper",
    description: "Generates a steady passive trickle of taps",
    baseCost: 15,
    costMultiplier: 1.13,
    maxLevel: 300,
    tapsPerLevel: 1,
  }),
  createAutoTapUpgrade({
    id: "bob_assistant",
    name: "Super-Tapper",
    description: "A stronger helper for faster passive gain",
    baseCost: 1_500,
    costMultiplier: 1.135,
    maxLevel: 250,
    tapsPerLevel: 2,
  }),
  createAutoTapUpgrade({
    id: "garden_gnome",
    name: "Mega-Tapper",
    description: "Major passive output for mid-game scaling",
    baseCost: 102_000,
    costMultiplier: 1.14,
    maxLevel: 200,
    tapsPerLevel: 20,
  }),
  createAutoTapUpgrade({
    id: "greenhouse",
    name: "Ultra-Tapper",
    description: "Industrial passive growth with stable pricing",
    baseCost: 850_000,
    costMultiplier: 1.145,
    maxLevel: 150,
    tapsPerLevel: 75,
  }),
  createAutoTapUpgrade({
    id: "factory_line",
    name: "Hyper-Tapper",
    description: "Heavy automation for late-game income",
    baseCost: 6_800_000,
    costMultiplier: 1.15,
    maxLevel: 100,
    tapsPerLevel: 300,
  }),
  createAutoTapUpgrade({
    id: "logistics_hub",
    name: "Giga-Tapper",
    description: "Large-scale passive network",
    baseCost: 55_000_000,
    costMultiplier: 1.155,
    maxLevel: 67,
    tapsPerLevel: 1_200,
  }),
  createAutoTapUpgrade({
    id: "quantum_lab",
    name: "Quantum-Tapper",
    description: "Late-game spike in passive production",
    baseCost: 420_000_000,
    costMultiplier: 1.16,
    maxLevel: 50,
    tapsPerLevel: 4_800,
  }),
  createAutoTapUpgrade({
    id: "temporal_engine",
    name: "Temporal-Tapper",
    description: "Endgame passive engine",
    baseCost: 3_200_000_000,
    costMultiplier: 1.165,
    maxLevel: 40,
    tapsPerLevel: 19_000,
  }),
];

const tapPowerUpgrades: Upgrade[] = [
  createTapPowerUpgrade({
    id: "finger_training",
    name: "Finger Training",
    description: "Improves manual tap strength",
    baseCost: 120,
    costMultiplier: 1.14,
    maxLevel: 200,
    multiplierPerLevel: 1.05,
  }),
  createTapPowerUpgrade({
    id: "rhythm_drills",
    name: "Rhythm Drills",
    description: "Builds a faster, cleaner tapping cadence",
    baseCost: 2_400,
    costMultiplier: 1.145,
    maxLevel: 150,
    multiplierPerLevel: 1.07,
  }),
  createTapPowerUpgrade({
    id: "precision_gloves",
    name: "Precision Gloves",
    description: "Boosts manual taps with better control",
    baseCost: 7_500,
    costMultiplier: 1.16,
    maxLevel: 100,
    multiplierPerLevel: 1.09,
  }),
  createTapPowerUpgrade({
    id: "kinetic_wrists",
    name: "Kinetic Wrists",
    description: "Stores motion energy and releases stronger taps",
    baseCost: 180_000,
    costMultiplier: 1.165,
    maxLevel: 80,
    multiplierPerLevel: 1.11,
  }),
  createTapPowerUpgrade({
    id: "neural_exosuit",
    name: "Neural Exosuit",
    description: "Late-game manual boost for big tap spikes",
    baseCost: 9_500_000,
    costMultiplier: 1.17,
    maxLevel: 50,
    multiplierPerLevel: 1.13,
  }),
];

export const initialTapUpgrades: Upgrade[] = [
  ...autoTapUpgrades,
  ...tapPowerUpgrades,
].sort((a, b) => a.baseCost - b.baseCost);
