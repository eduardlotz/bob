import { Upgrade } from "@/store";

type UpgradeTierConfig = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effectValue: number;
};

const createUpgrade = (
  type: Upgrade["effect"]["type"],
  config: UpgradeTierConfig,
): Upgrade => ({
  id: config.id,
  name: config.name,
  description: config.description,
  baseCost: config.baseCost,
  costMultiplier: config.costMultiplier,
  level: 0,
  maxLevel: config.maxLevel,
  effect: { type, value: config.effectValue },
  unlocked: true,
});

const autoTapUpgradeConfigs: UpgradeTierConfig[] = [
  {
    id: "auto_tap",
    name: "Tapper",
    description: "Sorgt fuer einen konstanten passiven Tap-Strom",
    baseCost: 15,
    costMultiplier: 1.16,
    maxLevel: 40,
    effectValue: 1,
  },
  {
    id: "bob_assistant",
    name: "Super-Tapper",
    description: "Ein starker Helfer fuer die ersten Auto-Taps",
    baseCost: 250,
    costMultiplier: 1.17,
    maxLevel: 35,
    effectValue: 4,
  },
  {
    id: "garden_gnome",
    name: "Mega-Tapper",
    description: "Bringt dein Midgame sauber in Schwung",
    baseCost: 2_500,
    costMultiplier: 1.18,
    maxLevel: 30,
    effectValue: 18,
  },
  {
    id: "greenhouse",
    name: "Ultra-Tapper",
    description: "Eine verlässliche Auto-Tap Fabrik fuer groessere Spruenge",
    baseCost: 25_000,
    costMultiplier: 1.19,
    maxLevel: 26,
    effectValue: 80,
  },
  {
    id: "factory_line",
    name: "Hyper-Tapper",
    description: "Schwere Automatisierung fuer das spaetere Spiel",
    baseCost: 250_000,
    costMultiplier: 1.2,
    maxLevel: 22,
    effectValue: 360,
  },
  {
    id: "logistics_hub",
    name: "Giga-Tapper",
    description: "Ein grosses passives Netzwerk fuer hohe Zahlen",
    baseCost: 2_500_000,
    costMultiplier: 1.21,
    maxLevel: 18,
    effectValue: 1_600,
  },
  {
    id: "quantum_lab",
    name: "Quantum-Tapper",
    description: "Ein spaeter Produktionssprung fuer massives Einkommen",
    baseCost: 25_000_000,
    costMultiplier: 1.22,
    maxLevel: 14,
    effectValue: 7_500,
  },
  {
    id: "temporal_engine",
    name: "Temporal-Tapper",
    description: "Endgame-Maschine fuer absurd hohe Auto-Tap Werte",
    baseCost: 300_000_000,
    costMultiplier: 1.23,
    maxLevel: 10,
    effectValue: 38_000,
  },
];

const tapPowerUpgradeConfigs: UpgradeTierConfig[] = [
  {
    id: "finger_training",
    name: "Finger Training",
    description: "Hebt deine manuelle Tap-Staerke frueh und klar an",
    baseCost: 60,
    costMultiplier: 1.15,
    maxLevel: 25,
    effectValue: 1.12,
  },
  {
    id: "rhythm_drills",
    name: "Rhythm Drills",
    description: "Macht deinen Takt sauberer und jeden Tap wertvoller",
    baseCost: 900,
    costMultiplier: 1.16,
    maxLevel: 22,
    effectValue: 1.15,
  },
  {
    id: "precision_gloves",
    name: "Precision Gloves",
    description: "Mehr Kontrolle, mehr Wucht, deutlich staerkere Klicks",
    baseCost: 9_000,
    costMultiplier: 1.17,
    maxLevel: 18,
    effectValue: 1.19,
  },
  {
    id: "kinetic_wrists",
    name: "Kinetic Wrists",
    description: "Laden Bewegungsenergie fuer grosse Power-Spikes auf",
    baseCost: 90_000,
    costMultiplier: 1.18,
    maxLevel: 14,
    effectValue: 1.24,
  },
  {
    id: "neural_exosuit",
    name: "Neural Exosuit",
    description: "Spaete manuelle Power fuer extreme Einzel-Taps",
    baseCost: 1_200_000,
    costMultiplier: 1.19,
    maxLevel: 10,
    effectValue: 1.32,
  },
];

export const initialTapUpgrades: Upgrade[] = [
  ...autoTapUpgradeConfigs.map((config) => createUpgrade("autoTap", config)),
  ...tapPowerUpgradeConfigs.map((config) =>
    createUpgrade("tapMultiplier", config),
  ),
].sort((a, b) => a.baseCost - b.baseCost);
