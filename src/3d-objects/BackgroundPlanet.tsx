import { BackSide } from "three";
import { useGameStore } from "@/store/gameStore";
import { THEME_CONFIG } from "@/store/themeConfig";
import { GradientTexture } from "@react-three/drei";

export const BackgroundPlanet = () => {
  const { currentTheme, themes, previewMode } = useGameStore();

  const activeTheme =
    previewMode === "theme" ? themes.find((t) => t.preview) : currentTheme;

  const themeConfig = activeTheme
    ? Object.values(THEME_CONFIG).find((t) => t.id === activeTheme.id) ||
      THEME_CONFIG.DEFAULT
    : THEME_CONFIG.DEFAULT;

  const planetColors = [...themeConfig.planetColors];

  return (
    <mesh>
      <sphereGeometry args={[100, 16, 16]} />
      <meshBasicMaterial side={BackSide}>
        <GradientTexture
          stops={[0, 0.5, 1]}
          colors={planetColors}
          size={1024}
        />
      </meshBasicMaterial>
    </mesh>
  );
};
