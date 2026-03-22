import { useMemo } from "react";
import { motion } from "motion/react";
import {
  SegmentedControl,
  SegmentedOption,
  SegmentedThumb,
  SegmentedTrack,
} from "@/apps/ui";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n";

interface LocaleSegmentedControlProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  compact?: boolean;
}

export function LocaleSegmentedControl({
  value,
  onChange,
  compact = false,
}: LocaleSegmentedControlProps) {
  const activeIndex = useMemo(
    () => Math.max(0, SUPPORTED_LOCALES.indexOf(value)),
    [value],
  );

  return (
    <SegmentedControl
      style={{
        width: compact ? "6rem" : "100%",
        minWidth: compact ? "6rem" : undefined,
      }}
    >
      <SegmentedTrack>
        <SegmentedThumb
          animate={{ x: `${activeIndex * 100}%` }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
          style={{ width: `${100 / SUPPORTED_LOCALES.length}%` }}
        />

        {SUPPORTED_LOCALES.map((locale) => (
          <SegmentedOption
            key={locale}
            type="button"
            $active={value === locale}
            onClick={() => onChange(locale)}
            style={{
              fontSize: compact ? "0.875rem" : undefined,
              padding: compact ? "0.45rem 0" : undefined,
            }}
          >
            {LOCALE_LABELS[locale]}
          </SegmentedOption>
        ))}
      </SegmentedTrack>
    </SegmentedControl>
  );
}
