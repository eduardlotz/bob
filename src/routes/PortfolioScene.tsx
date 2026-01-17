import { FileOrbit } from "@/components/FileOrbit";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { ROUTE_PATHS, useCoreStore, useViewStore } from "@/store";
import {
  DEFAULT_PINK_NOISE,
  DEFAULT_WORLD_MUSIC,
} from "@/utils/sound/defaults";
import { playWorldSound, stopSoundsById } from "@/utils/soundSystem";
import { Stars } from "@react-three/drei";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function PortfolioScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const { resetToDefaultView, setDefaultViewMode, transitionToView } =
    useViewStore();
  const navigate = useNavigate();
  const { isMuted } = useSoundSystem();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.PORTFOLIO);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  useEffect(() => {
    setDefaultViewMode("object");
  }, []);

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
      <FileOrbit />
      <color attach="background" args={["#0e0e0e"]} />
    </>
  );
}
