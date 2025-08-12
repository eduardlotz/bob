import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

type GLTFResult = GLTF & {
  nodes: {
    Cube033: THREE.Mesh;
    Cube033_1: THREE.Mesh;
    Cube033_2: THREE.Mesh;
    Cube033_3: THREE.Mesh;
    Cube033_4: THREE.Mesh;
    Cube033_5: THREE.Mesh;
    Cube033_6: THREE.Mesh;
    Cube033_7: THREE.Mesh;
    Cube033_8: THREE.Mesh;
  };
  materials: {
    ["BrownDark.049"]: THREE.MeshStandardMaterial;
    ["PurpleDark.003"]: THREE.MeshStandardMaterial;
    ["White.034"]: THREE.MeshStandardMaterial;
    ["Metal.080"]: THREE.MeshStandardMaterial;
    ["BlueDark.003"]: THREE.MeshStandardMaterial;
    ["GreenDark.007"]: THREE.MeshStandardMaterial;
    ["WoodDark.005"]: THREE.MeshStandardMaterial;
    ["StoneDark.001"]: THREE.MeshStandardMaterial;
    ["Black.030"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/bookshelf.gltf";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const BookshelfModel = ({ scale = [1, 1, 1], ...props }: Props) => {
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
      position={props.position}
      rotation={props.rotation}
    >
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh
          geometry={nodes.Cube033.geometry}
          material={materials["BrownDark.049"]}
        />
        <mesh
          geometry={nodes.Cube033_1.geometry}
          material={materials["PurpleDark.003"]}
        />
        <mesh
          geometry={nodes.Cube033_2.geometry}
          material={materials["White.034"]}
        />
        <mesh
          geometry={nodes.Cube033_3.geometry}
          material={materials["Metal.080"]}
        />
        <mesh
          geometry={nodes.Cube033_4.geometry}
          material={materials["BlueDark.003"]}
        />
        <mesh
          geometry={nodes.Cube033_5.geometry}
          material={materials["GreenDark.007"]}
        />
        <mesh
          geometry={nodes.Cube033_6.geometry}
          material={materials["WoodDark.005"]}
        />
        <mesh
          geometry={nodes.Cube033_7.geometry}
          material={materials["StoneDark.001"]}
        />
        <mesh
          geometry={nodes.Cube033_8.geometry}
          material={materials["Black.030"]}
        />
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
