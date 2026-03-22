import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useViewStore } from "@/store";
import { useFloatingBar } from "@/layout/FloatingBar";
import { getLocale } from "@/i18n";
import { cardboxMessages } from "./cardbox.messages";

type GLTFResult = GLTF & {
  nodes: {
    cardbox: THREE.Mesh;
    box_lid_left: THREE.Mesh;
    box_lid_right: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/cardbox.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const CardboxModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const box = useRef<THREE.Mesh>(null);
    const lidLeft = useRef<THREE.Mesh>(null);
    const lidRight = useRef<THREE.Mesh>(null);

    // expose mesh refs upward
    if (ref) {
      ref.current = {
        box,
        lidLeft,
        lidRight,
      };
    }

    const { currentView } = useViewStore();
    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();
      const locale = getLocale();

      if (currentView !== "cardbox")
        setHoveredObject({
          title: cardboxMessages[locale].floatingLabel,
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
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            ref={box}
            geometry={nodes.cardbox.geometry}
            material={materials["Material.001"]}
            castShadow
            receiveShadow
          />

          <mesh
            ref={lidLeft}
            geometry={nodes.box_lid_left.geometry}
            material={materials["Material.001"]}
            castShadow
            receiveShadow
          />

          <mesh
            ref={lidRight}
            geometry={nodes.box_lid_right.geometry}
            material={materials["Material.001"]}
            castShadow
            receiveShadow
          />
        </group>
      </group>
    );
  },
);

useGLTF.preload(PATH);
