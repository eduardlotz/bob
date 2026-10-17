import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { Outlines, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { a, useSpring } from "@react-spring/three";
import { previewMaterialProps } from "@/shop-items/utils";

type GLTFResult = GLTF & {
  nodes: {
    BézierCurve: THREE.Mesh;
    Cube: THREE.Mesh;
    BézierCurve002: THREE.Mesh;
  };
  materials: {
    hair: THREE.MeshStandardMaterial;
    rasta_beanie: THREE.MeshStandardMaterial;
    ["hair.001"]: THREE.MeshStandardMaterial;
  };
};

/** Replace the asset's muted pigment palette with explicit Rastafari colors. */
function createBeaniePalette(source: THREE.Texture) {
  const canvas = document.createElement("canvas");
  const image = source.image as HTMLImageElement | ImageBitmap;
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    let color: number[] | undefined;
    if (r > 100 && g > 100 && b < 80) color = [255, 212, 59]; // #FFD43B gold
    else if (g > r * 1.4 && g > b * 1.4) color = [32, 168, 72]; // #20A848 green
    else if (r > 110 && r > g * 2 && g > 20) color = [229, 57, 53]; // #E53935 red
    if (color) pixels.data.set(color, i);
  }
  context.putImageData(pixels, 0, 0);
  const texture = source.clone();
  texture.source = new THREE.Source(canvas);
  texture.needsUpdate = true;
  return texture;
}

const PATH = "/gltf/rasta_beanie.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  outlineColor?: string;
  preview: boolean;
}

export const RastaBeanie = ({
  scale = [1, 1, 1],
  outlineColor = "#000000",
  ...props
}: Props) => {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(PATH) as unknown as GLTFResult;

  const beanieMap = useMemo(() => createBeaniePalette(materials.rasta_beanie.map!), [materials]);
  useEffect(() => () => beanieMap.dispose(), [beanieMap]);

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
        geometry={nodes.BézierCurve.geometry}
      >
        <meshToonMaterial color={materials.hair.color} map={materials.hair.map} side={materials.hair.side}
          {...(props.preview ? previewMaterialProps : {})} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BézierCurve002.geometry}
      >
        <meshToonMaterial color={materials["hair.001"].color} map={materials["hair.001"].map} side={materials["hair.001"].side}
          {...(props.preview ? previewMaterialProps : {})} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube.geometry}
      >
        <meshToonMaterial color={materials.rasta_beanie.color} map={beanieMap} side={materials.rasta_beanie.side}
          {...(props.preview ? previewMaterialProps : {})} />
        <Outlines
          thickness={0.005}
          color={outlineColor}
          screenspace
          {...(props.preview ? previewMaterialProps : {})}
        />
      </mesh>
    </a.group>
  );
};

useGLTF.preload(PATH);
