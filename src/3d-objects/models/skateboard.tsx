import * as THREE from "three";
import React, { forwardRef, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
type GLTFResult = GLTF & {
  nodes: {
    skateboard: THREE.Mesh;
  };
  materials: {
    ["colormap.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/skateboard.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const SkateboardModel = forwardRef(
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
            geometry={nodes.skateboard.geometry}
            material={materials["colormap.001"]}
          />
        </group>
      </a.group>
    );
  }
);

useGLTF.preload(PATH);
