import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { MeshTransmissionMaterial, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Grabbable } from "@/physics/Grabbable";
import { useCoreStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";
import { useFloatingBar } from "@/layout/FloatingBar";

type GLTFResult = GLTF & {
  nodes: {
    Plumbob_Material001_0: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshBasicMaterial;
  };
};

const PATH = "gltf/sims-plumbob.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  color?: string;
}

export const GreenDiamond = ({
  outlineColor = "#000000",
  color = "#b7e822",
  ...props
}: Props) => {
  const api = useRef<RapierRigidBody>(null);
  const { nodes } = useGLTF(PATH) as GLTFResult;
  const { previewMode } = useCoreStore();

  const { setHoveredObject } = useFloatingBar();

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();

    setHoveredObject({
      title: "Plumbob",
    });
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
  };

  return (
    <Grabbable rigidBodyRef={api} mode={"spring"}>
      <RigidBody
        {...props}
        ref={api}
        colliders="hull"
        restitution={0.5}
        friction={0.4}
      >
        <group rotation={[-Math.PI / 2, 0, 0]} scale={0.24}>
          <mesh
            geometry={nodes.Plumbob_Material001_0.geometry}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <meshPhongMaterial
              color="#b7e822"
              {...(previewMode === "decoration" ? previewMaterialProps : {})}
            />
          </mesh>
        </group>
      </RigidBody>
    </Grabbable>
  );
};

useGLTF.preload(PATH);
