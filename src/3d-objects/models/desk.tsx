import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useViewStore } from "@/store";

type GLTFResult = GLTF & {
  nodes: {
    Cube007: THREE.Mesh;
    Cube007_1: THREE.Mesh;
  };
  materials: {
    MetalBlack: THREE.MeshStandardMaterial;
    DeskWood: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/desk.gltf";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const DeskModel = ({ scale = [1, 1, 1], ...props }: Props) => {
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

  const { currentView } = useViewStore();
  const { setHoveredObject } = useFloatingBar();

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();

    if (currentView !== "desk")
      setHoveredObject({
        title: "Musik & Mixes",
      });
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
  };

  return (
    <a.group
      ref={group}
      scale={spring.scale as any}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <mesh geometry={nodes.Cube007.geometry} material={materials.MetalBlack} />
      <mesh geometry={nodes.Cube007_1.geometry} material={materials.DeskWood} />
    </a.group>
  );
};

useGLTF.preload(PATH);
