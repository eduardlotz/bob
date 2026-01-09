import { GrassShader } from "@/3d-objects/GrassShader";
import { FootballModel } from "@/3d-objects/models/football";
import { InteractiveObject } from "@/molecules/InteractiveObject";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import { ROUTE_PATHS, useAppStore, useCoreStore, useViewStore } from "@/store";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function MiniGamesScene() {
  const { checkUnlockedRoutes, decorations } = useCoreStore();
  const { currentRoute } = useAppStore();
  const {
    transitionToView,
    resetToDefaultView,
    setDefaultViewMode,
    currentView,
  } = useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.MINIGAMES);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  return (
    <>
      {/* <SpotLight
        distance={6}
        radiusTop={0.5}
        color="#e5f4cd"
        angle={0.6}
        attenuation={5}
        anglePower={1} // Diffuse-cone anglePower (default: 5)
        position={[0, 3, 0]}
      /> */}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y_POSITION, 0]}>
        <circleGeometry args={[10, 20]} />
        <meshToonMaterial color="#222f3f" />
      </mesh>

      <InteractiveObject questAction="start_game">
        <FootballModel position={[-2, 5, -2]} />
      </InteractiveObject>
      {/* <GrassShader position={[0, -0.8, 0]} scale={[1, 1, 1]} preview={false} /> */}

      <BasketBox
        position={[0, 5 + FLOOR_Y_POSITION, 0]}
        width={10}
        depth={10}
        height={10}
        wallThickness={0.02}
      />
    </>
  );
}
