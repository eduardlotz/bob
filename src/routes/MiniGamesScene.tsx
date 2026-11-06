import { useFloatingBar } from "@/layout/FloatingBar";
import { FLOOR_Y_POSITION } from "@/store/config/scene";
import { BasketBox } from "@/physics/BasketBox";
import {
  ROUTE_PATHS,
  useCoreStore,
  useMiniGameStore,
  useViewStore,
} from "@/store";
import type { MiniGameType } from "@/store/minigames";
import { GradientTexture, Grid } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { CuboidCollider } from "@react-three/rapier";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { BackSide } from "three";

import { PingPongPaddle } from "@/3d-objects/models/pingPongPaddle";
import { PointsCounter } from "@/molecules/PointsCounter";
import { exitMiniGame } from "@/utils/miniGameTransitions";
import { FlappyBirdGame, FlappyBirdRingPreview } from "./games/FlappyBirdGame";
import { MiniGameThrone } from "./games/MiniGameThrone";
import {
  type SupportedMiniGameType,
} from "./games/withMiniGameItem";
import { PingPongGame } from "./games/PingPongGame";
import { useI18n } from "@/i18n";
import { miniGamesSceneMessages } from "./MiniGamesScene.messages";
import { transitionScreen } from "@/store/screenTransition";
import { getGameTransition } from "@/styles/screenTransitions";


const DEFAULT_MINIGAMES_VIEW = "default";
const getMiniGameThroneY = () => FLOOR_Y_POSITION + 0.18;

type MiniGamesView = typeof DEFAULT_MINIGAMES_VIEW;
type MiniGameComponent = ComponentType<{ onExit: () => void }>;

interface LobbyPlacement { position: [number, number, number]; scale: number; }

interface MiniGameDefinition {
  cameraView: MiniGamesView;
  GameComponent: MiniGameComponent;
  renderLobbyItem: (
    label: string,
    onSelect: (game: SupportedMiniGameType) => void,
    placement: LobbyPlacement,
  ) => ReactNode;
}

const MINI_GAME_ORDER: SupportedMiniGameType[] = [
  "PING_PONG",
  "FLAPPY_BIRD",
];

const MINI_GAME_DEFINITIONS: Record<SupportedMiniGameType, MiniGameDefinition> =
  {
    PING_PONG: {
      cameraView: DEFAULT_MINIGAMES_VIEW,
      GameComponent: PingPongGame,
      renderLobbyItem: (label, onSelect, placement) => (
        <MiniGameThrone
          label={label}
          onClick={() => onSelect("PING_PONG")}
          position={placement.position}
          scale={placement.scale}
          objectOffset={[0, 2.22, 0]}
          objectScale={0.58}
        >
          <PingPongPaddle rotation={[0.4, 0, -0.2]} />
        </MiniGameThrone>
      ),
    },
    FLAPPY_BIRD: {
      cameraView: DEFAULT_MINIGAMES_VIEW,
      GameComponent: FlappyBirdGame,
      renderLobbyItem: (label, onSelect, placement) => (
        <MiniGameThrone
          label={label}
          onClick={() => onSelect("FLAPPY_BIRD")}
          position={placement.position}
          scale={placement.scale}
          objectOffset={[0, 3, 0]}
          objectScale={0.46}
        >
          <FlappyBirdRingPreview />
        </MiniGameThrone>
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
  const compact = useThree(state => state.size.width < 600);

  return (
    <group>
      {MINI_GAME_ORDER.map((game, index) => {
        const definition = MINI_GAME_DEFINITIONS[game];

        return (
          <group key={game}>
            {definition.renderLobbyItem(
              miniGamesSceneMessages[locale][game].label,
              onSelect,
              {
                position: [(index % 2 ? 1 : -1) * (compact ? 1.85 : 2.25), getMiniGameThroneY(), index < 2 ? -1.8 : (compact ? .85 : 1.3)],
                scale: compact ? .62 : .78,
              },
            )}
          </group>
        );
      })}

      <group userData={{ foregroundOutline: false }}><MiniGamesLobbyBounds /></group>
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

  return <group userData={{ foregroundOutline: false }}><ActiveGame onExit={onExit} /></group>;
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
  const transitionToView = useViewStore((state) => state.transitionToView);
  const cameraControlsRef = useViewStore((state) => state.cameraControlsRef);
  const pendingGameReady = useRef<(() => void) | null>(null);

  const isAllowedToAccess = checkUnlockedRoutes(ROUTE_PATHS.MINIGAMES);
  const activeDefinition = getMiniGameDefinition(activeGame);
  const handleSelect = useCallback((game: SupportedMiniGameType) => {
    transitionScreen(() => new Promise<void>(resolve => {
      pendingGameReady.current = resolve;
      setActiveGame(game);
    }), undefined, { appearance: getGameTransition(game) });
  }, [setActiveGame]);
  const handleExit = useCallback(() => { exitMiniGame(); }, []);

  useEffect(() => {
    if (!isAllowedToAccess) {
      console.warn("not allowed to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAccess, navigate]);

  useEffect(() => {
    if (activeGame !== "LOBBY") {
      setHoveredObject(null);
      // This effect commits after a lazy game's suspended subtree mounts.
      pendingGameReady.current?.();
      pendingGameReady.current = null;
    }
  }, [activeGame, setHoveredObject]);

  useEffect(() => {
    if (!cameraControlsRef?.current) return;

    transitionToView(activeDefinition?.cameraView ?? DEFAULT_MINIGAMES_VIEW);
  }, [activeDefinition, cameraControlsRef, transitionToView]);

  return (
    <>
      <group userData={{ foregroundOutline: "foreground" }}><MiniGamesContent
        activeGame={activeGame}
        onSelect={handleSelect}
        onExit={handleExit}
      /></group>
      {activeGame === "LOBBY" ? (
        <MiniGamesBackdrop />
      ) : activeGame !== "FLAPPY_BIRD" && activeGame !== "PING_PONG" ? (
        <PointsCounter number={score} />
      ) : null}
    </>
  );
}
