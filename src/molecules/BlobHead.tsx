import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Group, Mesh, MathUtils } from "three";
import {
  CAMERA_Y_POSITION,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "./HeadNavigation";
import { CameraControls } from "@react-three/drei";
import { calculateAcceleratedRotation } from "@/utils/math";

const HEAD_POSITION_Y = 2;

export function BlobHead({
  onHeadClick,
  motionPermissionGranted: permissionGranted,
  isMobile,
  cameraControlsRef,
}: {
  onHeadClick: () => void;
  motionPermissionGranted: boolean;
  isMobile: boolean;
  cameraControlsRef: React.RefObject<CameraControls>;
}) {
  const headRef = useRef<Group>(null!);
  const leftEyeRef = useRef<Mesh>(null!);
  const rightEyeRef = useRef<Mesh>(null!);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const { orientation, acceleration } = useDeviceOrientation();

  // Track mouse position for head rotation
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking animation every 4-5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 4000 + Math.random() * 1000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Animation for head movement and blinking
  useFrame(({ clock }, delta) => {
    const maxRotationY = 0.9;
    const maxRotationX = 0.9;
    let targetRotX, targetRotY, targetRotZ;

    if (isMobile && orientation && acceleration && permissionGranted) {
      const {
        targetRotX: blendX,
        targetRotY: blendY,
        targetRotZ: blendZ,
        accelX,
        accelY,
        orientGamma,
        orientBeta,
      } = calculateAcceleratedRotation(acceleration, orientation);

      // Default rotation facing user in portrait mode
      targetRotX = blendX;
      targetRotY = blendY;
      targetRotZ = blendZ;

      // Shake-based drag effect — create a "shake offset" that reacts and returns
      const shakeStrength = 0.6;
      const shakeOffsetX = MathUtils.clamp(accelX * shakeStrength, -0.4, 0.4);
      const shakeOffsetY = MathUtils.clamp(accelY * shakeStrength, -0.4, 0.4);

      // Move position toward shake offset plus a tiny breathing motion
      const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      headRef.current.position.x = MathUtils.lerp(
        headRef.current.position.x,
        shakeOffsetX + orientGamma * 0.2,
        1 - Math.exp(-2 * delta)
      );
      headRef.current.position.y = MathUtils.lerp(
        headRef.current.position.y,
        floatY + shakeOffsetY + orientBeta * 0.1,
        1 - Math.exp(-2 * delta)
      );

      cameraControlsRef.current.setLookAt(
        0,
        CAMERA_Y_POSITION,
        VISIBLE_OPTIONS_CAMERA_ZOOM,
        targetRotY * 3,
        CAMERA_Y_POSITION + targetRotX * 3,
        0,
        true
      );
    } else {
      // Use mouse position
      targetRotY = mousePosition.x * maxRotationX;
      targetRotX = mousePosition.y * maxRotationY;
      targetRotZ = -mousePosition.x * maxRotationX;
    }

    // Head rotation
    headRef.current.rotation.y = MathUtils.lerp(
      headRef.current.rotation.y,
      targetRotY,
      1 - Math.exp(-4 * delta)
    );
    headRef.current.rotation.x = MathUtils.lerp(
      headRef.current.rotation.x,
      targetRotX,
      1 - Math.exp(-4 * delta)
    );
    headRef.current.rotation.z = MathUtils.lerp(
      headRef.current.rotation.z,
      targetRotZ,
      1 - Math.exp(-3 * delta)
    );

    // Prevent overriding the above motion
    headRef.current.position.y =
      Math.sin(clock.getElapsedTime() * 0.5) * 0.1 + HEAD_POSITION_Y;

    //TODO: use delta time
    // Eye blinking
    const targetScaleY = blinking ? 0.1 : 1;
    leftEyeRef.current.scale.y = MathUtils.lerp(
      leftEyeRef.current.scale.y,
      targetScaleY,
      // 1 - Math.exp(-6 * delta)
      0.3
    );
    rightEyeRef.current.scale.y = MathUtils.lerp(
      rightEyeRef.current.scale.y,
      targetScaleY,
      // 1 - Math.exp(-6 * delta)
      0.3
    );
  });

  return (
    <group
      ref={headRef}
      onClick={onHeadClick}
      castShadow
      rotation={[0, Math.PI, 0]}
      position={[0, 2, 0]}
    >
      {/* Head */}
      <mesh castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>

      {/* Eyes */}
      <group position={[0, 0.2, 0.85]}>
        <mesh ref={leftEyeRef} position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color="black" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.3, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color="black" />
        </mesh>
      </group>
    </group>
  );
}
