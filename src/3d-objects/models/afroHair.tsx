import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";

type GLTFResult = GLTF & {
  nodes: {
    Sphere004: THREE.Mesh;
  };
  materials: {
    hair: THREE.MeshBasicMaterial;
  };
};

const PATH = "/gltf/bob-boolean.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
  rainbow?: boolean;
}

export const AfroHair = ({
  scale = [1, 1, 1],
  rainbow = false,
  outlineColor: _outlineColor,
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as unknown as GLTFResult;

  const material = useMemo(() => {
    const cloned = materials.hair.clone();
    if (rainbow) {
      const canvas = document.createElement("canvas");
      canvas.width = 256; canvas.height = 32;
      const context = canvas.getContext("2d")!;
      const gradient = context.createLinearGradient(0, 0, 256, 0);
      ["#f34556", "#ff963c", "#ffe34b", "#58c569", "#4396ef", "#a664e6", "#f34556"].forEach((color, i) => gradient.addColorStop(i / 6, color));
      context.fillStyle = gradient; context.fillRect(0, 0, 256, 32);
      cloned.map = new THREE.CanvasTexture(canvas);
      cloned.map.colorSpace = THREE.SRGBColorSpace;
      cloned.map.flipY = false;
      cloned.color.set("#ffffff");
    }
    return cloned;
  }, [materials.hair, rainbow]);
  material.transparent = props.preview;
  material.opacity = props.preview ? 0.25 : 1;
  useEffect(() => () => { if (rainbow) material.map?.dispose(); material.dispose(); }, [material, rainbow]);

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
      key={Number(props.preview)}
      ref={group}
      scale={spring.scale as any}
      castShadow
      receiveShadow
      position={props.position}
      rotation={props.rotation}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sphere004.geometry}
        material={material}
        position={[0, 1.406, -0.603]}
        rotation={[0.294, 0, 0]}
        scale={[1.34, 0.966, 1.262]}
      >
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
