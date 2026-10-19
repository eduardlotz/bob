import { LatheGeometry, Vector2 } from "three";
import { getEggLobes, getEggRadiusAtY } from "@/types/eggShape";
import type { BlobFormParameters } from "@/types/blobForms";

export function createEggGeometry(parameters: BlobFormParameters, padding = 0) {
  const { halfHeight } = getEggLobes(parameters);
  const points = Array.from({ length: 49 }, (_, i) => {
    const angle = i / 48 * Math.PI;
    const y = -Math.cos(angle) * halfHeight;
    const radius = i === 0 || i === 48 ? 0 : getEggRadiusAtY(y, parameters) + Math.sin(angle) * padding;
    return new Vector2(radius, y + -Math.cos(angle) * padding);
  });
  const geometry = new LatheGeometry(points, 32);
  geometry.computeVertexNormals();
  return geometry;
}
