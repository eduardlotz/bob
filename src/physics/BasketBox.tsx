import React from "react";
import { RigidBody, CuboidCollider, RigidBodyProps } from "@react-three/rapier";

type CardBoxProps = RigidBodyProps & {
  width?: number;
  height?: number;
  depth?: number;
  wallThickness?: number;
  debug?: boolean;
};

export const BasketBox: React.FC<CardBoxProps> = ({
  width = 4,
  height = 3,
  depth = 4,
  wallThickness = 0.2,
  debug = false,
  ...props
}) => {
  const opacity = debug ? 0.3 : 0;
  return (
    <RigidBody type="fixed" colliders={false} {...props}>
      {/* Visual Mesh */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#f0a500"
          transparent
          opacity={opacity}
          wireframe={false}
        />
      </mesh>

      {/* Floor */}
      <CuboidCollider
        args={[width / 2, wallThickness / 2, depth / 2]}
        position={[0, -height / 2 + wallThickness / 2, 0]}
      />

      {/* Left Wall */}
      <CuboidCollider
        args={[wallThickness / 2, height / 2, depth / 2]}
        position={[-width / 2 + wallThickness / 2, 0, 0]}
      />

      {/* Right Wall */}
      <CuboidCollider
        args={[wallThickness / 2, height / 2, depth / 2]}
        position={[width / 2 - wallThickness / 2, 0, 0]}
      />

      {/* Back Wall */}
      <CuboidCollider
        args={[width / 2, height / 2, wallThickness / 2]}
        position={[0, 0, -depth / 2 + wallThickness / 2]}
      />

      {/* Front Wall */}
      <CuboidCollider
        args={[width / 2, height / 2, wallThickness / 2]}
        position={[0, 0, depth / 2 - wallThickness / 2]}
      />
    </RigidBody>
  );
};
