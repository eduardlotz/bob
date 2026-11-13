import { useViewStore, useAppStore, useBooksStore } from "@/store";
import { useVinylStore } from "@/store/vinyls";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useQuestActions } from "@/hooks/useQuestSystem";

/** A click that enters a corner can never also activate an item in that corner. */
export function useSocialCorner(viewId: "socials" | "computer" | "lounge" | "bookshelf" = "socials") {
  const { playUISound } = useSoundSystem();
  const { triggerQuest } = useQuestActions();
  return () => {
    const view = useViewStore.getState();
    if (view.isTransitioning || view.isPhoneView() || useAppStore.getState().showOptions || useVinylStore.getState().selected !== null || useBooksStore.getState().focusedBook) return false;
    if (view.currentView !== viewId) {
      triggerQuest(viewId === "bookshelf" ? "click_books" : viewId === "lounge" ? "click_lounge" : "click_socials", 1);
      playUISound("ui-tap-2");
      view.transitionToView(viewId);
      return false;
    }
    return !view.isTransitioning;
  };
}
