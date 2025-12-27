import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Outlines, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useGameStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    Sphere004: THREE.Mesh;
  };
  materials: {
    hair: THREE.MeshBasicMaterial;
  };
};

const PATH = "gltf/bob-boolean.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
}

export const AfroHair = ({
  scale = [1, 1, 1],
  outlineColor = "#4a1919",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;
  const { previewMode } = useGameStore();

  materials["hair"].transparent = previewMode === "hat";
  materials["hair"].wireframe = previewMode === "hat";
  // materials["hair"].opacity = previewMode === "hat" ? 0.5 : 1;

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
        castShadow
        receiveShadow
        geometry={nodes.Sphere004.geometry}
        material={materials.hair}
        position={[0, 1.406, -0.603]}
        rotation={[0.294, 0, 0]}
        scale={[1.34, 0.966, 1.262]}
      >
        <Outlines
          thickness={0.02}
          color={outlineColor}
          screenspace
          {...(previewMode === "hat" ? previewMaterialProps : {})}
        />
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
