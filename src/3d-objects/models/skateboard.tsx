import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { skateboardMessages } from "./skateboard.messages";

import { Grabbable } from "@/physics/Grabbable";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    skateboard: THREE.Mesh;
  };
  materials: {
    ["colormap.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/skateboard.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const SkateboardModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const api = useRef<RapierRigidBody>(null);

    const { setHoveredObject } = useFloatingBar();
    const { locale } = useI18n();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: skateboardMessages[locale].floatingLabel,
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
          friction={0.7}
        >
          <mesh
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            geometry={nodes.skateboard.geometry}
            material={materials["colormap.001"]}
            scale={2}
          />
        </RigidBody>
      </Grabbable>
    );
  },
);

useGLTF.preload(PATH);
