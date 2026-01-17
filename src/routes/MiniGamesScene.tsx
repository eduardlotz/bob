import { GrassShader } from "@/3d-objects/GrassShader";
import { FootballModel } from "@/3d-objects/models/football";
import { GoalPost } from "@/3d-objects/models/goalPost";
import { CloudEffect, TapEffects } from "@/3d-objects/ParticleEffects";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import {
  ROUTE_PATHS,
  useCoreStore,
  useMiniGameStore,
  useViewStore,
} from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { GradientTexture, Grid, Html } from "@react-three/drei";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackSide } from "three";
import { match } from "ts-pattern";
import { PingPongGame } from "./games/PingPongGame";
import { PingPongPaddle } from "@/3d-objects/models/pingPongPaddle";
import { FootballGame } from "./games/FootballGame";
import { PointsCounter } from "@/molecules/PointsCounter";

export function MiniGamesScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const activeGame = useMiniGameStore((s) => s.activeGame);
  const { setActiveGame, finishGame } = useMiniGameStore();
  const score = useMiniGameStore((s) => s.session.score);

  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.MINIGAMES);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  const api = useRef<RapierRigidBody>(null);

  return (
    <>
      {match(activeGame)
        .with("PING_PONG", () => <PingPongGame onExit={finishGame} />)
        .with("FOOTBALL", () => <FootballGame onExit={finishGame} />)
        .otherwise(() => (
          // This is your "Lobby" view
          <group>
            <group onClick={() => setActiveGame("FOOTBALL")}>
              <FootballModel position={[1, 5, 0]} />
            </group>

            <group onClick={() => setActiveGame("PING_PONG")}>
              <PingPongPaddle
                rotation={[Math.PI / 2, 0, 0]}
                position={[-2, 0, 0]}
              />
            </group>

            {/* bottom fake shadow */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, FLOOR_Y_POSITION - 0.5, 0]}
            >
              <circleGeometry args={[1, 16, 16]} />
              <meshToonMaterial color="#111820" transparent opacity={0.5} />
            </mesh>

            <BasketBox
              position={[0, 3.3 + FLOOR_Y_POSITION, 2]}
              width={7.5}
              depth={7}
              height={6}
              wallThickness={0.02}
            />
          </group>
        ))}

      <TapEffects id="tap_effect_confetti" />

      {activeGame !== "LOBBY" && <PointsCounter number={score} />}

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
