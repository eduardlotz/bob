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
    ["default"]: THREE.Mesh;
    Object001: THREE.Mesh;
    Object002: THREE.Mesh;
    Object003: THREE.Mesh;
    decals: THREE.Mesh;
    ["0"]: THREE.Mesh;
    screen: THREE.Mesh;
    decals02: THREE.Mesh;
  };
  materials: {
    palette: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/midi-controller.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const MidiControllerModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Musik machen",
      });
    };

    const handlePointerLeave = () => {
      setHoveredObject(null);
    };

    const DraggableRigidBodyProps: Partial<DraggableRigidBodyProps> = {
      // rigidBodyProps: {
      //   gravityScale: 3.5,
      //   linearDamping: 5,
      //   angularDamping: 0.2,
      // },
      groupProps: {
        ref: group,
        position: props.position,
        rotation: props.rotation,
        scale: 0.01,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
      },
      // boundingBox: [
      //   [-1, 1],
      //   [0.5, 1],
      //   [-1, 1],
      // ],
      dragControlsProps: {
        preventOverlap: true,
      },
      enableSpringJoint: true,
    };

    return (
      <DraggableRigidBody
        {...DraggableRigidBodyProps}
        visibleMesh={
          <group>
            <mesh
              geometry={nodes["default"].geometry}
              material={materials.palette}
            />
            <mesh
              geometry={nodes.Object001.geometry}
              material={materials.palette}
            />
            <mesh
              geometry={nodes.Object002.geometry}
              material={materials.palette}
            />
            <mesh
              geometry={nodes.Object003.geometry}
              material={materials.palette}
            />
            <mesh
              geometry={nodes.decals.geometry}
              material={materials.palette}
            />
            <mesh geometry={nodes["0"].geometry} material={materials.palette} />
            <mesh
              geometry={nodes.screen.geometry}
              material={materials.palette}
            />
            <mesh
              geometry={nodes.decals02.geometry}
              material={materials.palette}
            />
          </group>
        }
      />
    );
  }
);

useGLTF.preload(PATH);
