import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { Outlines, useGLTF, Wireframe } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useCoreStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    Cube_1: THREE.Mesh;
    Cube_2: THREE.Mesh;
    Cube_3: THREE.Mesh;
  };
  materials: {
    front: THREE.MeshStandardMaterial;
    body: THREE.MeshStandardMaterial;
    accent: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/astronaut.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
}

export const AstronautHelmet = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  materials["body"].transparent = props.preview;
  materials["body"].opacity = props.preview ? 0.25 : 1;
  materials["accent"].transparent = props.preview;
  materials["accent"].opacity = props.preview ? 0.25 : 1;
  // materials["front"].opacity = props.preview ? 0.25 : 1;
  // materials["front"].opacity = props.preview ? 0.25 : 1;

  materials["front"].transparent = true;
  materials["front"].opacity = 0.6;

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
      key={Number(props.preview)}
      ref={group}
      scale={spring.scale as any}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
    >
      <mesh geometry={nodes.Cube_1.geometry} material={materials.front} />
      <mesh geometry={nodes.Cube_2.geometry} material={materials.body} />
      <mesh geometry={nodes.Cube_3.geometry} material={materials.accent} />
    </a.group>
  );
};

useGLTF.preload(PATH);
