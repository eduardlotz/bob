import * as THREE from "three";
import React, { forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    baguette: THREE.Mesh;
  };
  materials: {
    tiny_treats_1: THREE.MeshStandardMaterial;
  };
};
const PATH = "gltf/baguette.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const BaguetteModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    return (
      <mesh
        geometry={nodes.baguette.geometry}
        material={materials.tiny_treats_1}
        // scale={100}
      />
    );
  }
);

useGLTF.preload(PATH);
