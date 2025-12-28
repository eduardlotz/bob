import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useGLTF, Wireframe } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useGameStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    ["Cylinder001_02_-_Default_0"]: THREE.Mesh;
    ["Cylinder001_01_-_Default_0"]: THREE.Mesh;
    ["Cylinder001_03_-_Default_0"]: THREE.Mesh;
  };
  materials: {
    ["02_-_Default"]: THREE.MeshStandardMaterial;
    ["01_-_Default"]: THREE.MeshStandardMaterial;
    ["03_-_Default"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/krusty-krab-hat.gltf";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
}

export const KrustyKrabHat = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
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
      key={Number(props.preview)}
      ref={group}
      scale={spring.scale.get() as [number, number, number]}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
    >
      <group
        position={[-1.005, 0, -0.675]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.823, 0.773, 1]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Cylinder001_02_-_Default_0"].geometry}
          material={materials["02_-_Default"]}
        >
          <meshToonMaterial
            color={"#191919"}
            {...(props.preview ? previewMaterialProps : {})}
          />
          {props.preview && (
            <Wireframe thickness={0.04} backfaceStroke={outlineColor} />
          )}
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Cylinder001_01_-_Default_0"].geometry}
          material={materials["01_-_Default"]}
        >
          <meshToonMaterial
            color={"white"}
            {...(props.preview ? previewMaterialProps : {})}
          />
          {props.preview && (
            <Wireframe thickness={0.04} backfaceStroke={outlineColor} />
          )}
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Cylinder001_03_-_Default_0"].geometry}
          material={materials["03_-_Default"]}
        >
          <meshToonMaterial
            color="#75d1f0"
            {...(props.preview ? previewMaterialProps : {})}
          />
          {props.preview && (
            <Wireframe thickness={0.04} backfaceStroke={outlineColor} />
          )}
        </mesh>
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
