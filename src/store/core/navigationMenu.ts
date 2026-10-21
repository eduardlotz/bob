export const MENU_CLOSE_DURATION_MS = 200;

export interface NavigationMenuState {
  showOptions: boolean;
  isOptionsClosing: boolean;
  setShowOptions: (show: boolean) => void;
  openOptions: () => void;
  closeOptionsWithAnimation: () => void;
  toggleOptions: () => void;
}

/** Own the entire menu lifecycle, including cancellation of an interrupted exit. */
export function createNavigationMenuState(
  set: (state: Partial<NavigationMenuState>) => void,
  get: () => NavigationMenuState,
): NavigationMenuState {
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelClose = () => {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  };

  return {
    showOptions: false,
    isOptionsClosing: false,
    setShowOptions: (show) => {
      cancelClose();
      set({ showOptions: show, isOptionsClosing: false });
    },
    openOptions: () => get().setShowOptions(true),
    closeOptionsWithAnimation: () => {
      if (!get().showOptions || get().isOptionsClosing) return;
      closeTimer = setTimeout(() => {
        closeTimer = undefined;
        set({ showOptions: false, isOptionsClosing: false });
      }, MENU_CLOSE_DURATION_MS);
      set({ isOptionsClosing: true });
    },
    toggleOptions: () => {
      const state = get();
      if (state.showOptions && !state.isOptionsClosing) {
        state.closeOptionsWithAnimation();
      } else {
        state.openOptions();
      }
    },
  };
}
