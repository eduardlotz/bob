import * as THREE from "three";
import React, { forwardRef, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

type GLTFResult = GLTF & {
  nodes: {
    ["Desk_Speakers_01_Cube-Mesh"]: THREE.Mesh;
    ["Desk_Speakers_01_Cube-Mesh_1"]: THREE.Mesh;
    ["Desk_Speakers_01_Cube-Mesh_2"]: THREE.Mesh;
  };
  materials: {
    ["795548"]: THREE.MeshStandardMaterial;
    ["1A1A1A"]: THREE.MeshStandardMaterial;
    ["455A64"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/desk-speakers.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const DeskSpeakersModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const [spring, api] = useSpring(() => ({
      scale: [0, 0, 0], // start invisible
      config: { tension: 200, friction: 15 },
    }));

    useEffect(() => {
      api.start({
        scale: scale,
        config: { tension: 300, friction: 10 },
      });
    }, []);

    return (
      <a.group
        ref={group}
        scale={spring.scale.get() as [number, number, number]}
        position={props.position}
        rotation={props.rotation}
      >
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            geometry={nodes["Desk_Speakers_01_Cube-Mesh"].geometry}
            material={materials["795548"]}
          />
          <mesh
            geometry={nodes["Desk_Speakers_01_Cube-Mesh_1"].geometry}
            material={materials["1A1A1A"]}
          />
          <mesh
            geometry={nodes["Desk_Speakers_01_Cube-Mesh_2"].geometry}
            material={materials["455A64"]}
          />
        </group>
      </a.group>
    );
  }
);

useGLTF.preload(PATH);
