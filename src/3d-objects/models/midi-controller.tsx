import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { midiControllerMessages } from "./midi-controller.messages";

import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Grabbable } from "@/physics/Grabbable";

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

const PATH = "/gltf/midi-controller.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const MidiControllerModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const api = useRef<RapierRigidBody>(null);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();
    const { locale } = useI18n();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: midiControllerMessages[locale].floatingLabel,
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
          colliders="cuboid"
          restitution={0.5}
          friction={0.7}
        >
          <group
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            scale={0.01}
          >
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
        </RigidBody>
      </Grabbable>
    );
  },
);

useGLTF.preload(PATH);
