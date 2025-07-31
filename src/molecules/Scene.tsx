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
import { Physics, RigidBody } from "@react-three/rapier";
import { useRoute } from "@/contexts/RouteContext";
import { OrbitingObjects } from "./OrbitingObjects";

export const Scene = ({
  permissionGranted,
  modalIsOpen = false,
}: {
  permissionGranted: boolean;
  modalIsOpen?: boolean;
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const cameraControlsRef = useRef<CameraControls>(null!);
  const { currentRoute } = useRoute();
  const [objectsVisible, setObjectsVisible] = useState(false);

  useKeyPress("Escape", () => {
    if (showOptions) {
      setShowOptions(false);
    }
  });

  const hideOptionsIfOpen = () => {
    if (!modalIsOpen && showOptions) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    console.log("🚀 ~ Scene ~ currentRoute.sceneObject:", currentRoute);
    if (!showOptions && currentRoute.sceneObjects.length > 0) {
      setObjectsVisible(true);
    } else {
      setObjectsVisible(false);
    }
  }, [showOptions, currentRoute.sceneObjects]);

  const handleObjectClick = (object: any) => {
    console.log("Object clicked:", object);
    if (object.onClick) {
      object.onClick();
    }
  };

  return (
    <FullScreenCanvas onPointerMissed={hideOptionsIfOpen}>
      <Physics>
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
          <RigidBody type="fixed" position={[0, -2, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshToonMaterial transparent opacity={0} />
            </mesh>
          </RigidBody>
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

          <OrbitingObjects
            objects={currentRoute.sceneObjects}
            isVisible={objectsVisible}
            onObjectClick={handleObjectClick}
          />

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
