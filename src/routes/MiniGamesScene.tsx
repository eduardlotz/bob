import { GrassShader } from "@/3d-objects/GrassShader";
import { FootballModel } from "@/3d-objects/models/football";
import { GoalPost } from "@/3d-objects/models/goalPost";
import {
  CloudEffect,
  RainEffect,
  TapEffects,
} from "@/3d-objects/ParticleEffects";
import { useMessageSystem } from "@/hooks/useMessageSystem";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { InteractiveObject } from "@/molecules/InteractiveObject";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import { ROUTE_PATHS, useAppStore, useCoreStore, useViewStore } from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { GradientTexture, Grid } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BackSide } from "three";

export function MiniGamesScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const { currentRoute } = useAppStore();
  const goalsScored = useRef(0);

  const navigate = useNavigate();
  const { showMessage } = useMessageStore();
  const { triggerQuest } = useQuestSystem();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.MINIGAMES);

  const createParticles = useCallback((x = 0, y = 2, z = 0, count = 50) => {
    if ((window as any).createTapParticles) {
      (window as any).createTapParticles(x, y, z, count);
    }
  }, []);

  const onGoalScored = () => {
    createParticles();
    showMessage("minigames_home_goal_scored");
    triggerQuest("minigames_home_goal_scored");
  };

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  // useEffect(() => {
  //   playWorldSound("minigames-theme");
  //   return () => stopSoundsById("minigames-theme");
  // }, [currentRoute]);

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

      <TapEffects id="tap_effect_confetti" />

      {/* bottom fake shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y_POSITION - 0.5, 0]}
      >
        <circleGeometry args={[1, 16, 16]} />
        <meshToonMaterial color="#111820" transparent opacity={0.5} />
      </mesh>

      <InteractiveObject questAction="start_game">
        <FootballModel position={[0, 8, 0.5]} />
      </InteractiveObject>

      <CloudEffect preview={false} />

      <GrassShader position={[0, -0.8, 0]} preview={false} />

      <BasketBox
        position={[0, 3.3 + FLOOR_Y_POSITION, -1]}
        width={7.5}
        depth={7}
        height={6}
        wallThickness={0.02}
      />

      <GoalPost
        position={[0, -1.2, -3]}
        scale={2}
        onEnter={onGoalScored}
        onLeave={() => {
          // console.log("left goal");
        }}
      />

      {/* <color attach="background" args={["#1e2655"]} /> */}

      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture
            stops={[0, 0.5, 1]}
            colors={["#4857b0", "#969bc1"]}
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
