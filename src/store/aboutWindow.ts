import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Room-local acoustics and sash position survive route changes and browser visits. */
export const useAboutWindowStore = create<{ open: boolean; toggle: () => void }>()(
  persist(set => ({ open: true, toggle: () => set(state => ({ open: !state.open })) }), {
    name: "about-room-window",
    partialize: state => ({ open: state.open }),
  }),
);
