import * as THREE from "three";
import React, { forwardRef, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Sphere: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
};

const PATH = "gltf/globe.glb";

export function useGlobeModelData() {
  return useGLTF(PATH) as GLTFResult;
}

interface Props extends Omit<React.ComponentProps<"group">, "scale"> {
  color?: string;
  shellOpacity?: number;
  innerGlowOpacity?: number;
  scale?: [number, number, number];
  children?: ReactNode;
}

export const GlobeModel = forwardRef<THREE.Group, Props>(
  (
    {
      scale = [1, 1, 1],
      color = "#5F9EE8",
      shellOpacity = 1,
      innerGlowOpacity = 0,
      children,
      ...props
    },
    ref,
  ) => {
    const { nodes } = useGlobeModelData();
    const meshOffset = useMemo(() => {
      const geometry = nodes.Sphere.geometry;
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
      }

      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      return center.multiplyScalar(-1);
    }, [nodes.Sphere.geometry]);

    return (
      <group ref={ref} {...props} scale={scale}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Sphere.geometry}
          position={meshOffset}
        >
          <meshStandardMaterial
            color={color}
            transparent={shellOpacity < 1}
            opacity={shellOpacity}
            roughness={0.46}
            metalness={0}
            envMapIntensity={0.1}
          />
        </mesh>
        {innerGlowOpacity > 0 && (
          <mesh
            geometry={nodes.Sphere.geometry}
            scale={0.92}
            position={meshOffset}
          >
            <meshToonMaterial
              color="#d7e9ff"
              transparent
              opacity={innerGlowOpacity}
            />
          </mesh>
        )}
        {children}
      </group>
    );
  },
);

GlobeModel.displayName = "GlobeModel";

useGLTF.preload(PATH);
