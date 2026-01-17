import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Outlines, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

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

const PATH = "gltf/pingpong-paddle.glb";

interface Props {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
}

export const PingPongPaddle = ({
  scale = [1, 1, 1],
  position = [0, 0, 0],
  outlineColor = "#4a1919",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  const [spring, api] = useSpring(() => ({
    scale: [0, 0, 0], // start invisible
    config: { tension: 200, friction: 15 },
  }));

  useEffect(() => {
    api.start({
      scale: scale,
      config: { tension: 300, friction: 10 },
    });
  }, []);

  return (
    <a.group
      ref={group}
      scale={spring.scale.get() as [number, number, number]}
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
    </a.group>
  );
};

useGLTF.preload(PATH);
