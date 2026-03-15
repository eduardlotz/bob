import * as THREE from "three";
import React, { forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";

type GLTFResult = GLTF & {
  nodes: {
    Sphere: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/globe.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const GlobeModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Fotografie",
      });
    };

    const handlePointerLeave = () => {
      setHoveredObject(null);
    };

    return (
      <group
        {...props}
        scale={scale}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Sphere.geometry}
          // material={materials["Material.001"]}
        >
          <meshToonMaterial color="#5F9EE8" />
        </mesh>
      </group>
    );
  },
);

useGLTF.preload(PATH);
