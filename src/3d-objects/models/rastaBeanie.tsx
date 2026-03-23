import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Outlines, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    BézierCurve: THREE.Mesh;
    Cube: THREE.Mesh;
    BézierCurve002: THREE.Mesh;
  };
  materials: {
    hair: THREE.MeshStandardMaterial;
    rasta_beanie: THREE.MeshBasicMaterial;
    ["hair.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/rasta_beanie.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
}

export const RastaBeanie = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  materials["rasta_beanie"].transparent = props.preview;
  materials["rasta_beanie"].opacity = props.preview ? 0.25 : 1;
  materials["hair"].transparent = props.preview;
  materials["hair"].opacity = props.preview ? 0.25 : 1;
  materials["hair.001"].transparent = props.preview;
  materials["hair.001"].opacity = props.preview ? 0.25 : 1;

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
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BézierCurve.geometry}
        material={materials.hair}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BézierCurve002.geometry}
        material={materials["hair.001"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube.geometry}
        material={materials.rasta_beanie}
      >
        <Outlines
          thickness={0.005}
          color={outlineColor}
          screenspace
          {...(props.preview ? previewMaterialProps : {})}
        />
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
