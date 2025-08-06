import { Canvas } from "@react-three/fiber";
import {
  CameraControls,
  Fisheye,
  Environment,
  PerspectiveCamera,
  Grid,
} from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";
import { useAppStore } from "../store";
import { ROUTE_PATHS } from "../store/routeConfig";
import { HeadNavigation } from "./HeadNavigation";
import { TapCounter } from "./TapCounter";
import { AboutScene } from "./AboutScene";
import { PortfolioScene } from "./PortfolioScene";
import { BackgroundPlanet } from "../3d-objects/BackgroundPlanet";
import { ParticleEffects } from "../3d-objects/ParticleEffects";
import { match } from "ts-pattern";
import { startAutoTap } from "../store/gameStore";
import { useKeyPress } from "../hooks/useKeyPress";
import { FISHEYE_CONFIG } from "../store/upgradesConfig";
import { a, useSpring } from "@react-spring/three";

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

  const { currentRoute, showOptions, setShowOptions, setEmotionData } =
    useAppStore();

  const isHome = currentRoute === ROUTE_PATHS.HOME;

  const [visible, setVisible] = useState(isHome);

  // Handle auto-tap - continue on all routes since shop is accessible everywhere
  useEffect(() => {
    // Always start auto-tap regardless of route
    startAutoTap();
  }, [currentRoute]);

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
      setShowOptions(false);
    }
  });

  return (
    <>
      <FullScreenCanvas>
        <Suspense fallback={null}>
          <Fisheye zoom={FISHEYE_CONFIG.DEFAULT}>
            <Grid
              args={[8, 8]}
              sectionThickness={2}
              sectionColor="#E0DEE6"
              sectionSize={1}
              cellThickness={0}
              fadeDistance={4}
              position={[0, -2, 0]}
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
              rotateX={Math.PI * 20}
            />
            <directionalLight intensity={1.2} position={[2, 4, 5]} />
            <Environment preset="city" />
            <BackgroundPlanet />
            {/* TODO: add back in as upgrade */}
            {/* <StarEffect />  */}
            <HeadNavigation
              showOptions={showOptions || false}
              setShowOptions={setShowOptions || (() => {})}
              cameraControlsRef={cameraControlsRef} // pass down for portal click
              permissionGranted={permissionGranted}
              onEmotionUpdate={(data) => {
                // Only update emotion state on home route to prevent auto-tap effects
                if (currentRoute === ROUTE_PATHS.HOME) {
                  setEmotionData(data.emotionState);
                  onEmotionUpdate?.(data);
                } else {
                  // Just pass through emotion data without updating tap count
                  onEmotionUpdate?.(data);
                }
              }}
            />
            <a.group visible={visible} scale={spring.scale}>
              <TapCounter />

              {/* ParticleEffects inside Fisheye but with larger spawn areas */}
              <ParticleEffects />
            </a.group>
            {/* Route-specific content using pattern matching */}
            {match(currentRoute)
              .with(ROUTE_PATHS.ABOUT, () => <AboutScene />)
              .with(ROUTE_PATHS.PORTFOLIO, () => <PortfolioScene />)
              .otherwise(() => null)}
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it once to set the initial state

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
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
      {...props}
    >
      {children}
    </Canvas>
  );
};
