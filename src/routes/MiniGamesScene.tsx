import { useFloatingBar } from "@/layout/FloatingBar";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import {
  ROUTE_PATHS,
  useCoreStore,
  useMiniGameStore,
  useViewStore,
} from "@/store";
import type { MiniGameType } from "@/store/minigames";
import { GradientTexture, Grid } from "@react-three/drei";
import { CuboidCollider } from "@react-three/rapier";
import { type ComponentType, type ReactNode, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BackSide } from "three";

import { PingPongPaddle } from "@/3d-objects/models/pingPongPaddle";
import { PointsCounter } from "@/molecules/PointsCounter";
import { stopAllWorldSounds } from "@/utils/soundSystem";
import { FlappyBirdArcade, FlappyBirdGame } from "./games/FlappyBirdGame";
import {
  MiniGameItem,
  type SupportedMiniGameType,
} from "./games/withMiniGameItem";
import { PingPongGame } from "./games/PingPongGame";
import { SlotMachineArcade, SlotMachineGame } from "./games/SlotMachineGame";
import { useI18n } from "@/i18n";
import { miniGamesSceneMessages } from "./MiniGamesScene.messages";

const DEFAULT_MINIGAMES_VIEW = "default";

// TODO: refactor minigames view to be included as static view configs like slotmachine
type MiniGamesView = typeof DEFAULT_MINIGAMES_VIEW | "minigames:slot_machine";
type MiniGameComponent = ComponentType<{ onExit: () => void }>;

interface MiniGameDefinition {
  label: string;
  cameraView: MiniGamesView;
  shouldPlayMusic: boolean;
  GameComponent: MiniGameComponent;
  renderLobbyItem: () => ReactNode;
}

const MINI_GAME_ORDER: SupportedMiniGameType[] = [
  "SLOT_MACHINE",
  "PING_PONG",
  "FLAPPY_BIRD",
];

const MINI_GAME_DEFINITIONS: Record<SupportedMiniGameType, MiniGameDefinition> =
  {
    SLOT_MACHINE: {
      label: "Slot Machine",
      cameraView: "minigames:slot_machine",
      shouldPlayMusic: false,
      GameComponent: SlotMachineGame,
      renderLobbyItem: () => (
        <SlotMachineArcade position={[0, 0, -2]} scale={[1, 1, 1]} />
      ),
    },
    PING_PONG: {
      label: "Ping Pong",
      cameraView: DEFAULT_MINIGAMES_VIEW,
      shouldPlayMusic: true,
      GameComponent: PingPongGame,
      renderLobbyItem: () => (
        <PingPongPaddle
          rotation={[0, 0, 0]}
          position={[-2, 3, 0]}
          scale={[0.7, 0.7, 0.7]}
          enablePhysics
        />
      ),
    },
    FLAPPY_BIRD: {
      label: "Flappy Bird",
      cameraView: DEFAULT_MINIGAMES_VIEW,
      shouldPlayMusic: true,
      GameComponent: FlappyBirdGame,
      renderLobbyItem: () => (
        <FlappyBirdArcade position={[1, 3, 0]} scale={[0.5, 0.5, 0.5]} />
      ),
    },
  };

const isSupportedMiniGame = (
  game: MiniGameType,
): game is SupportedMiniGameType => game in MINI_GAME_DEFINITIONS;

const getMiniGameDefinition = (game: MiniGameType) =>
  isSupportedMiniGame(game) ? MINI_GAME_DEFINITIONS[game] : null;

function MiniGamesLobby({
  onSelect,
}: {
  onSelect: (game: SupportedMiniGameType) => void;
}) {
  const { locale } = useI18n();

  return (
    <group>
      {MINI_GAME_ORDER.map((game) => {
        const definition = MINI_GAME_DEFINITIONS[game];

        return (
          <MiniGameItem
            key={game}
            game={game}
            label={miniGamesSceneMessages[locale][game].label}
            onSelect={onSelect}
          >
            {definition.renderLobbyItem()}
          </MiniGameItem>
        );
      })}

      <MiniGamesLobbyBounds />
    </group>
  );
}

function MiniGamesLobbyBounds() {
  return (
    <>
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
    </>
  );
}

function MiniGamesContent({
  activeGame,
  onSelect,
  onExit,
}: {
  activeGame: MiniGameType;
  onSelect: (game: SupportedMiniGameType) => void;
  onExit: () => void;
}) {
  const activeDefinition = getMiniGameDefinition(activeGame);

  if (!activeDefinition) {
    return <MiniGamesLobby onSelect={onSelect} />;
  }

  const ActiveGame = activeDefinition.GameComponent;

  return <ActiveGame onExit={onExit} />;
}

function MiniGamesBackdrop() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture
            stops={[0, 0.3, 1]}
            colors={["#4857b0", "#d7d8e2", "#969bc1"]}
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

export function MiniGamesScene() {
  const navigate = useNavigate();
  const { checkUnlockedRoutes } = useCoreStore();
  const { setHoveredObject } = useFloatingBar();
  const activeGame = useMiniGameStore((state) => state.activeGame);
  const score = useMiniGameStore((state) => state.session.score);
  const setActiveGame = useMiniGameStore((state) => state.setActiveGame);
  const finishGame = useMiniGameStore((state) => state.finishGame);
  const transitionToView = useViewStore((state) => state.transitionToView);
  const cameraControlsRef = useViewStore((state) => state.cameraControlsRef);

  const isAllowedToAccess = checkUnlockedRoutes(ROUTE_PATHS.MINIGAMES);
  const activeDefinition = getMiniGameDefinition(activeGame);
  const handleExit = useCallback(() => {
    stopAllWorldSounds();
    finishGame();
  }, [finishGame]);

  useEffect(() => {
    if (!isAllowedToAccess) {
      console.warn("not allowed to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAccess, navigate]);

  useEffect(() => {
    if (activeGame !== "LOBBY") {
      setHoveredObject(null);
    }
  }, [activeGame, setHoveredObject]);

  useEffect(() => {
    if (!cameraControlsRef?.current) return;

    transitionToView(activeDefinition?.cameraView ?? DEFAULT_MINIGAMES_VIEW);
  }, [activeDefinition, cameraControlsRef, transitionToView]);

  return (
    <>
      <MiniGamesContent
        activeGame={activeGame}
        onSelect={setActiveGame}
        onExit={handleExit}
      />
      {activeGame === "LOBBY" ? (
        <MiniGamesBackdrop />
      ) : (
        <PointsCounter number={score} />
      )}
    </>
  );
}
