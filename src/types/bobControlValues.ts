import { DEFAULT_FORM_PARAMETERS, FORM_PARAMETER_RANGES, getBlobFormParameterRange, normalizeBlobFormParameters, isBoxForm, type BlobFormParameters, type BlobFormType } from "@/types/blobForms";
export type BobParameter = "sphereRadius" | "cubeWidth" | "cubeHeight" | "cubeDepth" | "cubeRadius" | "eggUpperRadius" | "eggLowerRadius";

/** The editor steps in user-facing units without changing stored model units. */
export function getBobControlValues(form: BlobFormType, key: BobParameter, parameters: BlobFormParameters) {
  const range = getBlobFormParameterRange(form, key, parameters);
  const base = DEFAULT_FORM_PARAMETERS[form][key] ?? range.default;
  const rounding = key === "cubeRadius";
  const span = FORM_PARAMETER_RANGES.cube.cubeRadius.max - FORM_PARAMETER_RANGES.cube.cubeRadius.min;
  const toDisplay = (number: number) => rounding ? (number - range.min) / span * 100 : number / base;
  const toModel = (number: number) => Number((rounding ? range.min + number / 100 * span : number * base).toFixed(8));
  const step = rounding ? 10 : 0.1;
  const min = rounding ? 0 : Number((Math.ceil(range.min / base * 10 - 1e-7) / 10).toFixed(1));
  const max = rounding ? Math.max(0, Math.floor(toDisplay(range.max) / 10 + 1e-7) * 10) : Number((Math.floor(range.max / base * 10 + 1e-7) / 10).toFixed(1));
  const value = Number(Math.max(min, Math.min(max, Math.round(toDisplay(parameters[key] ?? base) / step) * step)).toFixed(1));
  return { value, min, max, step, defaultValue: rounding ? 0 : 1, toModel, rounding, constrained: rounding && range.max < FORM_PARAMETER_RANGES.cube.cubeRadius.max };
}

/** A dimension clamp also lands roundness on a truthful, reachable 10% value. */
export function normalizeBobEditorParameters(form: BlobFormType, parameters: BlobFormParameters) {
  const normalized = normalizeBlobFormParameters(form, parameters);
  if (isBoxForm(form) && normalized.cubeRadius! < (parameters.cubeRadius ?? DEFAULT_FORM_PARAMETERS.cube.cubeRadius!)) {
    const rounding = getBobControlValues(form, "cubeRadius", normalized);
    normalized.cubeRadius = rounding.toModel(rounding.value);
  }
  return normalized;
}

export function getBobParameterKeys(form: BlobFormType): BobParameter[] {
  if (form === "cube") return ["cubeRadius", "cubeWidth"];
  if (form === "cuboid") return ["cubeRadius", "cubeDepth", "cubeHeight", "cubeWidth"];
  if (form === "egg") return ["eggUpperRadius", "eggLowerRadius"];
  return ["sphereRadius"];
}
