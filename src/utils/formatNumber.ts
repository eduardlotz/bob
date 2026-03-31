import { format } from "d3-format";

const GERMAN_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const D3_SI_ORDER = "kMGTPEZY";
const SI_SUFFIXES = [
  "", // 10^0
  "K", // 10^3
  "M", // 10^6
  "B", // 10^9
  "T", // 10^12
  "Q", // 10^15
  "Qi", // 10^18
  "Sx", // 10^21
  "Sp", // 10^24
  "Oc", // 10^27
  "No", // 10^30
  "Dc", // 10^33
] as const;

const d3Formatter = format(".3~s");

export const formatNumber = (num: number): string => {
  const absolute = Math.abs(num);

  if (absolute < 10_000) {
    return GERMAN_FORMATTER.format(Math.floor(num));
  }

  const formatted = d3Formatter(num);

  return formatted.replace(/([a-zA-Z]+)/g, (si) => {
    const index = D3_SI_ORDER.indexOf(si[0]);
    return index >= 0 ? (SI_SUFFIXES[index + 1] ?? si) : si;
  });
};
