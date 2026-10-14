import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { easing } from "maath";
import { PingPongPaddle } from "./models/pingPongPaddle";

export const Paddle = React.forwardRef<
  RapierRigidBody,
  { onCollide: (p: any) => void; tiltInput?: React.RefObject<{ x: number; y: number }> }
>(({ onCollide, tiltInput }, ref) => {
  const visualGroup = useRef<THREE.Group>(null!);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const input = useMemo(() => new THREE.Vector2(), []);
  const rotation = useMemo(() => new THREE.Quaternion(), []);
  const rotationAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const paddleRef = ref as React.MutableRefObject<RapierRigidBody>;

  useFrame((state, delta) => {
    if (!paddleRef.current) return;

    const target = tiltInput?.current ?? state.pointer;
    input.lerp(target, 1 - Math.exp(-delta * 14));
    vec.set(input.x, input.y, 0.5).unproject(state.camera);
    dir.copy(vec).sub(state.camera.position).normalize();
    vec.add(dir.multiplyScalar(state.camera.position.length()));

    paddleRef.current.setNextKinematicTranslation({
      x: vec.x * 1.5,
      y: vec.y,
      z: 0,
    });

    rotation.setFromAxisAngle(rotationAxis, input.x * 0.4);
    paddleRef.current.setNextKinematicRotation(rotation);

    easing.damp3(visualGroup.current.position, [0, 0, 0], 0.15, delta);
  });

  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders={false}
      onContactForce={(e) => {
        onCollide(e);
        // if (e.totalForceMagnitude > 50) visualGroup.current.position.y = -0.15;
      }}
    >
      <CylinderCollider args={[0.1, 1]} position={[0, 0, 0.5]} />
      <group ref={visualGroup}>
        <PingPongPaddle
          position={[0, 0, 3]}
          scale={[1, 1, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
    </RigidBody>
  );
});
