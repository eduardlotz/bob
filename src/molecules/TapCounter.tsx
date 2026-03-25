import { Text3D, Outlines } from "@react-three/drei";
import { useRef, useEffect, useMemo, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";
import { useCoreStore } from "@/store/core/store";
import { THEME_CONFIG } from "@/store/config/themes";
import { useFrame } from "@react-three/fiber";
import { ROUTE_PATHS, useAppStore } from "@/store";
import { format } from "d3-format";

const FONT_PATH = "/fonts/OpenRundeBold.json";

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

const AUTO_TAP_PAYOUT_INTERVAL = 0.25;
const FLOAT_EPSILON = 1e-9;

// TODO: move tap interval to debug / add method to let user choose
export const TapCounter = () => {
  const { taps, themes, previewMode, getAutoTapRate, addAutoTaps, isPaused } =
    useCoreStore();

  const { currentRoute } = useAppStore();

  const activeTheme = useMemo(
    () =>
      previewMode === "theme"
        ? themes.find((t) => t.preview)
        : themes.find((t) => t.active),
    [previewMode, themes],
  );

  const showAutoTapParticles = currentRoute === ROUTE_PATHS.HOME;

  const themeConfig = useMemo(() => {
    if (!activeTheme) {
      return THEME_CONFIG.DEFAULT;
    }

    return (
      Object.values(THEME_CONFIG).find((t) => t.id === activeTheme.id) ||
      THEME_CONFIG.DEFAULT
    );
  }, [activeTheme]);

  const formattedNumber = formatNumber(taps);
  const groupRef = useRef<Group>(null!);
  const pendingAutoTapsRef = useRef(0);
  const payoutTimerRef = useRef(0);

  const numberRef = useRef<Mesh>(null);
  const [numberWidth, setNumberWidth] = useState(0);

  useFrame((_, delta) => {
    if (isPaused) return;

    const autoTapRate = getAutoTapRate();
    if (autoTapRate <= 0) return;

    // Integrate rate over time and payout whole taps to avoid long-run drift.
    pendingAutoTapsRef.current += autoTapRate * delta;
    payoutTimerRef.current += delta;

    const shouldPayout =
      pendingAutoTapsRef.current + FLOAT_EPSILON >= 1 &&
      payoutTimerRef.current >= AUTO_TAP_PAYOUT_INTERVAL;
    if (!shouldPayout) return;

    const steps = Math.floor(pendingAutoTapsRef.current + FLOAT_EPSILON);
    if (steps <= 0) return;

    pendingAutoTapsRef.current -= steps;
    payoutTimerRef.current = 0;

    addAutoTaps(steps);
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

  const responsivePosition = useMemo(
    () => new Vector3(-numberWidth / 2 - 0.2, -1, -3),
    [numberWidth],
  );

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
