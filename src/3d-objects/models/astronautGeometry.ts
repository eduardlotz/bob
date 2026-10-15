import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BobBodyFit, Vec3 } from "@/components/bob/wearableFit";

// The face stays the same size as Bob shrinks. Keep its eyes inside the visor.
const FACE_HALF_WIDTH = 0.45 + 0.12;
const FACE_CLEARANCE = 0.08;

export function getAstronautDimensions(body: BobBodyFit) {
  const [x, y, z] = body.halfSize;
  const buttonRadius = Math.min(0.15, Math.max(0.07, Math.min(x, y, z) * 0.1));
  if (body.formType === "sphere") {
    const radius = Math.max(x * 1.28, (FACE_HALF_WIDTH + FACE_CLEARANCE) / 0.9);
    return { halfSize: [radius, radius, radius] as Vec3, cornerRadius: 0, buttonRadius };
  }

  const padding = Math.max(0.18, Math.min(x, y, z) * 0.18);
  const halfSize: Vec3 = [
    Math.max(x + padding, FACE_HALF_WIDTH + FACE_CLEARANCE + 0.05),
    Math.max(y + padding, Math.abs(body.eyePosition[1]) + 0.12 + FACE_CLEARANCE),
    z + padding,
  ];
  const cornerRadius = Math.min(body.cornerRadius + padding, ...halfSize);
  const eyeX = Math.max(0, 0.45 - (halfSize[0] - cornerRadius));
  const eyeY = Math.max(0, Math.abs(body.eyePosition[1]) - (halfSize[1] - cornerRadius));
  const cornerDepth = cornerRadius - Math.sqrt(Math.max(0, cornerRadius ** 2 - eyeX ** 2 - eyeY ** 2));
  halfSize[2] = Math.max(halfSize[2], body.eyePosition[2] + 0.12 + FACE_CLEARANCE + cornerDepth);
  return { halfSize, cornerRadius, buttonRadius };
}

/** Clip a primitive at the shared rim plane, including its curved corners. */
function primitivePart(source: BufferGeometry, seam: number, front: boolean) {
  const geometry = new BufferGeometry();
  const position = source.getAttribute("position");
  const normal = source.getAttribute("normal");
  const uv = source.getAttribute("uv");
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  const inside = (vertex: number[]) => front ? vertex[2] >= seam : vertex[2] <= seam;
  for (let i = 0; i < position.count; i += 3) {
    const triangle = [i, i + 1, i + 2].map(index => [
      position.getX(index), position.getY(index), position.getZ(index),
      normal.getX(index), normal.getY(index), normal.getZ(index), uv.getX(index), uv.getY(index),
    ]);
    const clipped: number[][] = [];
    let previous = triangle[2];
    for (const current of triangle) {
      if (inside(previous) !== inside(current)) {
        const blend = (seam - previous[2]) / (current[2] - previous[2]);
        clipped.push(previous.map((value, axis) => value + (current[axis] - value) * blend));
      }
      if (inside(current)) clipped.push(current);
      previous = current;
    }
    for (let corner = 1; corner < clipped.length - 1; corner++) {
      for (const vertex of [clipped[0], clipped[corner], clipped[corner + 1]]) {
        positions.push(vertex[0], vertex[1], vertex[2]);
        normals.push(vertex[3], vertex[4], vertex[5]);
        uvs.push(vertex[6], vertex[7]);
      }
    }
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.normalizeNormals();
  return geometry;
}

/** Build once when body settings change; never deform geometry per frame. */
export function createAstronautGeometry(body: BobBodyFit) {
  const dimensions = getAstronautDimensions(body);
  const [x, y, z] = dimensions.halfSize;
  let shell: BufferGeometry;
  let visor: BufferGeometry;
  if (body.formType === "sphere") {
    const seam = x * 0.4;
    const aperture = Math.sqrt(x * x - seam * seam);
    const shellAngle = Math.acos(seam / x);
    shell = new SphereGeometry(x, 24, 16, 0, Math.PI * 2, shellAngle, Math.PI - shellAngle);
    shell.rotateX(Math.PI / 2);
    // A second spherical cap bulges forward while sharing the shell's seam.
    const bulge = x * 1.18 - seam;
    const glassRadius = (aperture * aperture + bulge * bulge) / (2 * bulge);
    const glassAngle = Math.acos((glassRadius - bulge) / glassRadius);
    visor = new SphereGeometry(glassRadius, 24, 12, 0, Math.PI * 2, 0, glassAngle);
    visor.rotateX(Math.PI / 2);
    visor.translate(0, 0, seam + bulge - glassRadius);
  } else {
    const primitive = new RoundedBoxGeometry(x * 2, y * 2, z * 2, 2, dimensions.cornerRadius);
    const seam = z * 0.35;
    shell = primitivePart(primitive, seam, false);
    visor = primitivePart(primitive, seam, true);
    primitive.dispose();
  }
  return {
    shell, visor,
    buttonRadius: dimensions.buttonRadius,
    buttonPosition: [0, y + dimensions.buttonRadius * 0.65, 0] as Vec3,
  };
}
