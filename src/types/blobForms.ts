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

  // pill parameters (using CylinderGeometry)
  pillRadiusTop?: number;
  pillRadiusBottom?: number;
  pillHeight?: number;
  pillRadialSegments?: number;
}

export type BlobFormType = "sphere" | "cube";

// TODO: fix default value mixup
// default parameter configurations for each form type
export const DEFAULT_FORM_PARAMETERS: Record<BlobFormType, BlobFormParameters> =
  {
    sphere: {
      sphereRadius: 1,
      sphereWidthSegments: 24,
      sphereHeightSegments: 16,
    },
    cube: {
      cubeWidth: 1.75,
      cubeHeight: 1.75,
      cubeDepth: 1.65,
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
  cube: {
    cubeWidth: {
      min: 0.8,
      max: 2.5,
      step: 0.05,
      default: 1.75,
      label: "Breite",
      description: "Breite von Bobs Körper",
    },
    cubeHeight: {
      min: 0.8,
      max: 2.5,
      step: 0.05,
      default: 1.75,
      label: "Höhe",
      description: "Höhe von Bobs Körper",
    },
    cubeDepth: {
      min: 0.8,
      max: 2.5,
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
  if (formType === "cube") {
    const defaults = DEFAULT_FORM_PARAMETERS.cube;
    return [
      (parameters.cubeWidth ?? defaults.cubeWidth!) / 2,
      (parameters.cubeHeight ?? defaults.cubeHeight!) / 2,
      (parameters.cubeDepth ?? defaults.cubeDepth!) / 2,
    ];
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
  if (formType === "cube") {
    return [
      x,
      y + ((parameters.cubeHeight || 1.75) - 1.75) * 0.4,
      z + ((parameters.cubeDepth || 1.65) - 1.65) * 0.5,
    ];
  }
  const radiusDiff = (parameters.sphereRadius || 1) - 1;
  return [x, y + radiusDiff * 0.4, z + radiusDiff * 1.2];
}
