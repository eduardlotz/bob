import {
  Fisheye,
  CameraControls,
  PerspectiveCamera,
  Grid,
  Environment,
  Text,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, Suspense } from "react";
import { HeadNavigation } from "./HeadNavigation";
import { EmotionCounter } from "./EmotionBar";
import { useKeyPress } from "@/hooks/useKeyPress";
import { BackgroundPlanet } from "@/3d-objects/BackgroundPlanet";
import { ParticleEffects } from "@/3d-objects/ParticleEffects";
import { useGameStore } from "@/store/gameStore";
import { FISHEYE_CONFIG } from "@/store/upgradesConfig";

const Scene = ({
  permissionGranted,
  onEmotionUpdate,
  showOptions,
  setShowOptions,
}: {
  permissionGranted: boolean;
  onEmotionUpdate?: (data: {
    emotionState: any;
    tapCount: number;
    getEmotionIcon: any;
  }) => void;
  showOptions?: boolean;
  setShowOptions?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const cameraControlsRef = useRef<CameraControls>(null!);
  const [tapCount, setTapCount] = useState(0);
  const [emotionState, setEmotionState] = useState("normal");

  // Get decorations and fisheye intensity from game store
  const { decorations, fisheyeIntensity } = useGameStore();

  // Check fisheye intensity decoration
  const fisheyeDecoration = decorations.find(
    (d) => d.id === "fisheye_intensity"
  );
  const fisheyeEnabled =
    fisheyeDecoration?.purchased && fisheyeDecoration?.enabled;
  const currentFisheyeIntensity = fisheyeEnabled
    ? fisheyeIntensity
    : FISHEYE_CONFIG.MIN; // Use store value

  useKeyPress("Escape", () => {
    if (showOptions && setShowOptions) {
      setShowOptions(false);
    }
  });

  const hideOptionsIfOpen = () => {
    if (showOptions && setShowOptions) {
      setShowOptions(false);
    }
  };

  return (
    <>
      <FullScreenCanvas onPointerMissed={hideOptionsIfOpen}>
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="white" />
            </mesh>
          }
        >
          <Fisheye zoom={currentFisheyeIntensity}>
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
              maxDistance={40} // Increased to prevent clipping
              minDistance={0.5} // Reduced to allow closer zoom
            />
            <ambientLight intensity={2} />
            <PerspectiveCamera
              makeDefault
              position={[20, 20, 20]}
              rotateX={Math.PI * 20}
            />
            <directionalLight intensity={1.2} position={[2, 4, 5]} />
            <Environment preset="city" />
            <BackgroundPlanet showOptions={showOptions || false} />
            <HeadNavigation
              showOptions={showOptions || false}
              setShowOptions={setShowOptions || (() => {})}
              cameraControlsRef={cameraControlsRef} // pass down for portal click
              permissionGranted={permissionGranted}
              onEmotionUpdate={(data) => {
                setTapCount(data.tapCount);
                setEmotionState(data.emotionState);
                onEmotionUpdate?.(data);
              }}
            />
            {/* 3D Emotion Counter */}
            <EmotionCounter tapCount={tapCount || 0} />
            {/* ParticleEffects inside Fisheye but with larger spawn areas */}
            <ParticleEffects />
          </Fisheye>
        </Suspense>
      </FullScreenCanvas>
    </>
  );
};

export default Scene;

type FullScreenCanvasProps = {
  children: any;
  onPointerMissed?: () => void;
};

const FullScreenCanvas = ({
  children,
  onPointerMissed,
  ...props
}: FullScreenCanvasProps) => {
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
      onPointerMissed={onPointerMissed}
      {...props}
    >
      {children}
    </Canvas>
  );
};
