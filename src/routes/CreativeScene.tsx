import { ImageOrbit } from "@/components/ImageOrbit";
import { ROUTE_PATHS, useGameStore, useViewStore } from "@/store";
import { DEFAULT_SOUND_CONFIGS } from "@/utils/sound/configs";
import {
  playWorldSound,
  stopAllSounds,
  stopAllWorldSounds,
} from "@/utils/soundSystem";
import { Stars } from "@react-three/drei";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function CreativeScene() {
  const { checkUnlockedRoutes } = useGameStore();
  const { transitionToView, setDefaultViewMode } = useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.CREATIVE);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  useEffect(() => {
    transitionToView("creative");
    setDefaultViewMode("object");
    playWorldSound("pink-noise");
  }, []);

  return (
    <>
      <Stars
        radius={50}
        depth={50}
        count={1000}
        factor={2}
        speed={0.5}
        saturation={0}
        fade
      />
      <ImageOrbit />
    </>
  );
}
