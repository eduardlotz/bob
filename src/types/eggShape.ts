import type { BlobFormParameters } from "./blobForms";

// Height relative to the widest radius of the approved default egg.
const DEFAULT_EGG_ASPECT = 1.148;

function radiusSquared(y: number, upper: number, lower: number, separation: number) {
  const a = upper ** 2 - (y - separation / 2) ** 2;
  const b = lower ** 2 - (y + separation / 2) ** 2;
  const blend = Math.min(upper, lower) ** 2 * 0.8;
  const h = Math.max(blend - Math.abs(a - b), 0) / blend;
  return Math.max(a, b) + h * h * blend / 4;
}

/** Preserve ordinary gooey proportions; taper the whole body for very unequal lobes. */
export function getEggLobes(parameters: BlobFormParameters) {
  const upper = parameters.eggUpperRadius ?? 0.72;
  const lower = parameters.eggLowerRadius ?? 1;
  const smallest = Math.min(upper, lower);
  // Keep the narrow end exposed instead of allowing it to be swallowed by
  // the larger sphere. Ordinary/default proportions retain their old blend.
  const separation = Math.max(smallest * 0.8, Math.abs(upper - lower) + smallest * 0.4);
  let top = Math.max(separation / 2 + upper, -separation / 2 + lower);
  let bottom = Math.min(separation / 2 - upper, -separation / 2 - lower);
  // Smooth merging can extend a pole slightly when one lobe contains the other.
  const pole = (inside: number, outside: number) => {
    if (radiusSquared(inside, upper, lower, separation) < 1e-12) return inside;
    for (let i = 0; i < 32; i++) {
      const middle = (inside + outside) / 2;
      if (radiusSquared(middle, upper, lower, separation) > 0) inside = middle; else outside = middle;
    }
    return (inside + outside) / 2;
  };
  top = pole(top, top + Math.min(upper, lower));
  bottom = pole(bottom, bottom - Math.min(upper, lower));
  const unionHalfHeight = (top - bottom) / 2;
  const difference = Math.abs(upper - lower) / (upper + lower);
  const blendProgress = Math.max(0, Math.min(1, (difference - 0.2) / 0.25));
  const taperBlend = blendProgress ** 2 * (3 - 2 * blendProgress);
  const halfHeight = unionHalfHeight + (Math.max(upper, lower) * DEFAULT_EGG_ASPECT - unionHalfHeight) * taperBlend;
  return { upper, lower, separation, center: (top + bottom) / 2, halfHeight, unionHalfHeight, taperBlend };
}

export function getEggRadiusAtY(y: number, parameters: BlobFormParameters) {
  const { upper, lower, separation, center, halfHeight, unionHalfHeight, taperBlend } = getEggLobes(parameters);
  if (Math.abs(y) >= halfHeight - 1e-10) return 0;
  const t = y / halfHeight;
  const unionRadius = Math.sqrt(Math.max(0, radiusSquared(t * unionHalfHeight + center, upper, lower, separation)));
  if (taperBlend === 0) return unionRadius;

  // A continuously varying round section cannot swallow the narrow end or
  // produce a second bulge. Normalising its peak preserves the larger size.
  const mean = (upper + lower) / 2;
  const skew = (upper - lower) / 2;
  const peakT = 2 * skew / (mean + Math.sqrt(mean * mean + 8 * skew * skew));
  const peakRadius = Math.sqrt(1 - peakT * peakT) * (mean + skew * peakT);
  const taperRadius = Math.sqrt(1 - t * t) * (mean + skew * t) * Math.max(upper, lower) / peakRadius;
  return unionRadius + (taperRadius - unionRadius) * taperBlend;
}

export function getEggMeasurements(parameters: BlobFormParameters) {
  const { halfHeight } = getEggLobes(parameters);
  let radius = 0;
  for (let i = 0; i <= 64; i++) radius = Math.max(radius, getEggRadiusAtY(-halfHeight + i / 64 * halfHeight * 2, parameters));
  return { radius, halfHeight };
}
