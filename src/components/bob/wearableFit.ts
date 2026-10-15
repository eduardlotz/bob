import {
  DEFAULT_FORM_PARAMETERS,
  FORM_PARAMETER_RANGES,
  getBobEyePosition,
  getBlobFormHalfSize,
  type BlobFormParameters,
  type BlobFormType,
} from "@/types/blobForms";

export type Vec3 = [number, number, number];

export interface BobBodyFit {
  formType: BlobFormType;
  halfSize: Vec3;
  eyePosition: Vec3;
  cornerRadius: number;
  /** Ellipse expansion needed to cover a rounded rectangular body. */
  crownCoverage: number;
  /** Smooth adjustment near minimum size; zero at ordinary/default sizes. */
  compactness: number;
}

export type WearableMount =
  | { kind: "crown"; bottom: number; inset?: number }
  | { kind: "hair" }
  | { kind: "body" }
  | { kind: "eyes"; front: number; compactForward?: number; compactScale?: number }
  | { kind: "face"; eyeOffset: number; clearance: number };

export interface WearableTransform {
  position: Vec3;
  scale: Vec3;
}

// Rounded-box support bound in normalized body coordinates. Unlike a fixed
// multiplier, this also tightens the fit when the cube's corner radius grows.
function cornerCoverage(halfSize: number[], radius: number) {
  const smallest = Math.min(...halfSize);
  const inner = Math.hypot(...halfSize.map((half) => 1 - radius / half));
  return Math.min(Math.sqrt(halfSize.length), inner + radius / smallest);
}

function compactBlend(size: number, minimum: number, normal: number) {
  const threshold = (minimum + normal) / 2;
  const blend = Math.max(0, Math.min(1, (threshold - size) / (threshold - minimum)));
  return blend * blend * (3 - 2 * blend);
}

/** Calculate body measurements once per shape/parameter change, never per frame. */
export function getBobBodyFit(
  formType: BlobFormType,
  parameters: BlobFormParameters,
): BobBodyFit {
  const defaults = DEFAULT_FORM_PARAMETERS[formType];
  const halfSize = getBlobFormHalfSize(formType, parameters);
  const radius = Math.min(parameters.cubeRadius ?? defaults.cubeRadius ?? 0, ...halfSize);
  const minimumSize = formType === "sphere"
    ? FORM_PARAMETER_RANGES.sphere.sphereRadius.min
    : Math.max(...["cubeWidth", "cubeHeight", "cubeDepth"].map(key => FORM_PARAMETER_RANGES.cube[key].min / 2));
  const defaultHalfSize = getBlobFormHalfSize(formType, defaults);
  const defaultSize = Math.max(...defaultHalfSize);

  return {
    formType,
    halfSize,
    eyePosition: getBobEyePosition([0, 0.2, 0.85], formType, parameters),
    cornerRadius: radius,
    crownCoverage: formType === "cube" ? cornerCoverage([halfSize[0], halfSize[2]], radius) : 1,
    compactness: compactBlend(Math.max(...halfSize), minimumSize, defaultSize),
  };
}

/**
 * Models are calibrated against the default unit Ball. Fitting lives on a
 * parent group, outside each model's entrance animation and asset transforms.
 */
export function fitBobWearable(body: BobBodyFit, mount: WearableMount): WearableTransform {
  const [x, y, z] = body.halfSize;
  switch (mount.kind) {
    case "crown": {
      if (body.formType === "sphere") {
        return { position: [0, 0, 0], scale: [x, y, z] };
      }
      const width = x * body.crownCoverage;
      const depth = z * body.crownCoverage;
      const height = Math.min(width, depth);
      return {
        position: [0, y - (mount.bottom + (mount.inset ?? 0.02)) * height, 0],
        scale: [width, height, depth],
      };
    }
    case "hair":
      return {
        position: [0, 0, 0],
        scale: [x * body.crownCoverage, y, z * body.crownCoverage],
      };
    case "body":
      // Procedural models consume body measurements directly, keeping round
      // details round instead of stretching an imported asset.
      return { position: [0, 0, 0], scale: [1, 1, 1] };
    case "eyes": {
      // Lens spacing/size follow the unchanged eyes. Stretch the temples in
      // depth while keeping the front frame anchored to the existing face.
      const frameScale = 1 + ((mount.compactScale ?? 1) - 1) * body.compactness;
      const depth = z * frameScale;
      return {
        position: [0, body.eyePosition[1] - 0.2 * frameScale,
          body.eyePosition[2] - 0.85 + mount.front * (1 - depth) + (mount.compactForward ?? 0) * body.compactness],
        scale: [frameScale, frameScale, depth],
      };
    }
    case "face": {
      const height = Math.min(1, x, y);
      const faceY = body.eyePosition[1] + mount.eyeOffset * height;
      const surfaceZ = body.formType === "cube" ? z : Math.sqrt(Math.max(0, z * z - faceY * faceY));
      return {
        position: [0, faceY, surfaceZ + mount.clearance],
        scale: [x, height, body.formType === "sphere" ? z : 1],
      };
    }
  }
}
