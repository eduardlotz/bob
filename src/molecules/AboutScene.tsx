import { Html } from "@react-three/drei";
import { match } from "ts-pattern";
import { useGameStore } from "@/store/gameStore";
import { ROUTE_IDS } from "@/store";
import { THEME_COLORS, THEME_IDS } from "@/store/themeConfig";
import { TapCounter } from "./TapCounter";

export function AboutScene() {
  const { currentTheme, routes, taps } = useGameStore();

  // Get route-specific theme variation using constants
  const aboutRoute = routes.find((r) => r.id === ROUTE_IDS.ABOUT);
  const routeThemeVariation = aboutRoute?.themeVariation;

  const themeColors = match(currentTheme?.id)
    .with(THEME_IDS.DARK, () => THEME_COLORS[THEME_IDS.DARK])
    .with(THEME_IDS.PASTEL, () => THEME_COLORS[THEME_IDS.PASTEL])
    .with(THEME_IDS.NEON, () => THEME_COLORS[THEME_IDS.NEON])
    .otherwise(() => THEME_COLORS[THEME_IDS.DEFAULT]);

  return (
    <group>
      {/* Tap counter for About scene */}
      <TapCounter tapCount={taps} />

      <Html position={[0, 0, 0]}>
        <div
          style={{
            color: "white",
            fontSize: "24px",
            textShadow: `0 0 10px ${themeColors.accent}`,
          }}
        >
          About Scene - Coming Soon!
        </div>
      </Html>
    </group>
  );
}
