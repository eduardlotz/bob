import { useEffect, useMemo } from "react";
import { a, useSpring } from "@react-spring/three";
import { Outlines } from "@react-three/drei";
import * as T from "three";
import { assemble, type Vec3 } from "../worlds/InstancedModels";
import { WorldToonMaterial } from "../worlds/WorldToonMaterial";

function moustacheGeometry(curved: boolean) {
  const shape = new T.Shape();
  shape.moveTo(-0.5, -0.07);
  shape.quadraticCurveTo(-0.43, 0.15, -0.12, 0.12);
  shape.quadraticCurveTo(-0.04, 0.12, 0, 0.06);
  shape.quadraticCurveTo(0.04, 0.12, 0.12, 0.12);
  shape.quadraticCurveTo(0.43, 0.15, 0.5, -0.07);
  shape.quadraticCurveTo(0.28, -0.16, 0.05, -0.08);
  shape.lineTo(0, -0.03);
  shape.lineTo(-0.05, -0.08);
  shape.quadraticCurveTo(-0.28, -0.16, -0.5, -0.07);
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: 0.075, bevelEnabled: true, bevelThickness: 0.025,
    bevelSize: 0.025, bevelSegments: 1, curveSegments: 6,
  });
  // Wrap the ends around Bob's rounded face instead of leaving a flat plate.
  const vertices = geometry.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    if (curved) vertices.setZ(i, vertices.getZ(i) - x * x * 0.55);
  }
  geometry.computeVertexNormals();
  return assemble([[geometry, "#211d1b"]]);
}

export function BobMoustache({ position, scale, curved, preview, outlineColor = "#000000" }: {
  position: Vec3;
  scale: Vec3;
  curved: boolean;
  preview: boolean;
  outlineColor?: string;
}) {
  const geometry = useMemo(() => moustacheGeometry(curved), [curved]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const spring = useSpring({ from: { size: 0 }, size: 1, config: { tension: 300, friction: 15 } });
  return (
    <group position={position} scale={scale}>
      <a.mesh name="bobMoustache" scale={spring.size} geometry={geometry} castShadow receiveShadow>
        <WorldToonMaterial vertexColors transparent={preview} opacity={preview ? 0.5 : 1} depthWrite={!preview} />
        <Outlines thickness={0.005} color={outlineColor} screenspace transparent={preview} opacity={preview ? 0.5 : 1} />
      </a.mesh>
    </group>
  );
}
