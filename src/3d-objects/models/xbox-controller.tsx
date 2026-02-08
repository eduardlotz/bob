import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";

import { Grabbable } from "@/physics/Grabbable";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Xbox_Controller: THREE.Mesh;
  };
  materials: {
    Mat: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/xbox-controller.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const XboxControllerModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const api = useRef<RapierRigidBody>(null);

    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Xbox",
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
            geometry={nodes.Xbox_Controller.geometry}
            material={materials.Mat}
            scale={0.02}
          />
        </RigidBody>
      </Grabbable>
    );
  },
);

useGLTF.preload(PATH);
