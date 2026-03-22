import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { Outlines, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Grabbable } from "@/physics/Grabbable";

type GLTFResult = GLTF & {
  nodes: {
    Table_Tennis_Paddle_Cube033_1: THREE.Mesh;
    Table_Tennis_Paddle_Cube033_1_1: THREE.Mesh;
    Table_Tennis_Paddle_Cube033_1_2: THREE.Mesh;
  };
  materials: {
    DD9944: THREE.MeshStandardMaterial;
    ["1A1A1A"]: THREE.MeshStandardMaterial;
    F44336: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/pingpong-paddle.glb";

interface Props {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  enablePhysics?: boolean;
}

export const PingPongPaddle = forwardRef(
  (
    {
      scale = [1, 1, 1],
      position = [0, 0, 0],
      outlineColor = "#4a1919",
      enablePhysics = false,
      ...props
    }: Props,
    ref: any,
  ) => {
    const rigidRef = useRef<RapierRigidBody>(null);

    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const model = (
      <group
        ref={ref}
        scale={scale}
        castShadow
        receiveShadow
        position={position}
        rotation={props.rotation}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Table_Tennis_Paddle_Cube033_1.geometry}
          material={materials.DD9944}
        >
          <Outlines thickness={0.02} color={"#000000"} screenspace />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Table_Tennis_Paddle_Cube033_1_1.geometry}
          material={materials["1A1A1A"]}
        >
          <Outlines thickness={0.02} color={"#000000"} screenspace />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Table_Tennis_Paddle_Cube033_1_2.geometry}
          material={materials.F44336}
        >
          <Outlines thickness={0.02} color={"#000000"} screenspace />
        </mesh>
      </group>
    );

    if (!enablePhysics) return model;

    return (
      <Grabbable
        stiffness={100}
        damping={5}
        rigidBodyRef={rigidRef}
        mode="spring"
      >
        <RigidBody
          {...props}
          ref={rigidRef}
          colliders="trimesh"
          restitution={0.3}
          friction={0.8}
        >
          {model}
        </RigidBody>
      </Grabbable>
    );
  },
);

useGLTF.preload(PATH);
