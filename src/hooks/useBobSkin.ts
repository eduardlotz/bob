import { useCoreStore } from "@/store/core/store";
import { useQuestStore } from "@/store/core/quests/store";
import { resolveBobSkin } from "@/components/bob/skins/registry";

/** Hydration and quest resets never briefly equip an unearned skin. */
export function useBobSkin() {
  const id = useCoreStore(state => state.bobSkinId);
  const previewId = useCoreStore(state => state.previewMode === "skin" ? state.bobSkinPreviewId : null);
  const purchased = useCoreStore(state => state.purchasedBobSkinIds);
  // Quest progress changes every tap. Only an actual unlock changes the skin.
  return useQuestStore(state => resolveBobSkin(id, state.quests, previewId, purchased));
}
