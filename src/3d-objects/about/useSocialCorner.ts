import { useViewStore, useAppStore } from "@/store";
import { useVinylStore } from "@/store/vinyls";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useQuestActions } from "@/hooks/useQuestSystem";

/** A click that enters a corner can never also activate an item in that corner. */
export function useSocialCorner(viewId: "socials" | "computer" = "socials") {
  const { playUISound } = useSoundSystem();
  const { triggerQuest } = useQuestActions();
  return () => {
    const view = useViewStore.getState();
    if (useAppStore.getState().showOptions || useVinylStore.getState().selected !== null) return false;
    if (view.currentView !== viewId) {
      triggerQuest("click_socials", 1);
      playUISound("ui-tap-2");
      view.transitionToView(viewId);
      return false;
    }
    return !view.isTransitioning;
  };
}
