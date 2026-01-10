import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody, CuboidCollider, ConeCollider } from "@react-three/rapier";

interface GoalPostProps {
  position: [number, number, number];
  scale?: number;
  onEnter: () => void;
  onLeave: () => void;
}

export function GoalPost({
  position,
  scale = 1,
  onEnter,
  onLeave,
}: GoalPostProps) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "white" }),
    []
  );

  const radius = 0.05 * scale;
  const height = 2 * scale;
  const width = 3 * scale;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* Left post */}
      <mesh position={[-width / 2, height / 2, 0]} material={material}>
        <cylinderGeometry args={[radius, radius, height, 16]} />
      </mesh>

      <CuboidCollider
        args={[radius, radius, width / 2]}
        position={[-width / 2, height / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Right post */}
      <mesh position={[width / 2, height / 2, 0]} material={material}>
        <cylinderGeometry args={[radius, radius, height, 16]} />
      </mesh>

      <CuboidCollider
        args={[radius, radius, width / 2]}
        position={[width / 2, height / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Crossbar */}
      <mesh
        position={[0, height, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={material}
      >
        <cylinderGeometry args={[radius, radius, width, 16]} />
      </mesh>

      <CuboidCollider
        args={[radius, radius, width / 2]}
        position={[0, height, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Trigger volume */}
      <CuboidCollider
        args={[width / 2, height / 2, 0.5 * scale]}
        position={[0, height / 2, -0.25 * scale]}
        sensor
        onIntersectionEnter={onEnter}
        onIntersectionExit={onLeave}
      />
    </RigidBody>
  );
}
