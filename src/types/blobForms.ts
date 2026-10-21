import { getEggMeasurements, getEggRadiusAtY } from "./eggShape";
// blob form types and configurations
export interface BlobFormConfig {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  selected: boolean;
  // form-specific parameters that can be customized
  parameters: BlobFormParameters;
}

export interface BlobFormParameters {
  // sphere parameters
  sphereRadius?: number;
  sphereWidthSegments?: number;
  sphereHeightSegments?: number;

  // cube parameters (using RoundedBox)
  cubeWidth?: number;
  cubeHeight?: number;
  cubeDepth?: number;
  cubeRadius?: number;

  eggUpperRadius?: number;
  eggLowerRadius?: number;

  // pill parameters (using CylinderGeometry)
  pillRadiusTop?: number;
  pillRadiusBottom?: number;
  pillHeight?: number;
  pillRadialSegments?: number;
}

export type BlobFormType = "sphere" | "cube" | "cuboid" | "egg";

// default parameter configurations for each form type
export const DEFAULT_FORM_PARAMETERS: Record<BlobFormType, BlobFormParameters> =
  {
    sphere: {
      sphereRadius: 1,
      sphereWidthSegments: 24,
      sphereHeightSegments: 16,
    },
    cuboid: {
      cubeWidth: 1.75,
      cubeHeight: 1.75,
      cubeDepth: 1.65,
      cubeRadius: 0.05,
    },
    egg: { eggUpperRadius: 0.72, eggLowerRadius: 1 },
    cube: {
      cubeWidth: 1.75,
      cubeHeight: 1.75,
      cubeDepth: 1.75,
      cubeRadius: 0.05,
    },
  };

// parameter ranges for sliders
export interface BlobFormParameterRange {
  min: number;
  max: number;
  step: number;
  default: number;
  label: string;
  description: string;
}

export const FORM_PARAMETER_RANGES: Record<
  BlobFormType,
  Record<string, BlobFormParameterRange>
> = {
  sphere: {
    sphereRadius: {
      min: 0.5,
      max: 2.0,
      step: 0.1,
      default: 1,
      label: "Größe",
      description: "Höhe und Breite von Bobs Körper",
    },
  },
  egg: {
    eggUpperRadius: { min: 0.4, max: 1.8, step: 0.05, default: 0.72, label: "Oben", description: "Größe der oberen Rundung" },
    eggLowerRadius: { min: 0.5, max: 2, step: 0.05, default: 1, label: "Unten", description: "Größe der unteren Rundung" },
  },
  cuboid: {} as Record<string, BlobFormParameterRange>,
  cube: {
    cubeWidth: {
      min: 0.4,
      max: 3.5,
      step: 0.05,
      default: 1.75,
      label: "Breite",
      description: "Breite von Bobs Körper",
    },
    cubeHeight: {
      min: 0.4,
      max: 3.5,
      step: 0.05,
      default: 1.75,
      label: "Höhe",
      description: "Höhe von Bobs Körper",
    },
    cubeDepth: {
      min: 0.4,
      max: 3.5,
      step: 0.05,
      default: 1.65,
      label: "Tiefe",
      description: "Tiefe von Bobs Körper",
    },
    cubeRadius: {
      min: 0.05,
      max: 0.4,
      step: 0.05,
      default: 0.05,
      label: "Abrundung",
      description: "Wie rund die Ecken von Bobs Körper sind",
    },
  },
};

FORM_PARAMETER_RANGES.cuboid = FORM_PARAMETER_RANGES.cube;

export const isBoxForm = (form: BlobFormType) => form === "cube" || form === "cuboid";

/** Rounding must fit inside every axis, including very thin Cube forms. */
export function getBlobFormParameterRange(
  formType: BlobFormType,
  key: string,
  parameters: BlobFormParameters,
): BlobFormParameterRange {
  const range = FORM_PARAMETER_RANGES[formType][key];
  if (!isBoxForm(formType) || key !== "cubeRadius") return range;
  const halfSize = Math.min(...getBlobFormHalfSize("cube", parameters));
  const max = Math.min(range.max, Math.floor((halfSize + 1e-8) / range.step) * range.step);
  return { ...range, max: Number(max.toFixed(2)) };
}

export function normalizeBlobFormParameters(
  formType: BlobFormType,
  parameters: BlobFormParameters,
): BlobFormParameters {
  const normalized = { ...DEFAULT_FORM_PARAMETERS[formType], ...parameters };
  for (const [key, range] of Object.entries(FORM_PARAMETER_RANGES[formType])) {
    const parameter = key as keyof BlobFormParameters;
    const value = normalized[parameter];
    normalized[parameter] = typeof value === "number" && Number.isFinite(value)
      ? Math.max(range.min, Math.min(range.max, value))
      : range.default;
  }
  if (formType === "cube") {
    normalized.cubeHeight = normalized.cubeDepth = normalized.cubeWidth;
  }
  if (isBoxForm(formType)) {
    normalized.cubeRadius = Math.min(normalized.cubeRadius!, getBlobFormParameterRange(formType, "cubeRadius", normalized).max);
  }
  return normalized;
}

export function getCubeCornerRadius(parameters: BlobFormParameters): number {
  const requested = parameters.cubeRadius ?? DEFAULT_FORM_PARAMETERS.cube.cubeRadius!;
  return Math.min(requested, Math.min(...getBlobFormHalfSize("cube", parameters)) - 0.00001);
}

// initial blob form configurations
export const INITIAL_BLOB_FORMS: BlobFormConfig[] = [
  {
    id: "sphere",
    name: "Ball",
    description: "Der Ball",
    cost: 0,
    unlocked: true,
    selected: true,
    parameters: DEFAULT_FORM_PARAMETERS.sphere,
  },
  { id: "egg", name: "Egg", description: "Das Ei", cost: 0, unlocked: true, selected: false, parameters: DEFAULT_FORM_PARAMETERS.egg },
  { id: "cuboid", name: "Cuboid", description: "Der Quader", cost: 0, unlocked: true, selected: false, parameters: DEFAULT_FORM_PARAMETERS.cuboid },
  {
    id: "cube",
    name: "Cube",
    description: "Der Würfel",
    cost: 0,
    unlocked: true,
    selected: false,
    parameters: DEFAULT_FORM_PARAMETERS.cube,
  },
];

// utility functions
export const getBlobFormById = (
  forms: BlobFormConfig[],
  id: string
): BlobFormConfig | undefined => {
  return forms.find((form) => form.id === id);
};

export const getSelectedBlobForm = (
  forms: BlobFormConfig[]
): BlobFormConfig => {
  return forms.find((form) => form.selected) || forms[0];
};

export const getBlobFormType = (formId: string): BlobFormType => {
  return formId as BlobFormType;
};

export const getParametersForForm = (
  formId: string,
  forms: BlobFormConfig[]
): BlobFormParameters => {
  const form = getBlobFormById(forms, formId);
  return form?.parameters || DEFAULT_FORM_PARAMETERS[getBlobFormType(formId)];
};

/** Shared body dimensions, independent of rendering and game physics. */
export function getBlobFormHalfSize(
  formType: BlobFormType,
  parameters: BlobFormParameters,
): [number, number, number] {
  if (isBoxForm(formType)) {
    const defaults = DEFAULT_FORM_PARAMETERS.cube;
    return [
      (parameters.cubeWidth ?? defaults.cubeWidth!) / 2,
      (parameters.cubeHeight ?? defaults.cubeHeight!) / 2,
      (parameters.cubeDepth ?? defaults.cubeDepth!) / 2,
    ];
  }
  if (formType === "egg") {
    const egg = getEggMeasurements(parameters);
    return [egg.radius, egg.halfHeight, egg.radius];
  }
  const radius = parameters.sphereRadius ?? DEFAULT_FORM_PARAMETERS.sphere.sphereRadius!;
  return [radius, radius, radius];
}

/** Keep the same facial placement on home Bob and the decorative minigame body. */
export function getBobEyePosition(
  [x, y, z]: [number, number, number],
  formType: BlobFormType,
  parameters: BlobFormParameters,
): [number, number, number] {
  if (isBoxForm(formType)) {
    return [
      x,
      y + ((parameters.cubeHeight || 1.75) - 1.75) * 0.4,
      z + ((parameters.cubeDepth || 1.65) - 1.65) * 0.5,
    ];
  }
  if (formType === "egg") {
    const egg = getEggMeasurements(parameters);
    const eyeY = y + (egg.halfHeight - 1) * 0.25;
    const surface = getEggRadiusAtY(eyeY, parameters);
    return [x, eyeY, Math.max(0.25, surface - 0.03)];
  }
  const radiusDiff = (parameters.sphereRadius || 1) - 1;
  return [x, y + radiusDiff * 0.4, z + radiusDiff * 1.2];
}

/** Small Bob floats at his normal centre height; lift larger bodies clear of the floor. */
export function getBobGroundOffset(form: BlobFormType, parameters: BlobFormParameters) {
  return Math.max(0, getBlobFormHalfSize(form, parameters)[1] - 1) * 1.2;
}

/** Keep the egg face inside the smallest rounded body without moving its features apart. */
export function getBobFaceScale(form: BlobFormType, parameters: BlobFormParameters) {
  if (form !== "egg") return 1;
  const eye = getBobEyePosition([0, 0.2, 0.85], form, parameters);
  return Math.min(1, getEggRadiusAtY(eye[1], parameters) / 0.72);
}
