import { Canvas, useThree } from "@react-three/fiber";
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
import { Suspense, useRef, useState, useEffect } from "react";

import { useAppStore, useGameStore } from "../store";
import { useViewStore } from "../store/viewStore";
import { ROUTE_PATHS } from "../store/routeConfig";
import { FISHEYE_CONFIG } from "../store/themeConfig";
import { startAutoTap, stopAutoTap } from "../store/gameStore";
import { attachListenerToCamera, playUISound } from "@/utils/soundSystem";
import { CreativeScene } from "@/routes/CreativeScene";
import { AboutScene } from "../routes/AboutScene";

import { HeadNavigation } from "./HeadNavigation";
import { TapCounter } from "./TapCounter";
import { MessageBubble } from "@/molecules/MessageBubble";

import { BackgroundPlanet } from "../3d-objects/BackgroundPlanet";
import { ParticleEffects } from "../3d-objects/ParticleEffects";
import { SceneDecorations } from "@/3d-objects/Decorations";

const Debug = () => {
  const { width } = useThree((s) => s.size);
  return <Perf minimal={width < 712} matrixUpdate deepAnalyze overClock />;
};

// TODO: make proper constant file
export const FLOOR_Y_POSITION = -1.5;

const Scene = ({
  permissionGranted,
  onEmotionUpdate,
}: {
  permissionGranted: boolean;
  onEmotionUpdate?: (data: {
    emotionState: any;
    tapCount: number;
    getEmotionIcon: any;
  }) => void;
}) => {
  const cameraControlsRef = useRef<CameraControls>(null!);
  const {
    setCameraControlsRef,
    isDefaultView,
    resetToDefaultView,
    transitionToView,
    setDefaultViewMode,
  } = useViewStore();
  const { upgrades, isPaused, statisticsVisible, setGameReady } =
    useGameStore();

  const { currentRoute, showOptions, setShowOptions } = useAppStore();

  // const autoTapEnabled = useMemo(() => {
  //   return upgrades.some(
  //     (upgrade) => upgrade.id === "auto_tap_1" && upgrade.level > 0
  //   );
  // }, [upgrades]);

  // shop items are only visible on home route
  const isHome = currentRoute === ROUTE_PATHS.HOME;
  const [visible, setVisible] = useState(isHome);
  // TODO: add grid options to UI
  const showGrid = isHome;
  const showBackground = isHome;

  useEffect(() => {
    setCameraControlsRef(cameraControlsRef);
  }, [setCameraControlsRef]);

  useEffect(() => {
    if (isHome) {
      setTimeout(() => {
        if (!isDefaultView()) {
          resetToDefaultView();
        }
      }, 200);
    }
  }, [isHome, resetToDefaultView]);

  useEffect(() => {
    if (isPaused) {
      stopAutoTap();
    } else {
      startAutoTap();
    }
  }, [isPaused]);

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 15 },
  }));

  useEffect(() => {
    if (isHome) {
      setVisible(true);
      api.start({
        scale: 1,
        config: { mass: 0.5, tension: 300, friction: 10 },
      });
    } else {
      api.start({
        scale: 0.0,
        config: { tension: 100, friction: 10 },
        onRest: () => setVisible(false),
      });
    }
  }, [isHome]);

  return (
    <>
      <FullScreenCanvas>
        <Suspense fallback={null}>
          <AudioListenerBinder />
          <Fisheye zoom={FISHEYE_CONFIG.MIN} renderPriority={2}>
            {showGrid && (
              <Grid
                args={[8, 8]}
                sectionThickness={2}
                sectionColor="#E0DEE6"
                // sectionColor="#959399"
                sectionSize={1}
                cellThickness={0}
                fadeDistance={4}
                position={[0, FLOOR_Y_POSITION, 0]}
              />
            )}
            <CameraControls ref={cameraControlsRef} />
            <ambientLight intensity={2} />
            <PerspectiveCamera makeDefault position={[0, 0, 3]} />
            <directionalLight intensity={1.2} position={[2, 4, 5]} />
            <Environment preset="city" />
            {showBackground ? (
              <BackgroundPlanet />
            ) : (
              <color attach="background" args={["#0e0e0e"]} />
            )}
            {statisticsVisible && <Debug />}

            <Physics gravity={[0, -9.81, 0]}>
              <HeadNavigation
                showOptions={showOptions || false}
                setShowOptions={setShowOptions || (() => {})}
                cameraControlsRef={cameraControlsRef}
                permissionGranted={permissionGranted}
                onEmotionUpdate={(data) => {
                  onEmotionUpdate?.(data);
                }}
              />

              <MessageBubble anchor={[0, 2.4, 0]} />

              <a.group visible={visible} scale={spring.scale}>
                <ParticleEffects />
                <TapCounter />

                <SceneDecorations />
              </a.group>

              <Suspense fallback={null}>
                {match(currentRoute)
                  .with(ROUTE_PATHS.ABOUT, () => <AboutScene />)
                  .with(ROUTE_PATHS.CREATIVE, () => <CreativeScene />)
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

type FullScreenCanvasProps = {
  children: any;
};

const FullScreenCanvas = ({ children, ...props }: FullScreenCanvasProps) => {
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dpr, setDpr] = useState(2);
  const { graphicPreferences } = useGameStore();

  useEffect(() => {
    if (graphicPreferences.qualityMode === "high") setDpr(2);
    else if (graphicPreferences.qualityMode === "low") setDpr(1);
  }, [graphicPreferences.qualityMode]);

  const handlePerformanceChange = ({ factor }: { factor: number }) => {
    if (graphicPreferences.qualityMode == "auto")
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
      onCreated={(state) => {
        state.camera.position.y = 20;
        state.camera.position.z = 30;
        state.camera.lookAt(0, 10, 0);
        state.camera.updateProjectionMatrix();
      }}
      {...props}
    >
      <PerformanceMonitor factor={1} onChange={handlePerformanceChange}>
        {children}
      </PerformanceMonitor>
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
