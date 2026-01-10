import { GrassShader } from "@/3d-objects/GrassShader";
import { FootballModel } from "@/3d-objects/models/football";
import { SoccerGoalModel } from "@/3d-objects/models/soccerGoal";
import { InteractiveObject } from "@/molecules/InteractiveObject";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import { ROUTE_PATHS, useAppStore, useCoreStore, useViewStore } from "@/store";
import { THEME_CONFIG } from "@/store/config/themes";
import { a } from "@react-spring/three";
import {
  AsciiRenderer,
  CameraShake,
  Center,
  GradientTexture,
  Grid,
  Outlines,
  RoundedBox,
  Text3D,
} from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BackSide } from "three";

export function MiniGamesScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const { currentRoute } = useAppStore();

  const { transitionToView } = useViewStore();

  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.MINIGAMES);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  useEffect(() => {
    // playWorldSound("minigames-theme");
    // return () => stopSoundsById("minigames-theme");
  }, [currentRoute]);

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

      {/* bottom fake shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y_POSITION - 0.5, 0]}
      >
        <circleGeometry args={[1, 16, 16]} />
        <meshToonMaterial color="#111820" transparent opacity={0.5} />
      </mesh>

      <InteractiveObject questAction="start_game">
        <FootballModel position={[-2, 5, -2]} />
      </InteractiveObject>

      <GrassShader position={[0, -0.8, 0]} preview={false} />

      <BasketBox
        position={[0, 5 + FLOOR_Y_POSITION, 0]}
        width={10}
        depth={10}
        height={10}
        wallThickness={0.02}
      />
      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture
            stops={[0, 0.5, 1]}
            colors={["#364330", "#497739", "#2a5429"]}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>

      <Grid
        args={[8, 8]}
        sectionThickness={2}
        sectionColor="#ffffff"
        sectionSize={1.2}
        cellThickness={0}
        fadeDistance={4}
        position={[0, FLOOR_Y_POSITION - 0.55, -0.55]}
      />
    </>
  );
}
