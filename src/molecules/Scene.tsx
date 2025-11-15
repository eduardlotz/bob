import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  Fisheye,
  Environment,
  PerspectiveCamera,
  Grid,
} from "@react-three/drei";
import {
  Suspense,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAppStore, useGameStore } from "../store";
import { useViewStore } from "../store/viewStore";
import { ROUTE_PATHS } from "../store/routeConfig";
import { HeadNavigation } from "./HeadNavigation";
import { TapCounter } from "./TapCounter";
import { AboutScene } from "./AboutScene";
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

export function FirstFrame({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady();
  });

  return null;
}

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
  const { setCameraControlsRef, resetToDefaultView } = useViewStore();
  const { upgrades, isPaused } = useGameStore();

  const {
    currentRoute,
    showOptions,
    setShowOptions,
    setEmotionData,
    closeOptionsWithAnimation,
  } = useAppStore();

  const isHome = currentRoute === ROUTE_PATHS.HOME;

  const autoTapEnabled = useMemo(() => {
    return upgrades.some(
      (upgrade) => upgrade.id === "auto_tap_1" && upgrade.level > 0
    );
  }, [upgrades]);

  const [visible, setVisible] = useState(isHome);

  // initialize view store with camera controls reference
  useEffect(() => {
    setCameraControlsRef(cameraControlsRef);
  }, [setCameraControlsRef]);

  // reset to default view when navigating to home (only if not already in default view)
  useEffect(() => {
    if (isHome) {
      // only reset if we're not already in default view to avoid unnecessary transitions
      setTimeout(() => {
        const { isDefaultView } = useViewStore.getState();
        if (!isDefaultView()) {
          resetToDefaultView();
        }
      }, 200);
    }
  }, [isHome, resetToDefaultView]);

  // Handle auto-tap - continue on all routes since shop is accessible everywhere
  useEffect(() => {
    // Always start auto-tap regardless of route
    if (autoTapEnabled) {
      startAutoTap();
      return () => stopAutoTap();
    }
  }, [currentRoute]);

  // Pause/resume auto-tap based on game state
  // dev only
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

  const handleEmotionUpdate = useCallback(
    (data: any) => {
      if (currentRoute === ROUTE_PATHS.HOME) {
        setEmotionData(data.emotionState);
        onEmotionUpdate?.(data);
      } else {
        onEmotionUpdate?.(data);
      }
    },
    [currentRoute, onEmotionUpdate]
  );

  return (
    <>
      <AudioListenerBinder />
      <Fisheye zoom={FISHEYE_CONFIG.DEFAULT}>
        <Grid
          args={[8, 8]}
          sectionThickness={2}
          sectionColor="#E0DEE6"
          sectionSize={1}
          cellThickness={0}
          fadeDistance={4}
          position={[0, FLOOR_Y_POSITION, 0]}
        />
        <CameraControls
          ref={cameraControlsRef}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.6}
          maxDistance={15}
          minDistance={1}
        />
        <ambientLight intensity={2} />
        <PerspectiveCamera
          makeDefault
          position={[20, 20, 20]}
          rotation={[Math.PI * 20, 0, 0]}
        />
        <directionalLight intensity={1.2} position={[2, 4, 5]} />
        <Environment preset="city" />
        <BackgroundPlanet />
        {/* TODO: add back in as upgrade */}
        <HeadNavigation
          showOptions={showOptions || false}
          setShowOptions={setShowOptions || (() => {})}
          cameraControlsRef={cameraControlsRef} // pass down for portal click
          permissionGranted={permissionGranted}
          onEmotionUpdate={handleEmotionUpdate}
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
      </Fisheye>
    </>
  );
};

export default Scene;

function AudioListenerBinder() {
  const { camera } = useThree();
  useEffect(() => {
    attachListenerToCamera(camera);
  }, [camera]);
  return null;
}
