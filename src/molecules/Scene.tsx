import * as THREE from "three";
import {
  Fisheye,
  CameraControls,
  Environment,
  PerspectiveCamera,
  GradientTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { HeadNavigation } from "./HeadNavigation";

export const Scene = () => {
  const [showOptions, setShowOptions] = useState(false);
  const cameraControlsRef = useRef<CameraControls>(null!);

  return (
    <FullScreenCanvas>
      <Fisheye zoom={0}>
        <CameraControls
          ref={cameraControlsRef}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.6}
          maxDistance={4}
          minDistance={1.5}
        />
        <ambientLight intensity={2} />
        <PerspectiveCamera makeDefault position={[0, 0, 2]} />
        <directionalLight intensity={1} position={[2, 2, 5]} />
        <Environment preset="city" />
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial side={THREE.BackSide}>
            <GradientTexture
              stops={[0, 1]} // As many stops as you want
              colors={["#ffffff", "#C5BDD5", "#85799F"]} // Colors need to match the number of stops
              size={1024} // Size is optional, default = 1024
            />
          </meshBasicMaterial>
        </mesh>
        <HeadNavigation
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          cameraControlsRef={cameraControlsRef} // pass down for portal click
        />
      </Fisheye>
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
