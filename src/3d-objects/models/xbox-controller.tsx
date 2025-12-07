import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import {
  DraggableRigidBody,
  DraggableRigidBodyProps,
} from "@/physics/DraggableRigidBody";

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

      setHoveredObject({
        title: "Videospiele",
      });
    };

    const handlePointerLeave = () => {
      setHoveredObject(null);
    };

    const DraggableRigidBodyProps: Partial<DraggableRigidBodyProps> = {
      groupProps: {
        position: props.position,
        rotation: props.rotation,
        scale: [0.02, 0.02, 0.02],
        ref: group,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
      },

      dragControlsProps: {
        preventOverlap: true,
      },
      enableSpringJoint: true,
    };

    return (
      <DraggableRigidBody
        {...DraggableRigidBodyProps}
        visibleMesh={
          <mesh
            geometry={nodes.Xbox_Controller.geometry}
            material={materials.Mat}
          />
        }
      />
    );
  }
);

useGLTF.preload(PATH);
