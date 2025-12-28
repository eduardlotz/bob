import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import { Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { TreeModel } from "./models/tree";

const sharedStarGeo = new PlaneGeometry(1, 1);
const sharedStarMat = new MeshBasicMaterial({
  transparent: true,
  opacity: 0.8,
});
export function Decoration2D({
  type,
  position,
  scale,
  rotation,
  color,
  preview,
}: {
  type: string;
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
  preview: boolean;
}) {
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(() => {
    const m = sharedStarMat.clone();
    m.color.set(color);
    return m;
  }, [color]);

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
          <mesh
            ref={meshRef}
            geometry={sharedStarGeo}
            material={material}
            position={position}
          />
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
  preview,
}: {
  type: string;
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
  preview: boolean;
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
        return (
          <TreeModel
            position={position}
            scale={[scale, scale, scale]}
            preview={preview}
          />
        );

      default:
        return null;
    }
  };

  return renderDecoration();
}

// Main Decorations Container
export function SceneDecorations() {
  const { decorations, previewMode } = useGameStore();
  const preview =
    previewMode === "3d" ||
    previewMode === "2d" ||
    previewMode === "decoration";
  const activeDecorations = preview
    ? decorations.filter((d) => d.preview)
    : decorations.filter((d) => d.enabled);

  return (
    <group>
      {activeDecorations.map((decoration) => {
        if (decoration.type === "2d") {
          return (
            <Decoration2D
              key={decoration.id}
              type={decoration.id}
              position={decoration.position}
              scale={decoration.scale}
              rotation={decoration.rotation}
              color={decoration.color}
              preview
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
              preview
            />
          );
        }
      })}
    </group>
  );
}
