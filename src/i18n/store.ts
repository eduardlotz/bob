import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type Locale } from "./types";

interface LocaleStore {
  locale: Locale;
  isHydrated: boolean;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      isHydrated: false,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "locale-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isHydrated = true;
      },
    },
  ),
);

export const getLocale = (): Locale => useLocaleStore.getState().locale;
