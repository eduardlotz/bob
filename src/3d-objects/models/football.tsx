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
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const api = useRef<RapierRigidBody>(null);

    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Fuppes",
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
            geometry={nodes.Soccerball__0.geometry}
            material={materials["Scene_-_Root"]}
            // rotation={[-Math.PI / 2, 0, 0]}
            scale={[3, 3, 3]}
          />
        </RigidBody>
      </Grabbable>
    );
  }
);

useGLTF.preload(PATH);
