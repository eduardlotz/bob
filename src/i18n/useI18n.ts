import { useMemo } from "react";
import { i18nRegistry } from "./registry";
import { useLocaleStore } from "./store";
import {
  formatCompactNumber,
  formatLocalizedDate,
  formatLocalizedNumber,
} from "./formatters";

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return useMemo(
    () => ({
      locale,
      setLocale,
      messages: i18nRegistry[locale],
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatLocalizedNumber(value, locale, options),
      formatCompactNumber: (value: number) => formatCompactNumber(value, locale),
      formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
        formatLocalizedDate(value, locale, options),
    }),
    [locale, setLocale],
  );
}
