import { Text3D, Outlines } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import { THEME_CONFIG } from "@/store/themeConfig";

const FONT_PATH = "/fonts/OpenRundeBold.json";

export const formatNumber = (num: number): string => {
  if (num < 10000) {
    // number below 10k, use German locale formatting (dots for thousands)
    return num.toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // This will floor the decimals
    });
  } else if (num < 1000000) {
    // number 10k to 1M, convert to nearest hundred in K format
    const flooredToHundreds = Math.floor(num / 100) * 100;
    const inK = flooredToHundreds / 1000;

    const formatted = inK.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return formatted.replace(/,/g, ".") + "K";
  } else if (num < 1000000000) {
    // number 1M to 1B, convert to nearest thousand in M format
    const flooredToThousands = Math.floor(num / 1000) * 1000;
    const inM = flooredToThousands / 1000000;

    const formatted = inM.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return formatted.replace(/,/g, ".") + "M";
  } else {
    // number 1B and above, convert to nearest million in B format
    const flooredToMillions = Math.floor(num / 1000000) * 1000000;
    const inB = flooredToMillions / 1000000000;

    const formatted = inB.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return formatted.replace(/,/g, ".") + "B";
  }
};

export const TapCounter = () => {
  const { taps, currentTheme } = useGameStore();

  const gameTapCount = taps;

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

  const responsivePosition = new Vector3(-numberWidth / 2 - 0.2, -1, -3);

  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    config: { tension: 300, friction: 10 },
  }));

  // MAYDO: test if by-passing react render is better
  // best practice would be useEffect to handle animation updates with dependencies
  // but manually tapping while auto-tap is active feels better when the update is in useFrame 🤷

  useFrame(() => {
    // hide counter until first few taps?
    // if (gameTapCount === 0) {
    //   api.start({
    //     scale: [0, 0, 0],
    //     immediate: true,
    //   });
    // }

    if (gameTapCount !== prevTapCount.current) {
      api.start({
        scale: [1.4, 1.8, 1.2],
        immediate: true,
      });
      api.start({
        scale: [1, 1, 1],
        config: { tension: 300, friction: 15 },
      });
      prevTapCount.current = gameTapCount;
    }
  });

  return (
    <a.group
      ref={groupRef}
      scale={spring.scale.get() as [number, number, number]}
      position={responsivePosition.add(new Vector3(-1, 0, 0))}
    >
      <Text3D
        font={FONT_PATH}
        size={3}
        height={1.5}
        curveSegments={8}
        letterSpacing={-0.15}
        bevelEnabled={true}
        bevelSize={0.03}
        bevelThickness={0.2}
        bevelSegments={1}
        ref={numberRef}
        position={[1, 0, 0]}
      >
        {formattedNumber}
        <meshToonMaterial color={themeConfig.counterColor} />
        <Outlines
          thickness={0.011}
          color={themeConfig.outlineColor}
          screenspace
        />
      </Text3D>
    </a.group>
  );
};
