import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Grabbable } from "@/physics/Grabbable";

type GLTFResult = GLTF & {
  nodes: {
    DJGear_mesh: THREE.Mesh;
  };
  materials: {
    DJGear_mat: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/dj-controller.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const DjControllerModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    return (
      <mesh
        position={props.position}
        geometry={nodes.DJGear_mesh.geometry}
        material={materials.DJGear_mat}
        scale={0.13}
      />
    );
  },
);

useGLTF.preload(PATH);
