import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import {
  MeshTransmissionMaterial,
  Outlines,
  useGLTF,
  Wireframe,
} from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    Plumbob_Material001_0: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshBasicMaterial;
  };
};

const PATH = "/gltf/sims-plumbob.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  color?: string;
  preview: boolean;
}

export const SimsPlumbob = ({
  scale = [1, 1, 1],
  outlineColor = "#8eb221",
  color = "#b7e822",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes } = useGLTF(PATH) as GLTFResult;
  const wireframeGeometry = useMemo(
    () => nodes.Plumbob_Material001_0.geometry.toNonIndexed(),
    [nodes],
  );

  useEffect(() => () => wireframeGeometry.dispose(), [wireframeGeometry]);

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

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.01;
    }
  });

  return (
    <a.group
      key={Number(props.preview)}
      ref={group}
      scale={spring.scale as any}
      position={props.position}
      rotation={props.rotation}
    >
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={wireframeGeometry}>
          <meshPhongMaterial
            color={color}
            {...(props.preview ? previewMaterialProps : {})}
          />

          {props.preview && (
            <Wireframe thickness={0.04} backfaceStroke={outlineColor} />
          )}
        </mesh>
      </group>
    </a.group>
  );
};

useGLTF.preload(PATH);
