import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Outlines, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

type GLTFResult = GLTF & {
  nodes: {
    ["tree-lime"]: THREE.Mesh;
  };
  materials: {
    color_main: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/tree.gltf";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const TreeModel = ({ scale = [1, 1, 1], ...props }: Props) => {
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
      <mesh
        geometry={nodes["tree-lime"].geometry}
        material={materials.color_main}
      >
        <Outlines thickness={0.05} color={"#000000"} screenspace />
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
