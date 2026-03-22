import { getLocale } from "./store";
import { INTL_LOCALE_BY_ID, type Locale } from "./types";

export const formatLocalizedNumber = (
  value: number,
  locale: Locale = getLocale(),
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat(INTL_LOCALE_BY_ID[locale], options).format(value);

export const formatLocalizedDate = (
  value: Date | number,
  locale: Locale = getLocale(),
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  },
) =>
  new Intl.DateTimeFormat(INTL_LOCALE_BY_ID[locale], options).format(
    value instanceof Date ? value : new Date(value),
  );

export const formatCompactNumber = (
  value: number,
  locale: Locale = getLocale(),
): string => {
  const absolute = Math.abs(value);

  if (absolute < 10_000) {
    return formatLocalizedNumber(Math.floor(value), locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  const compactUnits =
    locale === "de"
      ? [
          { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: " Mrd." },
          { threshold: 1_000_000, divisor: 1_000_000, suffix: " Mio." },
          { threshold: 1_000, divisor: 1_000, suffix: " Tsd." },
        ]
      : [
          { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: "B" },
          { threshold: 1_000_000, divisor: 1_000_000, suffix: "M" },
          { threshold: 1_000, divisor: 1_000, suffix: "K" },
        ];

  const unit =
    compactUnits.find((entry) => absolute >= entry.threshold) ??
    compactUnits[compactUnits.length - 1];
  const decimals = unit.divisor >= 1_000_000 ? 1_000 : 100;
  const floored = Math.floor(value / decimals) * decimals;
  const compactValue = floored / unit.divisor;

  return `${formatLocalizedNumber(compactValue, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}${unit.suffix}`;
};
