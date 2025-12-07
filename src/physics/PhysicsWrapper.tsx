import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
  RigidBodyProps,
} from "@react-three/rapier";
import { Vector3, Quaternion } from "three";

// We define the props the wrapper needs, combining Rapier props and custom props
interface PhysicsWrapperProps extends RigidBodyProps {
  // Required: The actual geometry object (e.g., nodes.Xbox_Controller.geometry)
  geometry: THREE.BufferGeometry;
  // The final scale applied to the visual model
  targetScale?: number;
  // Optional: A ref to get external access to the Rapier RigidBody
  physicsRef?: React.Ref<RapierRigidBody>;
}

export const PhysicsWrapper: React.FC<PhysicsWrapperProps> = ({
  geometry,
  targetScale = 1,
  children,
  physicsRef,
  ...props
}) => {
  // Calculate the required collider size and position offset based on the geometry
  const { size, centerOffset } = useMemo(() => {
    // Ensure the bounding box data is calculated
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;

    const meshSize = new THREE.Vector3();
    box.getSize(meshSize); // Dimensions (Width, Height, Depth)

    const meshCenter = new THREE.Vector3();
    box.getCenter(meshCenter); // Center offset from the model's pivot [0,0,0]

    // 1. Calculate Half-Extents (Rapier's size format) and scale it
    const halfExtents: [number, number, number] = [
      (meshSize.x * targetScale) / 2,
      (meshSize.y * targetScale) / 2,
      (meshSize.z * targetScale) / 2,
    ];

    // 2. Scale the center offset to match the final model size
    const finalCenter: [number, number, number] = [
      meshCenter.x * targetScale,
      meshCenter.y * targetScale,
      meshCenter.z * targetScale,
    ];

    return { size: halfExtents, centerOffset: finalCenter };
  }, [geometry, targetScale]);

  return (
    <RigidBody
      ref={physicsRef}
      colliders={false} // Disable automatic collider generation
      {...props} // Pass through position, mass, type, etc.
    >
      {/* The Collider: Uses the calculated size and offset.
        This ensures the collision shape is perfectly centered on the visual mesh.
      */}
      <CuboidCollider
        args={size}
        position={centerOffset} // Corrects the pivot offset
      />

      {/* The Visual Model: Children are rendered here.
        They must apply the final targetScale and maintain their internal rotation/position.
      */}
      {children}
    </RigidBody>
  );
};
