import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ThroneId } from "@/3d-objects/socials/data";

interface SocialsStore {
  focusedThrone: ThroneId | null;
  setFocused: (id: ThroneId) => void;
  clearFocus: () => void;
}

export const useSocialsStore = create<SocialsStore>()(
  persist(
    (set) => ({
      focusedThrone: null,
      setFocused: (id) => set({ focusedThrone: id }),
      clearFocus: () => set({ focusedThrone: null }),
    }),
    {
      name: "socials-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        focusedThrone: state.focusedThrone === "socials" ? state.focusedThrone : null,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SocialsStore> | undefined;
        return {
          ...currentState,
          focusedThrone:
            persisted?.focusedThrone === "socials" ? persisted.focusedThrone : null,
        };
      },
    },
  ),
);
