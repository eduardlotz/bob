export const SUPPORTED_LOCALES = ["de", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocalizedValue<T> = Record<Locale, T>;

export const DEFAULT_LOCALE: Locale = "de";

export const INTL_LOCALE_BY_ID: Record<Locale, string> = {
  de: "de-DE",
  en: "en-US",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "DE",
  en: "EN",
};
