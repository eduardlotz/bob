import { getEggRadiusAtY } from "@/types/eggShape";
import {
  DEFAULT_FORM_PARAMETERS,
  FORM_PARAMETER_RANGES,
  getBobEyePosition,
  getBobFaceScale,
  getBlobFormHalfSize,
  getCubeCornerRadius,
  type BlobFormParameters,
  type BlobFormType,
  isBoxForm,
} from "@/types/blobForms";

export type Vec3 = [number, number, number];

export interface BobBodyFit {
  formType: BlobFormType;
  halfSize: Vec3;
  parameters: BlobFormParameters;
  eyePosition: Vec3;
  cornerRadius: number;
  /** Ellipse expansion needed to cover a rounded rectangular body. */
  crownCoverage: number;
  /** Smooth adjustment near minimum size; zero at ordinary/default sizes. */
  compactness: number;
}

/** Horizontal keeps height fixed; uniform uses the widest horizontal dimension. */
export type WearableScaling = "body" | "horizontal" | "uniform" | "none";

export type WearableMount =
  | { kind: "crown"; bottom: number; inset?: number; cubeInset?: number; scaling?: WearableScaling }
  | { kind: "hair"; bottom?: number; scaling?: WearableScaling; cubeDepthScale?: number }
  | { kind: "body" }
  | { kind: "eyes"; front: number; compactForward?: number; compactScale?: number }
  | { kind: "face"; eyeOffset: number; clearance: number };

export interface WearableTransform {
  position: Vec3;
  scale: Vec3;
}

function scaleWearable(width: number, height: number, depth: number, scaling: WearableScaling): Vec3 {
  switch (scaling) {
    case "none": return [1, 1, 1];
    case "horizontal": return [width, 1, depth];
    case "uniform": {
      const widest = Math.max(width, depth);
      return [widest, widest, widest];
    }
    case "body": return [width, height, depth];
  }
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
  const radius = isBoxForm(formType) ? getCubeCornerRadius(parameters) : 0;
  const minimumSize = !isBoxForm(formType)
    ? FORM_PARAMETER_RANGES.sphere.sphereRadius.min
    : Math.max(...["cubeWidth", "cubeHeight", "cubeDepth"].map(key => FORM_PARAMETER_RANGES.cube[key].min / 2));
  const defaultHalfSize = getBlobFormHalfSize(formType, defaults);
  const defaultSize = Math.max(...defaultHalfSize);

  return {
    formType,
    halfSize,
    parameters,
    eyePosition: getBobEyePosition([0, 0.2, 0.85], formType, parameters),
    cornerRadius: radius,
    crownCoverage: isBoxForm(formType) ? cornerCoverage([halfSize[0], halfSize[2]], radius) : 1,
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
      const crownRadius = body.formType === "egg" ? getEggRadiusAtY(y * 0.65, body.parameters) : x;
      const width = crownRadius * body.crownCoverage;
      const depth = body.formType === "egg" ? crownRadius : z * body.crownCoverage;
      const height = body.formType === "sphere" ? y : Math.min(width, depth);
      const scale = scaleWearable(width, height, depth, mount.scaling ?? "horizontal");
      const inset = mount.cubeInset === undefined
        ? (mount.inset ?? 0.02) * height
        : mount.cubeInset * scale[1];
      return {
        // Cube seating follows the hat's own height, independent of body aspect ratio.
        position: [0, body.formType === "sphere"
          ? mount.bottom * (height - scale[1])
          : y - mount.bottom * scale[1] - inset, 0],
        scale,
      };
    }
    case "hair": {
      const scalp = body.formType === "egg" ? getEggRadiusAtY(y * 0.6, body.parameters) : null;
      const scale = scaleWearable((scalp ?? x) * body.crownCoverage, y, (scalp ?? z) * body.crownCoverage, mount.scaling ?? "horizontal");
      if (isBoxForm(body.formType)) {
        // Extra afro depth is needed on wide, shallow bodies; fade it out on deep forms.
        const shallowBlend = Math.max(0, 1 - z / x);
        scale[2] *= 1 + ((mount.cubeDepthScale ?? 1) - 1) * shallowBlend;
      }
      return {
        // Hair wraps the scalp; keep its unit-height attachment at the body top.
        position: [0, body.formType === "egg" && mount.bottom !== undefined
          ? Math.max(y - scale[1], -y - mount.bottom * scale[1])
          : y - scale[1], 0],
        scale,
      };
    }
    case "body":
      // Procedural models consume body measurements directly, keeping round
      // details round instead of stretching an imported asset.
      return { position: [0, 0, 0], scale: [1, 1, 1] };
    case "eyes": {
      // Lens spacing/size follow the unchanged eyes. Stretch the temples in
      // depth while keeping the front frame anchored to the existing face.
      const frameScale = getBobFaceScale(body.formType, body.parameters) * (1 + ((mount.compactScale ?? 1) - 1) * body.compactness);
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
      const surfaceZ = body.formType === "egg" ? getEggRadiusAtY(faceY, body.parameters) : isBoxForm(body.formType) ? z : Math.sqrt(Math.max(0, z * z - faceY * faceY));
      return {
        position: [0, faceY, surfaceZ + mount.clearance],
        scale: [x, height, !isBoxForm(body.formType) ? z : 1],
      };
    }
  }
}
