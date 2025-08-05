import { BackSide } from "three";
import { useGameStore } from "@/store/gameStore";
import { THEME_CONFIG } from "@/store/upgradesConfig";
import * as THREE from "three";
import { useMemo } from "react";
import { GradientTexture } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";

interface BackgroundPlanetProps {
  showOptions?: boolean;
}

export const BackgroundPlanet = ({
  showOptions = false,
}: BackgroundPlanetProps) => {
  const { currentTheme } = useGameStore();

  // Get theme colors, fallback to default if no theme is active
  const themeConfig = currentTheme
    ? Object.values(THEME_CONFIG).find((t) => t.id === currentTheme.id) ||
      THEME_CONFIG.DEFAULT
    : THEME_CONFIG.DEFAULT;

  const planetColors = [...themeConfig.planetColors];

  // Dynamic sphere scaling based on UI state
  const sphereScale = useMemo(() => {
    // When options are hidden: large sphere for more particle space
    // When options are open: smaller sphere for better fisheye effect
    return showOptions ? 6 : 12; // 2x larger when hidden
  }, [showOptions]);

  // Smooth spring animation for scale changes
  const { scale } = useSpring({
    scale: sphereScale,
    config: { tension: 200, friction: 20 },
    delay: 100, // Small delay to prevent jarring changes
  });

  return (
    <animated.mesh scale={scale}>
      <sphereGeometry args={[1.4, 32, 32]} />
      <meshBasicMaterial side={BackSide}>
        <GradientTexture
          stops={[0, 0.5, 1]}
          colors={planetColors}
          size={1024}
        />
      </meshBasicMaterial>
    </animated.mesh>
  );
};
