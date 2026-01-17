import * as THREE from "three";
import { useMemo, useRef } from "react";
import {
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
  CylinderCollider,
  CapsuleCollider,
} from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

interface FootBallKeeperProps {
  position: [number, number, number];
  scale?: number;

  amplitudeX?: number;
  amplitudeY?: number;
  speed?: number;

  size?: [number, number, number];
}

export function FootBallKeeper({
  position,
  scale = 1,
  amplitudeX = 2,
  amplitudeY = 1,
  speed = 2,
  size = [1, 1, 4],
}: FootBallKeeperProps) {
  const bodyRef = useRef<RapierRigidBody>(null);

  const basePosition = useMemo(
    () => new THREE.Vector3(...position),
    [position],
  );

  const material = useMemo(
    () => new THREE.MeshToonMaterial({ color: "yellow" }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;

    const x = Math.sin(t) * amplitudeX;
    const y = Math.sin(t * 0.85) * amplitudeY;

    bodyRef.current?.setNextKinematicTranslation({
      x: basePosition.x + x,
      y: basePosition.y + y,
      z: basePosition.z,
    });
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={position}
      colliders={false}
    >
      <CapsuleCollider args={[(size[1] / 2) * scale, size[0] * scale]} />

      <group scale={scale}>
        <mesh material={material}>
          <capsuleGeometry
            args={[size[0] * scale, size[1] * scale, size[2] * scale, 8]}
          />
          <Outlines thickness={0.03} color="#000000" screenspace />
        </mesh>
      </group>
    </RigidBody>
  );
}
