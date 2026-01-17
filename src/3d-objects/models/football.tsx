import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Grabbable } from "@/physics/Grabbable";

type GLTFResult = GLTF & {
  nodes: {
    Soccerball__0: THREE.Mesh;
  };
  materials: {
    ["Scene_-_Root"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/football.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const FootballModel = forwardRef(
  ({ scale = [3, 3, 3], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const rigidRef = useRef<RapierRigidBody>(null);

    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      // setHoveredObject({
      //   title: "Minigame #1",
      // });
    };

    const handlePointerLeave = () => {
      // setHoveredObject(null);
    };

    return (
      <Grabbable
        stiffness={50}
        damping={1}
        rigidBodyRef={rigidRef}
        mode="spring"
      >
        <RigidBody
          {...props}
          ref={rigidRef}
          colliders="ball"
          restitution={0.2}
          friction={0.5}
        >
          <mesh
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            geometry={nodes.Soccerball__0.geometry}
            material={materials["Scene_-_Root"]}
            // rotation={[-Math.PI / 2, 0, 0]}
            scale={scale}
          />
        </RigidBody>
      </Grabbable>
    );
  },
);

useGLTF.preload(PATH);
