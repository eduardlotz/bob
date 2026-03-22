import * as THREE from "three";
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useViewStore } from "@/store";
import { getLocale } from "@/i18n";
import { deskMessages } from "./desk.messages";

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

const PATH = "/gltf/desk.gltf";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const DeskModel = ({ scale = [1, 1, 1], ...props }: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  const { currentView } = useViewStore();
  const { setHoveredObject } = useFloatingBar();

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();
    const locale = getLocale();

    if (currentView !== "desk")
      setHoveredObject({
        title: deskMessages[locale].floatingLabel,
      });
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
  };

  return (
    <group
      ref={group}
      scale={scale}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <mesh geometry={nodes.Cube007.geometry} material={materials.MetalBlack} />
      <mesh geometry={nodes.Cube007_1.geometry} material={materials.DeskWood} />
    </group>
  );
};

useGLTF.preload(PATH);
