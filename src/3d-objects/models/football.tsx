import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { RapierRigidBody } from "@react-three/rapier";
import {
  DraggableRigidBody,
  DraggableRigidBodyProps,
} from "@/physics/DraggableRigidBody";

type GLTFResult = GLTF & {
  nodes: {
    Soccerball__0: THREE.Mesh;
  };
  materials: {
    ["Scene_-_Root"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/football.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const FootballModel = ({ scale = [1, 1, 1] }: Props) => {
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  const DraggableRigidBodyProps: Partial<DraggableRigidBodyProps> = {
    // rigidBodyProps: {
    //   gravityScale: 3.5,
    //   linearDamping: 5,
    //   angularDamping: 0.2,
    // },
    groupProps: {
      position: [-Math.PI / 2, 0, 0],
      scale: 1.5,
    },
    boundingBox: [
      [-8, 8],
      [0.5, 8],
      [-8, 8],
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
          geometry={nodes.Soccerball__0.geometry}
          material={materials["Scene_-_Root"]}
          // rotation={[-Math.PI / 2, 0, 0]}
          scale={[3, 3, 3]}
        />
      }
    />
  );
};

useGLTF.preload(PATH);
