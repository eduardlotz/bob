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
// | "pill";

// default parameter configurations for each form type
export const DEFAULT_FORM_PARAMETERS: Record<BlobFormType, BlobFormParameters> =
  {
    sphere: {
      sphereRadius: 1,
      sphereWidthSegments: 64,
      sphereHeightSegments: 64,
    },
    cube: {
      cubeWidth: 1.75,
      cubeHeight: 1.75,
      cubeDepth: 1.65,
      cubeRadius: 0.05,
    },
    // pill: {
    //   pillRadiusTop: 0.8,
    //   pillRadiusBottom: 0.8,
    //   pillHeight: 1.6,
    //   pillRadialSegments: 32,
    // },
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
      label: "Radius",
      description: "Size of the sphere",
    },
    sphereWidthSegments: {
      min: 8,
      max: 128,
      step: 8,
      default: 64,
      label: "Width Detail",
      description: "Horizontal resolution",
    },
    sphereHeightSegments: {
      min: 8,
      max: 128,
      step: 8,
      default: 64,
      label: "Height Detail",
      description: "Vertical resolution",
    },
  },
  cube: {
    cubeWidth: {
      min: 0.8,
      max: 2.5,
      step: 0.05,
      default: 1.75,
      label: "Width",
      description: "Width of the cube",
    },
    cubeHeight: {
      min: 0.8,
      max: 2.5,
      step: 0.05,
      default: 1.75,
      label: "Height",
      description: "Height of the cube",
    },
    cubeDepth: {
      min: 0.8,
      max: 2.5,
      step: 0.05,
      default: 1.65,
      label: "Depth",
      description: "Depth of the cube",
    },
    cubeRadius: {
      min: 0.0,
      max: 0.5,
      step: 0.02,
      default: 0.2,
      label: "Roundness",
      description: "Corner roundness",
    },
  },
  // pill: {
  //   pillRadiusTop: {
  //     min: 0.4,
  //     max: 1.5,
  //     step: 0.1,
  //     default: 0.8,
  //     label: "Top Radius",
  //     description: "Radius of the top cap",
  //   },
  //   pillRadiusBottom: {
  //     min: 0.4,
  //     max: 1.5,
  //     step: 0.1,
  //     default: 0.8,
  //     label: "Bottom Radius",
  //     description: "Radius of the bottom cap",
  //   },
  //   pillHeight: {
  //     min: 0.8,
  //     max: 2.5,
  //     step: 0.1,
  //     default: 1.6,
  //     label: "Height",
  //     description: "Height of the pill",
  //   },
  //   pillRadialSegments: {
  //     min: 8,
  //     max: 64,
  //     step: 8,
  //     default: 32,
  //     label: "Smoothness",
  //     description: "Cylinder detail level",
  //   },
  // },
};

// initial blob form configurations
export const INITIAL_BLOB_FORMS: BlobFormConfig[] = [
  {
    id: "sphere",
    name: "Bouba",
    description: "Bob der Ball",
    cost: 0,
    unlocked: true,
    selected: true,
    parameters: DEFAULT_FORM_PARAMETERS.sphere,
  },
  {
    id: "cube",
    name: "Kiki",
    description: "A more structured approach",
    cost: 500,
    unlocked: false,
    selected: false,
    parameters: DEFAULT_FORM_PARAMETERS.cube,
  },
  // {
  //   id: "pill",
  //   name: "Pill",
  //   description: "Smooth and rounded",
  //   cost: 1000,
  //   unlocked: false,
  //   selected: false,
  //   parameters: DEFAULT_FORM_PARAMETERS.pill,
  // },
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
