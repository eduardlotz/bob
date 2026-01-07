import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store/core/store";
import { Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { TreeModel } from "./models/tree";
import { GrassShader } from "./GrassShader";
import { CloudEffect } from "./ParticleEffects";

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
  rotation?: number;
  color?: string;
  preview: boolean;
}) {
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(() => {
    const m = sharedStarMat.clone();
    if (color) m.color.set(color);
    return m;
  }, [color]);

  useFrame((state) => {
    if (meshRef.current && rotation) {
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
  rotation?: number;
  color?: string;
  preview: boolean;
}) {
  const renderDecoration = () => {
    switch (type) {
      case "tree_3d":
        return (
          <TreeModel
            position={position}
            scale={[scale, scale, scale]}
            preview={preview}
            rotation={[0, rotation ?? 0, 0]}
          />
        );
      case "grass_3d":
        return (
          <GrassShader
            position={position}
            scale={[scale, scale, scale]}
            preview={preview}
          />
        );
      case "clouds_3d":
        return <CloudEffect preview={preview} />;

      default:
        return null;
    }
  };

  return renderDecoration();
}

export function SceneDecorations() {
  const { decorations, previewMode } = useCoreStore();
  const decoPreviewActive =
    previewMode === "3d" ||
    previewMode === "2d" ||
    previewMode === "decoration";

  const activeDecorations = decoPreviewActive
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
              preview={decoPreviewActive && !decoration.enabled}
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
              preview={decoPreviewActive && !decoration.enabled}
            />
          );
        }
      })}
    </group>
  );
}
