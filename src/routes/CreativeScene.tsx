import { ImageOrbit } from "@/components/ImageOrbit";
import { ROUTE_PATHS, useAppStore, useCoreStore, useViewStore } from "@/store";
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
  const { checkUnlockedRoutes } = useCoreStore();
  const { currentRoute } = useAppStore();
  const {
    transitionToView,
    resetToDefaultView,
    setDefaultViewMode,
    currentView,
  } = useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.CREATIVE);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  useEffect(() => {
    setDefaultViewMode("object");
    resetToDefaultView();
    transitionToView("creative");
    playWorldSound("pink-noise");
  }, [currentRoute]);

  return (
    <>
      <Stars
        radius={100}
        depth={100}
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
