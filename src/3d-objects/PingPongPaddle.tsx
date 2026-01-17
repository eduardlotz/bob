import * as THREE from "three";
import React, { useRef } from "react";
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
  { onCollide: (p: any) => void }
>(({ onCollide }, ref) => {
  const visualGroup = useRef<THREE.Group>(null!);
  const vec = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const paddleRef = ref as React.MutableRefObject<RapierRigidBody>;

  useFrame((state, delta) => {
    if (!paddleRef.current) return;

    vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
    dir.copy(vec).sub(state.camera.position).normalize();
    vec.add(dir.multiplyScalar(state.camera.position.length()));

    paddleRef.current.setNextKinematicTranslation({
      x: vec.x * 1.5,
      y: vec.y,
      z: 0,
    });

    paddleRef.current.setNextKinematicRotation({
      x: 0,
      y: 0,
      z: (state.pointer.x * Math.PI) / (Math.PI * 5),
      w: 1,
    });

    easing.damp3(visualGroup.current.position, [0, 0, 0], 0.15, delta);
  });

  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders={false}
      onContactForce={(e) => {
        onCollide(e);
        if (e.totalForceMagnitude > 50) visualGroup.current.position.y = -0.15;
      }}
    >
      <CylinderCollider args={[0.1, 1]} />
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
