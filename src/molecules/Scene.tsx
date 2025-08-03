import {
  Fisheye,
  CameraControls,
  PerspectiveCamera,
  Grid,
  Environment,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { HeadNavigation } from "./HeadNavigation";
import { EmotionCounter } from "./EmotionBar";
import { useKeyPress } from "@/hooks/useKeyPress";
import { BackgroundPlanet } from "@/3d-objects/BackgroundPlanet";

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
        <Fisheye zoom={0}>
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
            maxDistance={10}
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

          <HeadNavigation
            showOptions={showOptions || false}
            setShowOptions={setShowOptions || (() => {})}
            cameraControlsRef={cameraControlsRef} // pass down for portal click
            permissionGranted={permissionGranted}
            onEmotionUpdate={(data) => {
              setTapCount(data.tapCount);
              onEmotionUpdate?.(data);
            }}
          />

          {/* 3D Emotion Counter */}
          <EmotionCounter tapCount={tapCount || 0} />
        </Fisheye>
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
