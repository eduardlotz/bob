import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  Fisheye,
  Environment,
  PerspectiveCamera,
  Grid,
  PerformanceMonitor,
} from "@react-three/drei";

import { match } from "ts-pattern";
import { a, useSpring } from "@react-spring/three";
import { Physics } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import { Suspense, useRef, useState, useEffect, useMemo } from "react";

import { useAppStore, useCoreStore, useMiniGameStore } from "../store";
import { useViewStore } from "../store/viewStore";
import { ROUTE_IDS, ROUTE_PATHS } from "../store/config/routes";
import { FISHEYE_CONFIG } from "../store/config/themes";
import {
  attachListenerToCamera,
  playWorldSound,
  stopAllWorldSounds,
  stopSoundsById,
} from "@/utils/soundSystem";
import { PortfolioScene } from "@/routes/PortfolioScene";
import { AboutScene } from "../routes/AboutScene";

import { HeadNavigation } from "./HeadNavigation";
import { TapCounter } from "./TapCounter";
import { MessageBubble } from "@/molecules/MessageBubble";

import { BackgroundPlanet } from "../3d-objects/BackgroundPlanet";
import { TapEffects } from "../3d-objects/ParticleEffects";
import { SceneDecorations } from "@/3d-objects/Decorations";
import { MiniGamesScene } from "@/routes/MiniGamesScene";
import { DEFAULT_PINK_NOISE } from "@/utils/sound/defaults";

import { useNavigate } from "react-router-dom";
import { sileo } from "sileo";
import { CameraGLBridge } from "@/bridges/CameraBridge";
import { useCursor } from "@/hooks/useCursor";

const Debug = () => {
  const { width } = useThree((s) => s.size);
  return <Perf minimal={width < 712} matrixUpdate deepAnalyze overClock />;
};

// TODO: make proper constant file
export const FLOOR_Y_POSITION = -1.5;
const TRUCK_SPEED = 5;

const Scene = ({ permissionGranted }: { permissionGranted: boolean }) => {
  const cameraControlsRef = useRef<CameraControls>(null!);
  const { setCameraControlsRef } = useViewStore();
  const { statisticsVisible, physicsDebugEnabled } = useCoreStore();
  const { activeGame } = useMiniGameStore();

  const { currentRoute } = useAppStore();

  // shop items are only visible on home route
  const isHome = currentRoute === ROUTE_PATHS.HOME;
  // TODO: add grid options to UI
  const showGrid = isHome;
  const showBackground = isHome || currentRoute === ROUTE_PATHS.ABOUT;

  useEffect(() => {
    setCameraControlsRef(cameraControlsRef);
  }, []);

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 15 },
  }));

  // route based music
  // default: jazz world music
  // portfolio: pink noise

  const worldMusicId = useMemo(() => {
    switch (currentRoute) {
      // case ROUTE_PATHS.HOME: {
      //   return DEFAULT_WORLD_MUSIC.id;
      // }

      case ROUTE_PATHS.PORTFOLIO: {
        return DEFAULT_PINK_NOISE.id;
      }

      default: {
        return null;
      }
    }
  }, [currentRoute]);

  useEffect(() => {
    stopAllWorldSounds();

    if (!worldMusicId) return;

    playWorldSound(worldMusicId, { stopPrevious: true });

    return () => {
      stopAllWorldSounds();
    };
  }, [worldMusicId]);

  return (
    <>
      <FullScreenCanvas>
        <Suspense fallback={null}>
          <AudioListenerBinder />
          <Fisheye zoom={FISHEYE_CONFIG.MIN} renderPriority={2}>
            <CursorFollowCamera />
            {showGrid && (
              <Grid
                args={[8, 8]}
                sectionThickness={2}
                sectionColor="#E0DEE6"
                // sectionColor="#959399"
                sectionSize={1.2}
                cellThickness={0}
                fadeDistance={4}
                position={[0, FLOOR_Y_POSITION - 0.55, -0.55]}
              />
            )}
            <CameraControls
              ref={cameraControlsRef}
              truckSpeed={TRUCK_SPEED}
              azimuthRotateSpeed={0.3}
            />
            <ambientLight intensity={2} />
            <PerspectiveCamera makeDefault position={[0, 0, 3]} />
            <directionalLight intensity={1.2} position={[2, 4, 5]} />
            <Environment preset="city" />
            {showBackground && <BackgroundPlanet />}
            {statisticsVisible && <Debug />}

            <Physics gravity={[0, -9.81, 0]} debug={physicsDebugEnabled}>
              {activeGame === "LOBBY" && (
                <HeadNavigation
                  cameraControlsRef={cameraControlsRef}
                  permissionGranted={permissionGranted}
                />
              )}

              <MessageBubble anchor={[0, 2.4, 0]} />

              <a.group visible={isHome} scale={spring.scale}>
                <TapCounter />
                <SceneDecorations />
                <TapEffects />

                {/* bottom fake shadow */}
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, FLOOR_Y_POSITION - 0.5, 0]}
                >
                  <circleGeometry args={[0.8, 16, 16]} />
                  <meshToonMaterial color="#111820" transparent opacity={0.5} />
                </mesh>
              </a.group>

              <Suspense fallback={null}>
                {match(currentRoute)
                  .with(ROUTE_PATHS.ABOUT, () => <AboutScene />)
                  .with(ROUTE_PATHS.PORTFOLIO, () => <PortfolioScene />)
                  .with(ROUTE_PATHS.MINIGAMES, () => <MiniGamesScene />)
                  .otherwise(() => null)}
              </Suspense>
            </Physics>
          </Fisheye>
        </Suspense>
      </FullScreenCanvas>
    </>
  );
};

export default Scene;

const CursorFollowCamera = () => {
  const { isMobile } = useAppStore();
  const { cameraControlsRef, getCurrentViewConfig, viewMode, isTransitioning } =
    useViewStore();
  const cursor = useCursor({ condition: () => !isMobile, positionFactor: 1 });

  useFrame(({ clock }) => {
    if (isMobile) return;
    if (viewMode !== "fixed" || isTransitioning) return;

    const viewConfig = getCurrentViewConfig();
    if (!viewConfig?.cursorFollow || !viewConfig.position || !viewConfig.target)
      return;

    const controls = cameraControlsRef?.current;
    if (!controls) return;

    const {
      strength = 2.2,
      yScale = 0.4,
      swayX = 0.03,
      swayY = 0.02,
    } = viewConfig.cursorFollow;

    const swayXValue = Math.sin(clock.getElapsedTime() * 1) * swayX;
    const swayYValue = Math.sin(clock.getElapsedTime() * 0.5) * swayY;

    controls.setLookAt(
      ...viewConfig.position,
      viewConfig.target[0] + cursor.x * strength + swayXValue,
      viewConfig.target[1] + cursor.y * strength * yScale + swayYValue,
      viewConfig.target[2],
      true,
    );
  });

  return null;
};

type FullScreenCanvasProps = {
  children: any;
};

const FullScreenCanvas = ({ children, ...props }: FullScreenCanvasProps) => {
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dpr, setDpr] = useState(2);
  const navigate = useNavigate();

  const handlePerformanceChange = ({ factor }: { factor: number }) => {
    setDpr(Math.max(Math.floor(0.5 + 1.5 * factor), 1));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      shadows
      flat
      gl={{
        powerPreference: "high-performance",
        // antialias: false,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;

        const onLost = (e: Event) => {
          e.preventDefault();
        };

        const onRestored = () => {
          window.location.reload();
          navigate(ROUTE_PATHS.HOME);

          sileo.error({
            title: "Ein Fehler ist aufgetreten...",
          });
        };

        canvas.addEventListener("webglcontextlost", onLost, false);
        canvas.addEventListener("webglcontextrestored", onRestored, false);
      }}
      color="black"
      camera={{ position: [0, 0, isMobile ? 1.5 : 2], fov: 50 }}
      style={{
        width: "100vw",
        height: "100dvh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
      dpr={dpr}
      {...props}
    >
      <>
        <CameraGLBridge />

        <PerformanceMonitor factor={1} onChange={handlePerformanceChange}>
          {children}
        </PerformanceMonitor>
      </>
    </Canvas>
  );
};

function AudioListenerBinder() {
  const { camera } = useThree();
  useEffect(() => {
    attachListenerToCamera(camera);
  }, [camera]);
  return null;
}
