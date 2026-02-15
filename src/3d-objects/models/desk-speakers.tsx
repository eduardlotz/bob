import * as THREE from "three";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useSoundSystem } from "@/hooks/useSoundSystem";

type GLTFResult = GLTF & {
  nodes: {
    Cube_1: THREE.Mesh;
    Cube_2: THREE.Mesh;
  };
  materials: {
    Speaker: THREE.MeshStandardMaterial;
    Body: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/music_speaker.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const DeskSpeakersModel = forwardRef(
  ({ scale = [1.5, 1.2, 1.1], ...props }: Props, ref: any) => {
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { isMuted } = useSoundSystem();

    const [spring, api] = useSpring(() => ({
      scale: [0, 0, 0],
      config: { tension: 200, friction: 15 },
    }));

    useEffect(() => {
      api.start({
        scale: scale,
        config: { tension: 300, friction: 10 },
      });
    }, []);

    const bounce = useRef(0);
    useFrame(({ clock }) => {
      if (!group.current) return;
      bounce.current = Math.sin(clock.elapsedTime * 4) * 0.01;
      const squeeze = 1 - Math.abs(Math.sin(clock.elapsedTime * 6.9)) * 0.08;

      group.current.scale.set(
        scale[0] + (isMuted ? 0 : bounce.current),
        scale[1] * (isMuted ? 1 : squeeze),
        scale[2] * (isMuted ? 1 : squeeze),
      );
    });

    return (
      <a.group ref={group} position={props.position} rotation={props.rotation}>
        <group dispose={null}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_1.geometry}
            material={materials.Speaker}
          >
            {/* <meshToonMaterial color="#e4e41a" /> */}
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_2.geometry}
            // material={materials.Body}
          >
            {/* <meshToonMaterial color="#34343b" /> */}
            <meshPhongMaterial color="#1b1b1e" />
          </mesh>
        </group>
      </a.group>
    );
  },
);

useGLTF.preload(PATH);
