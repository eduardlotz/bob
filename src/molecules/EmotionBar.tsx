import { Text3D, Outlines } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import { THEME_CONFIG } from "@/store/upgradesConfig";

const FONT_PATH = "/fonts/OpenRundeBold.json";

const formatNumber = (num: number): string => {
  if (num < 10000) {
    // For numbers below 10k, use German locale formatting (dots for thousands)
    return num.toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // This will floor the decimals
    });
  } else if (num < 1000000) {
    // For numbers 10k to 1M, convert to K format
    // Floor to the nearest hundred first
    const flooredToHundreds = Math.floor(num / 100) * 100;
    const inK = flooredToHundreds / 1000;

    // Format with one decimal place and use dot as decimal separator
    const formatted = inK.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    // Replace comma with dot for German formatting (though there shouldn't be commas in K format)
    return formatted.replace(/,/g, ".") + "K";
  } else if (num < 1000000000) {
    // For numbers 1M to 1B, convert to M format
    // Floor to the nearest thousand first
    const flooredToThousands = Math.floor(num / 1000) * 1000;
    const inM = flooredToThousands / 1000000;

    // Format with one decimal place and use dot as decimal separator
    const formatted = inM.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    // Replace comma with dot for German formatting
    return formatted.replace(/,/g, ".") + "M";
  } else {
    // For numbers 1B and above, convert to B format
    // Floor to the nearest million first
    const flooredToMillions = Math.floor(num / 1000000) * 1000000;
    const inB = flooredToMillions / 1000000000;

    // Format with one decimal place and use dot as decimal separator
    const formatted = inB.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    // Replace comma with dot for German formatting
    return formatted.replace(/,/g, ".") + "B";
  }
};

export const EmotionCounter = ({ tapCount }: { tapCount: number }) => {
  const PAD_LENGTH = 0;
  const { taps, currentTheme } = useGameStore();

  // Use game store taps instead of emotion tap count
  const gameTapCount = taps;

  // Get theme colors, fallback to default if no theme is active
  const themeConfig = currentTheme
    ? Object.values(THEME_CONFIG).find((t) => t.id === currentTheme.id) ||
      THEME_CONFIG.DEFAULT
    : THEME_CONFIG.DEFAULT;
  const formattedNumber = formatNumber(gameTapCount);
  const groupRef = useRef<Group>(null!);
  const prevTapCount = useRef(gameTapCount);

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

  const responsivePosition = new Vector3(-numberWidth / 2, -1, -2);

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 },
  }));

  // Floating animation for each character
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      // Base floating motion
      const baseFloat = Math.sin(time * 0.5) * 0.05;
      groupRef.current.position.y = responsivePosition.y + baseFloat;

      // Gentle rotation
      groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.02;

      // Additional subtle movement
      const subtleX = Math.sin(time * 0.2) * 0.02;
      groupRef.current.position.x = responsivePosition.x + subtleX;
    }
  });

  useEffect(() => {
    if (gameTapCount !== prevTapCount.current) {
      api.start({
        scale: 1.4,
        immediate: true,
      });
      api.start({
        scale: 1,
        config: { tension: 300, friction: 15 },
      });
      prevTapCount.current = gameTapCount;
    }
  }, [gameTapCount]);

  return (
    <a.group ref={groupRef} scale={spring.scale} position={responsivePosition}>
      <Text3D
        font={FONT_PATH}
        size={3}
        height={1.5}
        curveSegments={32}
        letterSpacing={-0.15}
        bevelEnabled={true}
        bevelSize={0.03}
        bevelThickness={0.2}
        bevelSegments={6}
        ref={numberRef}
      >
        {formattedNumber}
        <meshToonMaterial
          color={themeConfig.counterColor}
          emissive={themeConfig.counterColor}
          emissiveIntensity={themeConfig.counterEmission}
        />
        <Outlines thickness={0.011} color="black" screenspace />
      </Text3D>
    </a.group>
  );
};
