import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Group, Mesh, MathUtils, Vector3, Clock } from "three";
import {
  CAMERA_Y_POSITION,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "./HeadNavigation";
import { CameraControls } from "@react-three/drei";
import { calculateAcceleratedRotation } from "@/utils/math";
import { a, useSpring } from "@react-spring/three";
import { Star3D } from "@/3d-objects/Star3D";

// TODO: Move these constants to a shared config file
// Default head position Y

const HEAD_POSITION_Y = 0;
const MAX_ROTATION_X = 0.9;
const MAX_ROTATION_Y = 0.9;

export function BlobHead({
  onHeadClick,
  motionPermissionGranted: permissionGranted,
  isMobile,
  cameraControlsRef,
  showOptions,
}: {
  onHeadClick: () => void;
  motionPermissionGranted: boolean;
  isMobile: boolean;
  cameraControlsRef: React.RefObject<CameraControls>;
  showOptions: boolean;
}) {
  const headRef = useRef<Group>(null!);
  const leftEyeRef = useRef<Mesh>(null!);
  const rightEyeRef = useRef<Mesh>(null!);
  const rightBrowRef = useRef<Mesh>(null!);
  const leftBrowRef = useRef<Mesh>(null!);
  const starRef = useRef<Mesh>(null!);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const { orientation, acceleration } = useDeviceOrientation();
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const [isTipsy, setIsTipsy] = useState(false);
  const tipsyStartTimeRef = useRef<number | null>(null);

  // Keep a ref to spring api for fine-grained control
  const [spring, api] = useSpring(() => ({
    scale: [0, 0, 0], // start invisible
    config: { tension: 200, friction: 15 },
  }));

  // Trigger spawn animation once on mount
  useEffect(() => {
    api.start({
      scale: [1.2, 1.2, 1.2],
      delay: 1500,
      config: { tension: 300, friction: 10 },
    });
  }, []);

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

  // Animation for head movement and camera positioning
  useFrame(({ clock }, delta) => {
    // Handle device motion for mobile
    if (isMobile && orientation && acceleration && permissionGranted) {
      handleMobileMovement(clock, delta);
    } else {
      // Handle mouse movement for desktop
      handleDesktopMovement(clock, delta);
    }

    // Common animations regardless of device
    // Eye blinking animation
    const targetScaleY = blinking ? 0.1 : 1;
    leftEyeRef.current.scale.y = MathUtils.lerp(
      leftEyeRef.current.scale.y,
      targetScaleY,
      0.3
    );
    rightEyeRef.current.scale.y = MathUtils.lerp(
      rightEyeRef.current.scale.y,
      targetScaleY,
      0.3
    );

    // Animate tipsy state
    if (isTipsy && tipsyStartTimeRef.current) {
      const elapsed = clock.getElapsedTime() - tipsyStartTimeRef.current / 1000;
      const wobble = Math.sin(elapsed * 10) * 0.5;
      headRef.current.rotation.z += wobble * delta;

      leftEyeRef.current.scale.y = MathUtils.lerp(
        leftEyeRef.current.scale.y,
        0.2,
        0.5
      );

      rightEyeRef.current.scale.y = MathUtils.lerp(
        rightEyeRef.current.scale.y,
        0.2,
        0.5
      );
    }

    if (isTipsy && starRef.current) {
      starRef.current.rotation.y += delta * 4 * Math.random();
      starRef.current.rotation.z += delta * 2;
    }
  });

  // Handle mobile device motion
  const handleMobileMovement = (clock: Clock, delta: number) => {
    const {
      targetRotX,
      targetRotY,
      targetRotZ,
      accelX,
      accelY,
      orientGamma,
      orientBeta,
    } = calculateAcceleratedRotation(acceleration, orientation);

    // Apply mobile specific head rotation
    applyHeadRotation(-targetRotY, -targetRotX, 0, delta);

    // Apply mobile specific head position (shake effect)
    applyMobileHeadPosition(
      clock,
      delta,
      accelX,
      accelY,
      orientGamma,
      orientBeta
    );

    // Set camera look-at for mobile
    // Using normalized direction vector approach
    const lookDirection = new Vector3(
      targetRotX,
      targetRotY,
      targetRotZ
    ).normalize();
    const cameraPosition = new Vector3(
      0,
      CAMERA_Y_POSITION,
      showOptions ? VISIBLE_OPTIONS_CAMERA_ZOOM : HIDDEN_OPTIONS_CAMERA_ZOOM
    );
    const target = cameraPosition.clone().add(lookDirection);

    cameraControlsRef.current.setLookAt(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z,
      target.x,
      target.y, // Keep the +2 offset from original code
      target.z,
      true
    );
  };

  // Handle desktop mouse movement
  const handleDesktopMovement = (clock: Clock, delta: number) => {
    // Calculate target rotations based on mouse position
    const targetRotY = mousePosition.x * MAX_ROTATION_X;
    const targetRotX = mousePosition.y * MAX_ROTATION_Y;
    const targetRotZ = -mousePosition.x * MAX_ROTATION_X;

    // Apply desktop specific head rotation
    applyHeadRotation(targetRotX, targetRotY, targetRotZ, delta);

    // Apply breathing animation for head position
    const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    headRef.current.position.y = floatY + HEAD_POSITION_Y;

    // Set camera look-at for desktop
    const cursorPos = new Vector3(
      mousePosition.x * 0.2,
      mousePosition.y * 0.2,
      0
    );

    cameraControlsRef.current.setLookAt(
      0,
      CAMERA_Y_POSITION,
      showOptions ? VISIBLE_OPTIONS_CAMERA_ZOOM : HIDDEN_OPTIONS_CAMERA_ZOOM,
      cursorPos.x,
      cursorPos.y + 2,
      cursorPos.z,
      true
    );
  };

  // Common function to apply head rotation
  const applyHeadRotation = (
    rotX: number,
    rotY: number,
    rotZ: number,
    delta: number
  ) => {
    headRef.current.rotation.y = MathUtils.lerp(
      headRef.current.rotation.y,
      rotY,
      1 - Math.exp(-4 * delta)
    );
    headRef.current.rotation.x = MathUtils.lerp(
      headRef.current.rotation.x,
      rotX,
      1 - Math.exp(-4 * delta)
    );
    headRef.current.rotation.z = MathUtils.lerp(
      headRef.current.rotation.z,
      rotZ,
      1 - Math.exp(-3 * delta)
    );
  };

  // Mobile specific head position with shake effect
  const applyMobileHeadPosition = (
    clock: Clock,
    delta: number,
    accelX: number,
    accelY: number,
    orientGamma: number,
    orientBeta: number
  ) => {
    const shakeStrength = 0.6;
    const shakeOffsetX = MathUtils.clamp(accelX * shakeStrength, -0.4, 0.4);
    const shakeOffsetY = MathUtils.clamp(accelY * shakeStrength, -0.4, 0.4);

    // const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    const floatY = HEAD_POSITION_Y;

    headRef.current.position.x = MathUtils.lerp(
      headRef.current.position.x,
      shakeOffsetX + orientGamma * 0.2,
      1 - Math.exp(-2 * delta)
    );
    headRef.current.position.y = MathUtils.lerp(
      headRef.current.position.y,
      floatY + shakeOffsetY + orientBeta * 0.2,
      1 - Math.exp(-2 * delta)
    );
  };

  const onClick = () => {
    const now = Date.now();
    setClickTimestamps((prev) => {
      const recent = prev.filter((ts) => now - ts < 800);
      const updated = [...recent, now];
      if (updated.length >= 5) {
        setIsTipsy(true);
        tipsyStartTimeRef.current = now;
        setTimeout(() => setIsTipsy(false), 4000);
        return [];
      }
      return updated;
    });

    onHeadClick();
    api.start({
      scale: showOptions ? [1.2, 1.2, 1.2] : [0.7, 0.7, 0.7],
      config: { tension: 300, friction: 10 },
    });
  };

  return (
    <a.group
      ref={headRef}
      onClick={onClick}
      castShadow
      scale={spring.scale}
      rotation={[0, Math.PI, 0]}
      position={[0, 2, 0]}
    >
      {/* Head */}
      <mesh castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>

      {/* Eyes & Brows*/}
      <group position={[0, 0.2, 0.85]}>
        {/* <mesh
          ref={leftBrowRef}
          position={[-0.3, 0.25, 0]}
          rotation={[degToRad(145), degToRad(20), degToRad(90)]}
        >
          <capsuleGeometry args={[0.03, 0.2, 4]} />
          <meshToonMaterial color="black" />
        </mesh>
        <mesh
          ref={rightBrowRef}
          position={[0.3, 0.25, 0]}
          rotation={[degToRad(145), degToRad(-20), degToRad(-90)]}
        >
          <capsuleGeometry args={[0.03, 0.2, 4]} />
          <meshToonMaterial color="black" />
        </mesh> */}

        <mesh ref={leftEyeRef} position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color="black" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.3, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color="black" />
        </mesh>
      </group>

      {/* Spinning Stars */}
      {isTipsy &&
        [-0.4, 0, 0.4].map((offset, i) => (
          <Star3D position={[offset, 1.5 + (i % 2) * 0.1, offset * 0.5]} />
        ))}
    </a.group>
  );
}
