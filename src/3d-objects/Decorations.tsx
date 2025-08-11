import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import { Mesh, MathUtils } from "three";
import { TreeModel } from "./models/tree";

// 2D Decoration Component
export function Decoration2D({
  type,
  position,
  scale,
  rotation,
  color,
}: {
  type: string;
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      // Gentle rotation
      meshRef.current.rotation.z =
        rotation + state.clock.getElapsedTime() * 0.2;
    }
  });

  const renderDecoration = () => {
    switch (type) {
      case "star_2d":
        return (
          <mesh ref={meshRef} position={position}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        );
      case "heart_2d":
        return (
          <mesh ref={meshRef} position={position}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        );
      default:
        return null;
    }
  };

  return renderDecoration();
}

// 3D Decoration Component
export function Decoration3D({
  type,
  position,
  scale,
  rotation,
  color,
}: {
  type: string;
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.2;
      // Rotation animation
      meshRef.current.rotation.y =
        rotation + state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.x =
        Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  const renderDecoration = () => {
    switch (type) {
      case "cube_3d":
        return (
          <mesh ref={meshRef} position={position} scale={[scale, scale, scale]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      case "sphere_3d":
        return (
          <mesh ref={meshRef} position={position} scale={[scale, scale, scale]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      case "tree_3d":
        return <TreeModel position={position} scale={[scale, scale, scale]} />;
      default:
        return null;
    }
  };

  return renderDecoration();
}

// Main Decorations Container
export function SceneDecorations() {
  const { decorations } = useGameStore();

  const purchasedDecorations = decorations.filter((d) => d.purchased);

  return (
    <group>
      {purchasedDecorations.map((decoration) => {
        if (decoration.type === "2d") {
          return (
            <Decoration2D
              key={decoration.id}
              type={decoration.id}
              position={decoration.position}
              scale={decoration.scale}
              rotation={decoration.rotation}
              color={decoration.color}
            />
          );
        } else {
          return (
            <Decoration3D
              key={decoration.id}
              type={decoration.id}
              position={decoration.position}
              scale={decoration.scale}
              rotation={decoration.rotation}
              color={decoration.color}
            />
          );
        }
      })}
    </group>
  );
}
