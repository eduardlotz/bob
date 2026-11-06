import { Text3D } from "@react-three/drei";
import { useRef, useEffect, useMemo, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";
import { useCoreStore } from "@/store/core/store";
import { useShallow } from "zustand/react/shallow";
import { THEME_CONFIG } from "@/store/config/themes";
import { formatNumber } from "@/utils/formatNumber";

const FONT_PATH = "/fonts/OpenRundeBoldCounter.json";

/** Home-only presentation; route-independent earnings live in AutoTapController. */
export const TapCounter = () => {
  const {
    taps,
    themes,
    previewMode,
    reducedTapMotion,
  } = useCoreStore(useShallow(state => ({
    taps: state.taps,
    themes: state.themes,
    previewMode: state.previewMode,
    reducedTapMotion: state.graphicPreferences.reducedTapMotion,
  })));

  const activeTheme = useMemo(
    () =>
      previewMode === "theme"
        ? themes.find((t) => t.preview)
        : themes.find((t) => t.active),
    [previewMode, themes],
  );

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

  const numberRef = useRef<Mesh>(null);
  const [numberWidth, setNumberWidth] = useState(0);

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
    if (reducedTapMotion) {
      api.start({
        scale: [1, 1, 1],
        immediate: true,
      });
      return;
    }

    if (taps === 0) return;

    // maybe toggle in options for more sound while autoplaying
    // needs additional check so it does not play double when manually tapping
    // playTapSound();

    api.start({
      from: { scale: [1.4, 1.8, 1.2] },
      to: { scale: [1, 1, 1] },
      immediate: false,
    });
  }, [taps, api, reducedTapMotion]);

  return (
    <a.group userData={{ foregroundOutline: "counter" }} ref={groupRef} scale={spring.scale as any}>
      <a.group position={responsivePosition}>
        <Text3D
          font={FONT_PATH}
          size={3}
          height={1.5}
          curveSegments={6}
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
        </Text3D>
      </a.group>
    </a.group>
  );
};
