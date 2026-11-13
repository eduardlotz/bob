import { BOB_SKINS, getBobSkin, isBobSkinAvailable, isBobSkinUnlocked, type SkinId } from "@/components/bob/skins/registry";
import type { Locale } from "@/i18n/types";
import type { Quest } from "@/store/core/quests/types";

export interface SkinShopItem {
  id: string;
  skinId: SkinId;
  name: string;
  type: "skin";
  cost: number;
  purchased: boolean;
  enabled: boolean;
  unlocked: boolean;
  questReward: boolean;
}

/** Quest rewards retain their gates; paid skins use the player's saved purchases. */
export function getSkinShopItems(selectedId: SkinId, quests: readonly Pick<Quest, "id" | "stackId" | "completed">[], locale: Locale, purchased: readonly SkinId[] = []): SkinShopItem[] {
  const selected = getBobSkin(selectedId);
  const activeId = isBobSkinAvailable(selected, quests, purchased) ? selected.id : "white";
  return BOB_SKINS.map(skin => {
    const unlocked = isBobSkinUnlocked(skin, quests);
    return { id: `skin:${skin.id}`, skinId: skin.id, name: skin.name[locale], type: "skin", questReward: !!skin.unlock && !skin.cost, cost: skin.cost ?? 0, purchased: isBobSkinAvailable(skin, quests, purchased), enabled: skin.id === activeId, unlocked };
  });
}

export const isSkinShopItem = (item: { type: string }): item is SkinShopItem => item.type === "skin";
