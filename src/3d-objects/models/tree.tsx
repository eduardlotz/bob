import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Outlines, useGLTF, Wireframe } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { previewMaterialProps } from "@/shop-items/utils";

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
  outlineColor?: string;
  preview: boolean;
}

export const TreeModel = ({
  scale = [1, 1, 1],
  outlineColor = "#4a1919",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  materials["color_main"].transparent = props.preview;
  materials["color_main"].opacity = props.preview ? 0.25 : 1;

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
        geometry={nodes["tree-lime"].geometry}
        material={materials.color_main}
      >
        {/* {props.preview && <Wireframe thickness={0.04} />} */}
        <Outlines
          thickness={0.02}
          color={outlineColor}
          screenspace
          {...(props.preview ? previewMaterialProps : {})}
        />
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
