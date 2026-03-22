import { Text3D, Outlines } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";
import { useCoreStore } from "@/store/core/store";
import { THEME_CONFIG } from "@/store/config/themes";
import { useFrame } from "@react-three/fiber";
import { playTapSound } from "@/utils/soundSystem";
import { ROUTE_PATHS, useAppStore } from "@/store";

const FONT_PATH = "/fonts/OpenRundeBold.json";

// TODO: replace formatting with this d3-format example for bigger numbers
// import { format } from "d3-format";

// const SI_SUFFIXES = [
//   "",   // 10^0
//   "K",  // 10^3
//   "M",  // 10^6
//   "B",  // 10^9
//   "T",  // 10^12
//   "Qa", // 10^15
//   "Qi", // 10^18
//   "Sx", // 10^21
//   "Sp", // 10^24
//   "Oc", // 10^27
//   "No", // 10^30
//   "Dc", // 10^33
// ];

// const d3Formatter = format(".1~s");

// export const formatNumber = (num: number): string => {
//   if (num < 10_000) {
//     return num.toLocaleString("de-DE", { maximumFractionDigits: 0 });
//   }

//   const formatted = d3Formatter(num); // e.g. "1.23M", "4.5G"

//   return formatted.replace(
//     /([a-zA-Z]+)/,
//     (si) => SI_SUFFIXES["kMGTPEZY".indexOf(si[0]) + 1] ?? si
//   );
// };

const ENGLISH_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ENGLISH_COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const COMPACT_UNITS = [
  { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: "B" },
  { threshold: 1_000_000, divisor: 1_000_000, suffix: "M" },
  { threshold: 1_000, divisor: 1_000, suffix: "K" },
] as const;

export const formatNumber = (num: number): string => {
  const absolute = Math.abs(num);

  if (absolute < 10_000) {
    return ENGLISH_NUMBER_FORMATTER.format(Math.floor(num));
  }

  const unit =
    COMPACT_UNITS.find((entry) => absolute >= entry.threshold) ??
    COMPACT_UNITS[COMPACT_UNITS.length - 1];
  const decimals = unit.divisor >= 1_000_000 ? 1_000 : 100;
  const floored = Math.floor(num / decimals) * decimals;
  const compactValue = floored / unit.divisor;

  return `${ENGLISH_COMPACT_FORMATTER.format(compactValue)}${unit.suffix}`;
};

const BASE_INTERVAL = 1; // min: 1 bounce per second
const MIN_INTERVAL = 0.25; // max: 4 bounces per second

let accumulator = 0;

// TODO: move tap interval to debug / add method to let user choose
export const TapCounter = () => {
  const { taps, themes, previewMode, getAutoTapRate, addAutoTaps, isPaused } =
    useCoreStore();

  const { currentRoute } = useAppStore();

  const activeTheme =
    previewMode === "theme"
      ? themes.find((t) => t.preview)
      : themes.find((t) => t.active);

  const showAutoTapParticles = currentRoute === ROUTE_PATHS.HOME;

  const themeConfig = activeTheme
    ? Object.values(THEME_CONFIG).find((t) => t.id === activeTheme.id) ||
      THEME_CONFIG.DEFAULT
    : THEME_CONFIG.DEFAULT;

  const formattedNumber = formatNumber(taps);
  const groupRef = useRef<Group>(null!);

  const numberRef = useRef<Mesh>(null);
  const [numberWidth, setNumberWidth] = useState(0);

  useFrame((_, delta) => {
    if (isPaused) return;

    if (getAutoTapRate() <= 0) return;

    // higher level → smaller interval
    const interval = Math.max(
      MIN_INTERVAL,
      BASE_INTERVAL / Math.max(1, getAutoTapRate()),
    );

    accumulator += delta;

    if (accumulator < interval) return;

    const steps = Math.floor(accumulator / interval);
    accumulator -= steps * interval;

    addAutoTaps(steps * getAutoTapRate() * interval);
    // playTapSound();

    if (showAutoTapParticles && (window as any).createTapParticles) {
      (window as any).createTapParticles(0, 0.5, -2, 15);
    }
  });

  useEffect(() => {
    if (!numberRef.current) return;

    const geometry = numberRef.current.geometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    const width = box.max.x - box.min.x;
    setNumberWidth(width);
  }, [formattedNumber]);

  const responsivePosition = new Vector3(-numberWidth / 2 - 0.2, -1, -3);

  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    config: { tension: 300, friction: 10 },
  }));

  useEffect(() => {
    if (taps === 0) return;

    // maybe toggle in options for more sound while autoplaying
    // needs additional check so it does not play double when manually tapping
    // playTapSound();

    api.start({
      from: { scale: [1.4, 1.8, 1.2] },
      to: { scale: [1, 1, 1] },
      immediate: false,
    });
  }, [taps, api]);

  return (
    <a.group ref={groupRef} scale={spring.scale as any}>
      <a.group position={responsivePosition}>
        <Text3D
          font={FONT_PATH}
          size={3}
          height={1.5}
          curveSegments={8}
          castShadow
          letterSpacing={-0.15}
          bevelEnabled={true}
          bevelSize={0.03}
          bevelThickness={0.2}
          bevelSegments={1}
          ref={numberRef}
        >
          {formattedNumber}
          <meshToonMaterial color={themeConfig.counterColor} />
          <Outlines
            thickness={0.02}
            color={themeConfig.outlineColor}
            screenspace
          />
        </Text3D>
      </a.group>
    </a.group>
  );
};
