import { FootballModel } from "@/3d-objects/models/football";
import { TapEffects } from "@/3d-objects/ParticleEffects";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import { ROUTE_PATHS, useCoreStore, useMiniGameStore } from "@/store";
import { GradientTexture, Grid } from "@react-three/drei";
import { CuboidCollider } from "@react-three/rapier";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BackSide } from "three";
import { match } from "ts-pattern";
import { PingPongGame } from "./games/PingPongGame";
import { PingPongPaddle } from "@/3d-objects/models/pingPongPaddle";
import { FootballGame } from "./games/FootballGame";
import { PointsCounter } from "@/molecules/PointsCounter";
import { FlappyBirdArcade, FlappyBirdGame } from "./games/FlappyBirdGame";

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

  return (
    <>
      {match(activeGame)
        .with("PING_PONG", () => <PingPongGame onExit={finishGame} />)
        .with("FOOTBALL", () => <FootballGame onExit={finishGame} />)
        .with("FLAPPY_BIRD", () => <FlappyBirdGame onExit={finishGame} />)
        .otherwise(() => (
          // This is your "Lobby" view
          <group>
            <group onClick={() => setActiveGame("FOOTBALL")}>
              <FootballModel position={[1, 7, 0]} scale={[5, 5, 5]} />
            </group>

            <group onClick={() => setActiveGame("PING_PONG")}>
              <PingPongPaddle
                rotation={[0, 0, 0]}
                position={[-2, 7, 0]}
                scale={[0.7, 0.7, 0.7]}
                enablePhysics
              />
            </group>

            <group onClick={() => setActiveGame("FLAPPY_BIRD")}>
              <FlappyBirdArcade
                position={[0, 5, 0.5]}
                scale={[0.5, 0.5, 0.5]}
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
              position={[0, 4 + FLOOR_Y_POSITION + 0.55, 2]}
              width={10}
              depth={10}
              height={10}
              wallThickness={0.1}
            />

            <CuboidCollider
              args={[3, 3, 0.1]}
              position={[2.5, 0, -2]}
              rotation={[0, Math.PI / 9, 0]}
            />
            <CuboidCollider
              args={[3, 3, 0.1]}
              position={[-2.5, 0, -2]}
              rotation={[0, -Math.PI / 9, 0]}
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
