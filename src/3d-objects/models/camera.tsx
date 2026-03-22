import * as THREE from "three";
import React, { forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { cameraMessages } from "./camera.messages";

type GLTFResult = GLTF & {
  nodes: {
    M_Camera_T_Camera_0: THREE.Mesh;
  };
  materials: {
    T_Camera: THREE.MeshStandardMaterial;
  };
};

const PATH = "/gltf/camera.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const CameraModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();
    const { locale } = useI18n();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: cameraMessages[locale].floatingLabel,
      });
    };

    const handlePointerLeave = () => {
      setHoveredObject(null);
    };

    return (
      <group
        {...props}
        scale={scale}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <group scale={0.3}>
          <mesh
            geometry={nodes.M_Camera_T_Camera_0.geometry}
            // material={materials.T_Camera}
            position={[0, 0, -0.033]}
          >
            <meshPhongMaterial color="#4c4c4f" />
          </mesh>
        </group>
      </group>
    );
  },
);

useGLTF.preload(PATH);
