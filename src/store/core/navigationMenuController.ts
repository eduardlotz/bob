import type { StoreApi } from "zustand/vanilla";
import type { NavigationMenuState } from "./navigationMenu";

interface MenuViewState {
  currentView: string;
  resetToDefaultView: () => void;
}

/** Coordinate exits without a render effect or interrupting an explicit new view. */
export function connectNavigationMenu(
  menu: Pick<StoreApi<NavigationMenuState>, "getState" | "subscribe">,
  view: Pick<StoreApi<MenuViewState>, "getState" | "subscribe">,
) {
  const unsubscribeView = view.subscribe((state, previous) => {
    if (previous.currentView === "navigation" && state.currentView !== "navigation") {
      menu.getState().closeOptionsWithAnimation();
    }
  });
  const unsubscribeMenu = menu.subscribe((state, previous) => {
    if (previous.showOptions && !state.showOptions && view.getState().currentView === "navigation") {
      view.getState().resetToDefaultView();
    }
  });
  return () => {
    unsubscribeView();
    unsubscribeMenu();
  };
}
