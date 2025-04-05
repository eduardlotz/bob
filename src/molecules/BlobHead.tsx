import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Group, Mesh, MathUtils } from "three";

export function BlobHead({ onHeadClick }: { onHeadClick: () => void }) {
  const headRef = useRef<Group>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

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
  useFrame(({ clock }) => {
    if (headRef.current) {
      const maxRotationY = 0.8;
      const maxRotationX = 0.8;

      // Head rotation toward mouse position
      headRef.current.rotation.y = MathUtils.lerp(
        headRef.current.rotation.y,
        mousePosition.x * maxRotationX,
        0.4
      );
      headRef.current.rotation.x = MathUtils.lerp(
        headRef.current.rotation.x,
        mousePosition.y * maxRotationY,
        0.3
      );
      headRef.current.rotation.z = MathUtils.lerp(
        headRef.current.rotation.z,
        -mousePosition.x * maxRotationX,
        0.2
      );

      // Floating animation
      headRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }

    // Eye blinking
    if (leftEyeRef.current && rightEyeRef.current) {
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
    }
  });

  return (
    <group ref={headRef} onClick={onHeadClick} castShadow>
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
