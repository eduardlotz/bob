import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { RigidBody } from "@react-three/rapier";
import { useFloatingBar } from "@/layout/FloatingBar";

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
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";

      setHoveredObject({
        title: "Videospiele",
      });
    };

    const handlePointerLeave = () => {
      document.body.style.cursor = "default";
      setHoveredObject(null);
    };

    return (
      <group
        ref={group}
        position={props.position}
        rotation={props.rotation}
        scale={[0.02, 0.02, 0.02]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <RigidBody>
          <mesh
            geometry={nodes.Xbox_Controller.geometry}
            material={materials.Mat}
          />
        </RigidBody>
      </group>
    );
  }
);

useGLTF.preload(PATH);
