import { Canvas, Dpr, useThree } from "@react-three/fiber";
import {
  CameraControls,
  Fisheye,
  Environment,
  PerspectiveCamera,
  Grid,
  PerformanceMonitor,
} from "@react-three/drei";

import { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { useAppStore, useGameStore } from "../store";
import { useViewStore } from "../store/viewStore";
import { ROUTE_PATHS } from "../store/routeConfig";
import { HeadNavigation } from "./HeadNavigation";
import { TapCounter } from "./TapCounter";
import { AboutScene } from "../routes/AboutScene";
import { BackgroundPlanet } from "../3d-objects/BackgroundPlanet";
import { ParticleEffects } from "../3d-objects/ParticleEffects";
import { match } from "ts-pattern";
import { startAutoTap, stopAutoTap } from "../store/gameStore";
import { useKeyPress } from "../hooks/useKeyPress";
import { FISHEYE_CONFIG } from "../store/themeConfig";
import { a, useSpring } from "@react-spring/three";
import { attachListenerToCamera } from "@/utils/soundSystem";
import { MessageBubble } from "@/molecules/MessageBubble";
import { SceneDecorations } from "@/3d-objects/Decorations";
import { Physics } from "@react-three/rapier";

import { Perf } from "r3f-perf";

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
  const { setCameraControlsRef, resetToDefaultView, isDefaultView } =
    useViewStore();
  const { upgrades, isPaused, statisticsVisible } = useGameStore();

  const {
    currentRoute,
    showOptions,
    setShowOptions,
    setEmotionData,
    closeOptionsWithAnimation,
  } = useAppStore();

  const autoTapEnabled = useMemo(() => {
    return upgrades.some(
      (upgrade) => upgrade.id === "auto_tap_1" && upgrade.level > 0
    );
  }, [upgrades]);

  // shop items are only visible on home route
  const isHome = currentRoute === ROUTE_PATHS.HOME;
  const [visible, setVisible] = useState(isHome);
  // TODO: add grid options to UI
  const showGrid = isHome;

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

  useKeyPress("Escape", () => {
    if (showOptions) {
      closeOptionsWithAnimation();
    }
  });

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
            <BackgroundPlanet />

            {statisticsVisible && <Debug />}

            <Physics gravity={[0, -9.81, 0]}>
              <HeadNavigation
                showOptions={showOptions || false}
                setShowOptions={setShowOptions || (() => {})}
                cameraControlsRef={cameraControlsRef}
                permissionGranted={permissionGranted}
                onEmotionUpdate={(data) => {
                  // TODO: check if it actually works?
                  onEmotionUpdate?.(data);
                }}
              />

              <MessageBubble anchor={[0, 2.4, 0]} />

              <a.group visible={visible} scale={spring.scale}>
                <ParticleEffects />
                <TapCounter />

                <SceneDecorations />
              </a.group>

              {match(currentRoute)
                .with(ROUTE_PATHS.ABOUT, () => <AboutScene />)
                .otherwise(() => null)}
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
        height: "100svh",
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
      <PerformanceMonitor
        factor={1}
        onChange={({ factor }) =>
          setDpr(Math.max(Math.floor(0.5 + 1.5 * factor), 1))
        }
      >
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
