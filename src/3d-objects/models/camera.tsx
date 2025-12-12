import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";

import { Grabbable } from "@/physics/Grabbable";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    M_Camera_T_Camera_0: THREE.Mesh;
  };
  materials: {
    T_Camera: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/camera.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const CameraModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const api = useRef<RapierRigidBody>(null);

    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Videospiele",
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
          <group dispose={null}>
            <group scale={0.3}>
              <mesh
                geometry={nodes.M_Camera_T_Camera_0.geometry}
                // material={materials.T_Camera}
                position={[0, 0, -0.033]}
              >
                <meshToonMaterial color="#4c4c4f" />
              </mesh>
            </group>
          </group>
        </RigidBody>
      </Grabbable>
    );
  }
);

useGLTF.preload(PATH);
