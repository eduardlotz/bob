import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Group, Mesh, MathUtils } from "three";

export function BlobHead({
  onHeadClick,
  motionPermissionGranted: permissionGranted,
}: {
  onHeadClick: () => void;
  motionPermissionGranted: boolean;
}) {
  const headRef = useRef<Group>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const { orientation, acceleration } = useDeviceOrientation();
  const isMobile =
    typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

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
    if (headRef.current) {
      const maxRotationY = 0.8;
      const maxRotationX = 0.8;
      let targetRotX, targetRotY, targetRotZ;

      if (isMobile && orientation && acceleration && permissionGranted) {
        const accelX = MathUtils.clamp(acceleration.x || 0, -5, 5) / 5; // [-1, 1]
        const accelY = MathUtils.clamp(acceleration.y || 0, -5, 5) / 5;

        // Normalize orientation beta (front-back tilt) from [-180°, 180°] to [-1, 1]
        const orientBeta = MathUtils.clamp((orientation.beta ?? 0) / 90, -1, 1);
        // Normalize orientation gamma (side tilt) from [-90°, 90°] to [-1, 1]
        const orientGamma = MathUtils.clamp(
          (orientation.gamma ?? 0) / 90,
          -1,
          1
        );

        // Blend acceleration and orientation for smoother result
        // Negative accelY means tilting forward (top of phone down)
        const blendX = accelY * -0.6 + orientBeta * -0.5;
        const blendY = accelX * 0.6 + orientGamma * 0.4;
        const blendZ = accelX * -0.3 + orientGamma * -0.3;

        // Default rotation facing user in portrait mode
        targetRotX = blendX;
        targetRotY = blendY;
        targetRotZ = blendZ;

        // Shake-based drag effect — create a "shake offset" that reacts and returns
        const shakeStrength = 0.5;
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
      // headRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }

    // Eye blinking
    if (leftEyeRef.current && rightEyeRef.current) {
      const targetScaleY = blinking ? 0.1 : 1;
      leftEyeRef.current.scale.y = MathUtils.lerp(
        leftEyeRef.current.scale.y,
        targetScaleY,
        1 - Math.exp(-6 * delta)
      );
      rightEyeRef.current.scale.y = MathUtils.lerp(
        rightEyeRef.current.scale.y,
        targetScaleY,
        1 - Math.exp(-6 * delta)
      );
    }
  });

  return (
    <group
      ref={headRef}
      onClick={onHeadClick}
      castShadow
      rotation={[0, Math.PI, 0]}
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
