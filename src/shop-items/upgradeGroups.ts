import type { Upgrade } from "@/store";
import { calculateUpgradeCost } from "./upgradeMath";

export const UPGRADE_GROUPS = [
  { value: "1", ids: ["auto_tap", "finger_training", "bob_assistant"] },
  { value: "2", ids: ["rhythm_drills", "garden_gnome", "precision_gloves"] },
  { value: "3", ids: ["greenhouse", "kinetic_wrists", "factory_line"] },
  { value: "4", ids: ["neural_exosuit", "logistics_hub", "quantum_lab", "temporal_engine"] },
] as const;

export type UpgradeGroup = (typeof UPGRADE_GROUPS)[number]["value"];

export function getRevealedUpgradeGroup(upgrades: Upgrade[], taps: number, savedGroup = 2) {
  let revealed = Math.max(2, Math.min(UPGRADE_GROUPS.length, savedGroup));
  for (const group of UPGRADE_GROUPS.slice(2)) {
    const firstUpgrade = upgrades.find((upgrade) => upgrade.id === group.ids[0]);
    const hasPurchased = upgrades.some((upgrade) =>
      (group.ids as readonly string[]).includes(upgrade.id) && upgrade.level > 0,
    );
    if (hasPurchased || (firstUpgrade && taps >= calculateUpgradeCost(firstUpgrade))) {
      revealed = Math.max(revealed, Number(group.value));
    }
  }
  return revealed;
}

// Each visible group starts with its first card; purchases reveal its successors.
export function getRevealedUpgrades(upgrades: Upgrade[], revealedGroup = 2) {
  const ordered = UPGRADE_GROUPS.flatMap((group) =>
    group.ids.flatMap((id) => upgrades.filter((upgrade) => upgrade.id === id)),
  );
  const firstRevealedIds = UPGRADE_GROUPS.slice(0, revealedGroup).map((group) => group.ids[0] as string);
  return ordered.filter((upgrade, index) =>
    firstRevealedIds.includes(upgrade.id) || upgrade.level > 0 || (index > 0 && ordered[index - 1].level > 0),
  );
}
