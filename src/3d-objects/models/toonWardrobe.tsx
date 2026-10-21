import { useEffect, useMemo } from "react";
import * as T from "three";
import { assemble, type Part, type Vec3 } from "../worlds/InstancedModels";
import { WorldToonMaterial } from "../worlds/WorldToonMaterial";

export type WardrobeKind = "topHat" | "toonSunglasses" | "dimmadomeHat" | "clownNose";
export function wardrobeGeometry(kind: WardrobeKind) {
  const parts: Part[] = [];
  const ball = (color: string, position: Vec3, scale: Vec3) =>
    parts.push([new T.SphereGeometry(1, 12, 8), color, position, scale]);
  if (kind === "topHat") {
    parts.push(
      [new T.CylinderGeometry(1.12, 1.12, 0.1, 24), "#17191e"],
      [new T.CylinderGeometry(0.73, 0.7, 1.1, 20), "#17191e", [0, 0.58, 0]],
      [new T.CylinderGeometry(0.724, 0.715, 0.2, 20), "#fffaf0", [0, 0.25, 0]],
    );
  } else if (kind === "dimmadomeHat") {
    const brim = new T.CylinderGeometry(1.35, 1.35, 0.09, 32);
    const vertices = brim.getAttribute("position");
    for (let i = 0; i < vertices.count; i++) vertices.setY(i, vertices.getY(i) + Math.pow(Math.abs(vertices.getX(i)) / 1.35, 3) * 0.34);
    brim.computeVertexNormals();
    parts.push(
      [brim, "#f4eedc", [0, 0, 0], [1, 1, 0.8]],
      [new T.CylinderGeometry(0.58, 0.72, 12.3, 16), "#f4eedc", [0, 6.17, 0]],
      [new T.CylinderGeometry(0.714, 0.724, 0.18, 16), "#ded3b5", [0, 0.16, 0]],
    );
  } else if (kind === "clownNose") {
    ball("#ee2538", [0, 0, 0.1], [0.22, 0.22, 0.22]);
    ball("#ffb7b7", [-0.065, 0.075, 0.28], [0.055, 0.035, 0.018]);
  } else if (kind === "toonSunglasses") {
    for (const x of [-0.37, 0.37]) {
      parts.push([new T.TorusGeometry(0.285, 0.045, 6, 24), "#101117", [x, 0.2, 1.05]]);
      parts.push([new T.CylinderGeometry(0.265, 0.265, 0.045, 24), "#18202d", [x, 0.2, 1.05], [1, 1, 1], [Math.PI / 2, 0, 0]]);
      for (const offset of [-0.08, 0.07]) parts.push([
        new T.BoxGeometry(0.045, 0.32, 0.012), "#f7fcff", [x + offset, 0.2, 1.08], [1, 1, 1], [0, 0, -0.48],
      ]);
    }
    parts.push([new T.BoxGeometry(0.16, 0.08, 0.09), "#101117", [0, 0.25, 1.05]]);
  }
  const geometry = assemble(parts);
  if (kind === "topHat" || kind === "dimmadomeHat") {
    const heightScale = kind === "topHat" ? 1.25 : 2;
    const brimBottom = kind === "topHat" ? -0.05 : -0.045;
    // Grow upward from the existing contact point so placement stays unchanged.
    geometry.scale(1, heightScale, 1);
    geometry.translate(0, brimBottom * (1 - heightScale), 0);
  }
  return geometry;
}

export function ToonWardrobe({ kind, position, scale, preview }: {
  kind: WardrobeKind; position: Vec3; scale: Vec3; preview: boolean;
}) {
  const geometry = useMemo(() => wardrobeGeometry(kind), [kind]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={position} scale={scale} name={kind}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <WorldToonMaterial vertexColors transparent={preview} opacity={preview ? 0.5 : 1} depthWrite={!preview} />
    </mesh>
  </group>;
}
