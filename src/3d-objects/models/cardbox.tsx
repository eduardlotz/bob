import * as THREE from "three";
import React, { forwardRef, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

type GLTFResult = GLTF & {
  nodes: {
    cardbox: THREE.Mesh;
    box_lid_left: THREE.Mesh;
    box_lid_right: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/cardbox.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const CardboxModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const group = useRef<THREE.Group>(null!);
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;

    const box = useRef<THREE.Mesh>(null);
    const lidLeft = useRef<THREE.Mesh>(null);
    const lidRight = useRef<THREE.Mesh>(null);

    // expose mesh refs upward
    if (ref) {
      ref.current = {
        box,
        lidLeft,
        lidRight,
      };
    }

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
        castShadow
        receiveShadow
        position={props.position}
        rotation={props.rotation}
      >
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            ref={box}
            geometry={nodes.cardbox.geometry}
            material={materials["Material.001"]}
            castShadow
            receiveShadow
          />

          <mesh
            ref={lidLeft}
            geometry={nodes.box_lid_left.geometry}
            material={materials["Material.001"]}
            castShadow
            receiveShadow
          />

          <mesh
            ref={lidRight}
            geometry={nodes.box_lid_right.geometry}
            material={materials["Material.001"]}
            castShadow
            receiveShadow
          />
        </group>
      </a.group>
    );
  }
);

useGLTF.preload(PATH);
