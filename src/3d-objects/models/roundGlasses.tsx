import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useGameStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    Object_3001: THREE.Mesh;
  };
  materials: {
    ["Material.002"]: THREE.MeshPhysicalMaterial;
  };
};

const PATH = "gltf/chicken-little-glasses.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
}

export const RoundGlasses = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;
  const { previewMode } = useGameStore();

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
        geometry={nodes.Object_3001.geometry}
        rotation={[-1.65, 0, 0]}
      >
        <meshToonMaterial
          color={"#191919"}
          {...(previewMode === "accessory" ? previewMaterialProps : {})}
        />
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
