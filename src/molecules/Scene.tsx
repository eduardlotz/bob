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
import { useKeyPress } from "@/hooks/useKeyPress";
import { BackgroundPlanet } from "@/3d-objects/BackgroundPlanet";
import { Physics } from "@react-three/rapier";

export const Scene = ({
  permissionGranted,
}: {
  permissionGranted: boolean;
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const cameraControlsRef = useRef<CameraControls>(null!);

  useKeyPress("Escape", () => {
    if (showOptions) {
      setShowOptions(false);
    }
  });

  const hideOptionsIfOpen = () => {
    if (showOptions) {
      setShowOptions(false);
    }
  };

  return (
    <FullScreenCanvas>
      <Physics>
        <Fisheye zoom={0}>
          <Grid
            args={[8, 8]}
            sectionThickness={2}
            sectionColor="#E0DEE6"
            sectionSize={1}
            cellThickness={0}
            onClick={hideOptionsIfOpen}
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
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            cameraControlsRef={cameraControlsRef} // pass down for portal click
            permissionGranted={permissionGranted}
          />
        </Fisheye>
      </Physics>
    </FullScreenCanvas>
  );
};

const FullScreenCanvas = ({ children, ...props }: { children: any }) => {
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
