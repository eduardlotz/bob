import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { Outlines, useGLTF, Wireframe } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { useCoreStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    Object_4001: THREE.Mesh;
  };
  materials: {
    ["Material.017"]: THREE.MeshStandardMaterial;
  };
};
const PATH = "/gltf/builder-helmet.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
}

export const BuilderHelmet = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as GLTFResult;
  const wireframeGeometry = useMemo(
    () => nodes.Object_4001.geometry.toNonIndexed(),
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

  return (
    <a.group
      ref={group}
      key={Number(props.preview)}
      scale={spring.scale as any}
      position={props.position}
      rotation={props.rotation}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={wireframeGeometry}
        position={[0.015, 0.053, 0.171]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshToonMaterial
          color="#FFED55"
          side={THREE.DoubleSide}
          {...(props.preview ? previewMaterialProps : {})}
        />
        {props.preview && (
          <Wireframe simplify thickness={0.04} backfaceStroke={outlineColor} />
        )}
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
