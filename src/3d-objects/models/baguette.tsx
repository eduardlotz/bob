import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import {
  DraggableRigidBody,
  DraggableRigidBodyProps,
} from "@/physics/DraggableRigidBody";

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
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const DraggableRigidBodyProps: Partial<DraggableRigidBodyProps> = {
      rigidBodyProps: {
        gravityScale: 3.5,
        linearDamping: 5,
        angularDamping: 0.2,
      },
      groupProps: {
        position: props.position,
        rotation: props.rotation,
        // scale: [0.02, 0.02, 0.02],
        scale: 100,
        ref: group,
        // onPointerEnter: handlePointerEnter,
        // onPointerLeave: handlePointerLeave,
      },
      boundingBox: [
        [-1, 1],
        [0.5, 1],
        [-1, 1],
      ],
      dragControlsProps: {
        preventOverlap: true,
      },
      // enableSpringJoint: true,
    };

    return (
      <DraggableRigidBody
        {...DraggableRigidBodyProps}
        visibleMesh={
          <mesh
            geometry={nodes.baguette.geometry}
            material={materials.tiny_treats_1}
            // scale={100}
          />
        }
      />
    );
  }
);

useGLTF.preload(PATH);
