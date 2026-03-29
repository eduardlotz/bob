type UpgradeEffectType = "autoTap" | "tapMultiplier";

type UpgradeMathInput = {
  baseCost: number;
  costMultiplier: number;
  level: number;
  effect: {
    type: UpgradeEffectType;
    value: number;
  };
};

type UpgradeCostInput = Pick<UpgradeMathInput, "baseCost" | "costMultiplier">;
type UpgradeCostAtLevelInput = UpgradeCostInput & { level: number };

const getCostRoundingStep = (value: number): number => {
  if (value < 100) return 5;
  if (value < 1_000) return 10;
  if (value < 10_000) return 50;
  if (value < 100_000) return 100;
  if (value < 1_000_000) return 500;
  if (value < 10_000_000) return 1_000;
  if (value < 100_000_000) return 5_000;
  if (value < 1_000_000_000) return 10_000;
  if (value < 10_000_000_000) return 50_000;

  const exponent = Math.max(1, Math.floor(Math.log10(value)) - 4);
  return Math.pow(10, exponent) * 5;
};

const roundUpgradeCost = (value: number): number => {
  const step = getCostRoundingStep(value);
  return Math.ceil(value / step) * step;
};

export const calculateUpgradeCostAtLevel = ({
  baseCost,
  costMultiplier,
  level,
}: UpgradeCostAtLevelInput): number => {
  const rawCost = baseCost * Math.pow(costMultiplier, level);
  return roundUpgradeCost(rawCost);
};

export const calculateUpgradeCost = ({
  baseCost,
  costMultiplier,
  level,
}: UpgradeCostAtLevelInput): number => {
  return calculateUpgradeCostAtLevel({ baseCost, costMultiplier, level });
};

export const calculateAutoTapRate = (upgrades: UpgradeMathInput[]): number => {
  let total = 0;

  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    if (upgrade.effect.type !== "autoTap" || upgrade.level <= 0) continue;

    total += upgrade.effect.value * upgrade.level;
  }

  return total;
};

export const calculateTapMultiplier = (
  upgrades: UpgradeMathInput[],
): number => {
  let total = 1;

  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    if (upgrade.effect.type !== "tapMultiplier" || upgrade.level <= 0) continue;

    total *= Math.pow(upgrade.effect.value, upgrade.level);
  }

  return total;
};
