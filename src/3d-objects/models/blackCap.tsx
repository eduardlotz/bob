import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { Outlines, useGLTF, Wireframe } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useCoreStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    Sphere: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshBasicMaterial;
  };
};
const PATH = "gltf/peace-of-mind-cap.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
}

export const BlackCap = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  const gltfMat = materials["Material.001"];

  const toonMat = useMemo(() => {
    return new THREE.MeshToonMaterial({
      map: gltfMat.map ?? null,
      transparent: props.preview,
      opacity: props.preview ? 0.5 : 1,
      color: new THREE.Color(0xffffff),
    });
  }, [gltfMat, props.preview]);

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
      scale={spring.scale.get() as [number, number, number]}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
    >
      <mesh geometry={nodes.Sphere.geometry} material={toonMat}>
        <Outlines
          thickness={0.005}
          color={outlineColor}
          screenspace
          {...(props.preview ? previewMaterialProps : {})}
        />

        {/* {props.preview && (
          <Wireframe thickness={1} backfaceStroke={outlineColor} />
        )} */}
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
