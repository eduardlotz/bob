import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

type GLTFResult = GLTF & {
  nodes: {
    Box001_1: THREE.Mesh;
    Box001_1_1: THREE.Mesh;
    Box002_1: THREE.Mesh;
    Box002_1_1: THREE.Mesh;
    Box003: THREE.Mesh;
    Box004: THREE.Mesh;
    Box005_1: THREE.Mesh;
    Box005_1_1: THREE.Mesh;
    Box006: THREE.Mesh;
    Box007: THREE.Mesh;
    Box008: THREE.Mesh;
    Box009: THREE.Mesh;
    Box010: THREE.Mesh;
    Box011: THREE.Mesh;
    Box012: THREE.Mesh;
    Box013: THREE.Mesh;
    Box014: THREE.Mesh;
    Box015: THREE.Mesh;
    Box016: THREE.Mesh;
    Box017: THREE.Mesh;
    Box018: THREE.Mesh;
    Box019: THREE.Mesh;
    Box020: THREE.Mesh;
    Box021: THREE.Mesh;
    Box022: THREE.Mesh;
    Box023: THREE.Mesh;
    Box024: THREE.Mesh;
    Box025: THREE.Mesh;
    Box026: THREE.Mesh;
    Box027: THREE.Mesh;
    Box028: THREE.Mesh;
    Box029: THREE.Mesh;
    Box030: THREE.Mesh;
    Box031: THREE.Mesh;
    Box032: THREE.Mesh;
    Box033: THREE.Mesh;
    Box034: THREE.Mesh;
    Box035: THREE.Mesh;
    Box036: THREE.Mesh;
    Box038: THREE.Mesh;
  };
  materials: {
    ["02___Default"]: THREE.MeshStandardMaterial;
    _crayfishdiffuse: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/soccer-goal.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const SoccerGoalModel = ({ scale = [1, 1, 1], ...props }: Props) => {
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
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
    >
      <group scale={1}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box003.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box004.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box006.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box007.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box008.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box009.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box010.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box011.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box012.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box013.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box014.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box015.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box016.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box017.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box018.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box019.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box020.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box021.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box022.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box023.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box024.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box025.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box026.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box027.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box028.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box029.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box030.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box031.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box032.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box033.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box034.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box035.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box036.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box038.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box001_1.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box001_1_1.geometry}
          material={materials._crayfishdiffuse}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box002_1.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box002_1_1.geometry}
          material={materials._crayfishdiffuse}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box005_1.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box005_1_1.geometry}
          material={materials._crayfishdiffuse}
        />
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
