import { useMemo } from "react";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import {
  AnimatedSegmentedControl,
  type AnimatedSegmentedOption,
} from "@/components/AnimatedSegmentedControl";

interface LocaleSegmentedControlProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  compact?: boolean;
  layoutId?: string;
  theme?: "light" | "dark";
  labelForm?: "short" | "long";
}

export function LocaleSegmentedControl({
  value,
  onChange,
  compact = false,
  layoutId,
  theme = "light",
  labelForm = "long",
}: LocaleSegmentedControlProps) {
  const options = useMemo<AnimatedSegmentedOption<Locale>[]>(
    () =>
      SUPPORTED_LOCALES.map((locale) => ({
        value: locale,
        label: LOCALE_LABELS[locale][labelForm],
      })),
    [labelForm],
  );

  return (
    <AnimatedSegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      size={compact ? "sm" : "md"}
      fullWidth={!compact}
      layoutId={layoutId}
      style={{
        width: compact ? (labelForm === "short" ? "6rem" : "10.75rem") : "100%",
        minWidth: compact
          ? labelForm === "short"
            ? "6rem"
            : "10.75rem"
          : undefined,
      }}
      theme={theme}
    />
  );
}
