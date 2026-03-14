import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useViewStore } from "@/store";
import { useFloatingBar } from "@/layout/FloatingBar";

type GLTFResult = GLTF & {
  nodes: {
    Cube033: THREE.Mesh;
    Cube033_1: THREE.Mesh;
    Cube033_2: THREE.Mesh;
    Cube033_3: THREE.Mesh;
    Cube033_4: THREE.Mesh;
    Cube033_5: THREE.Mesh;
    Cube033_6: THREE.Mesh;
    Cube033_7: THREE.Mesh;
    Cube033_8: THREE.Mesh;
  };
  materials: {
    ["BrownDark.049"]: THREE.MeshStandardMaterial;
    ["PurpleDark.003"]: THREE.MeshStandardMaterial;
    ["White.034"]: THREE.MeshStandardMaterial;
    ["Metal.080"]: THREE.MeshStandardMaterial;
    ["BlueDark.003"]: THREE.MeshStandardMaterial;
    ["GreenDark.007"]: THREE.MeshStandardMaterial;
    ["WoodDark.005"]: THREE.MeshStandardMaterial;
    ["StoneDark.001"]: THREE.MeshStandardMaterial;
    ["Black.030"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/bookshelf.gltf";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  /**
   * When true, the coloured book meshes (Cube033_1 … Cube033_8) are hidden so
   * BookshelfBooks can overlay R3F-generated books in their place.
   * The shelf frame (Cube033 / BrownDark) is always rendered.
   */
  hideGltfBooks?: boolean;
}

export const BookshelfModel = ({
  scale = [1, 1, 1],
  hideGltfBooks = false,
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;

  const [spring, api] = useSpring(() => ({
    scale: [0, 0, 0],
    config: { tension: 200, friction: 15 },
  }));

  useEffect(() => {
    api.start({ scale, config: { tension: 300, friction: 10 } });
  }, []);

  const { currentView } = useViewStore();
  const { setHoveredObject } = useFloatingBar();

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();
    if (currentView !== "bookshelf")
      setHoveredObject({ title: "Buchsammlung" });
  };

  const handlePointerLeave = () => setHoveredObject(null);

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
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Shelf frame — always rendered */}
        <mesh
          geometry={nodes.Cube033.geometry}
          material={materials["BrownDark.049"]}
        />

        {/* Book meshes — hidden when using R3F-generated books */}
        {!hideGltfBooks && (
          <>
            <mesh
              geometry={nodes.Cube033_1.geometry}
              material={materials["PurpleDark.003"]}
            />
            <mesh
              geometry={nodes.Cube033_2.geometry}
              material={materials["White.034"]}
            />
            <mesh
              geometry={nodes.Cube033_4.geometry}
              material={materials["BlueDark.003"]}
            />
            <mesh
              geometry={nodes.Cube033_5.geometry}
              material={materials["GreenDark.007"]}
            />
            <mesh
              geometry={nodes.Cube033_6.geometry}
              material={materials["WoodDark.005"]}
            />
            <mesh
              geometry={nodes.Cube033_7.geometry}
              material={materials["StoneDark.001"]}
            />
            <mesh
              geometry={nodes.Cube033_8.geometry}
              material={materials["Black.030"]}
            />
          </>
        )}
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
