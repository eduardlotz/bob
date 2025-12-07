import * as THREE from "three";
import React, { forwardRef, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import {
  DraggableRigidBody,
  DraggableRigidBodyProps,
} from "@/physics/DraggableRigidBody";
import { useFloatingBar } from "@/layout/FloatingBar";

type GLTFResult = GLTF & {
  nodes: {
    DJGear_mesh: THREE.Mesh;
  };
  materials: {
    DJGear_mat: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/dj-controller.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const DjControllerModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Musik mixen",
      });
    };

    const handlePointerLeave = () => {
      setHoveredObject(null);
    };

    const DraggableRigidBodyProps: Partial<DraggableRigidBodyProps> = {
      groupProps: {
        ref: group,
        position: props.position,
        rotation: props.rotation,
        scale: 0.1,
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
            geometry={nodes.DJGear_mesh.geometry}
            material={materials.DJGear_mat}
          />
        }
      />
    );
  }
);

useGLTF.preload(PATH);
