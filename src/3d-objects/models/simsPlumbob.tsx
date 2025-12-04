import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { MeshTransmissionMaterial, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";

type GLTFResult = GLTF & {
  nodes: {
    Plumbob_Material001_0: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshBasicMaterial;
  };
};

const PATH = "gltf/sims-plumbob.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  color?: string;
}

export const SimsPlumbob = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  color = "#b7e822",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes } = useGLTF(PATH) as GLTFResult;

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

  // Auto rotation animation - temporarily disabled for performance testing
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.01;
    }
  });

  return (
    <a.group
      ref={group}
      scale={spring.scale.get() as [number, number, number]}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
    >
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plumbob_Material001_0.geometry}
        >
          <MeshTransmissionMaterial
            color={color}
            thickness={1.5}
            distortion={0.5}
            transmission={0.9}
          />
        </mesh>
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
