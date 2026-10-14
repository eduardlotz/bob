import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as T from "three";
import type { WorldSceneConfig } from "@/store";

/** Match the sky gradient at its equator without fogging the sky dome itself. */
export function WorldFog({ config }: { config: WorldSceneConfig }) {
  const scene = useThree((state) => state.scene);
  const enabled = !config.effects.includes("default_grid") &&
    !config.starfield && !config.models.some((id) => id.startsWith("space_") || id === "moon_craters");
  const [top, middle, bottom] = config.gradientColors;
  const [start, stop, end] = config.gradientStops;
  const fog = useMemo(() => {
    if (!enabled) return null;
    const color = new T.Color(top).lerp(new T.Color(middle), T.MathUtils.clamp((0.5 - start) / (stop - start), 0, 1));
    color.lerp(new T.Color(bottom), T.MathUtils.clamp((0.5 - stop) / (end - stop), 0, 1));
    return new T.Fog(color, 12, 60);
  }, [enabled, top, middle, bottom, start, stop, end]);
  useLayoutEffect(() => {
    const previous = scene.fog;
    scene.fog = fog;
    return () => { scene.fog = previous; };
  }, [scene, fog]);
  return null;
}
