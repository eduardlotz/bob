import { create } from "zustand";

export type ThroneId = "links" | "journey" | "stack" | "vibes";

export const THRONE_ORDER: ThroneId[] = ["links", "journey", "stack", "vibes"];

interface SocialsStore {
  focusedThrone: ThroneId | null;
  setFocused: (id: ThroneId) => void;
  clearFocus: () => void;
}

export const useSocialsStore = create<SocialsStore>((set) => ({
  focusedThrone: null,
  setFocused: (id) => set({ focusedThrone: id }),
  clearFocus: () => set({ focusedThrone: null }),
}));
