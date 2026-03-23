import { create } from "zustand";

import type { ThroneId } from "@/3d-objects/socials/data";

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
