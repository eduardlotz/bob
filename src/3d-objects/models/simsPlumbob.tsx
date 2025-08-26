import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { MeshTransmissionMaterial, Outlines, useGLTF } from "@react-three/drei";
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
}

export const SimsPlumbob = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
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
      <group
        name="Sketchfab_model"
        // position={[-4.756, 0.001, -2.989]}
        rotation={[-Math.PI / 2, 0, -2.426]}
      >
        {/* <mesh
            name="Plumbob_Material001_0"
            castShadow
            receiveShadow
            geometry={nodes.Plumbob_Material001_0.geometry}
            material={materials["Material.001"]}
          /> */}
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plumbob_Material001_0.geometry}
          // material={materials["Material.001"]}
        >
          {/* <meshToonMaterial color="#A0BF3F" /> */}
          <MeshTransmissionMaterial color="#b7e822" />
          {/* <Outlines thickness={0.5} color={"#697f28"} screenspace /> */}
        </mesh>
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
