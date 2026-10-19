export type TrackKind = "size" | "width" | "height" | "depth" | "rounding" | "roundingLower";
export interface TrackPoint { x: number; y: number }
export interface HorizontalTrackLayout { width: number; inset: number }
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

/** Bounded rubber-band resistance; values and visual overshoot are independent. */
export const rubberBand = (distance: number, limit = 38) => limit * Math.tanh(distance / (limit * 2));

export function trackPoint(kind: TrackKind, t: number, horizontal?: HorizontalTrackLayout): TrackPoint {
  switch (kind) {
    case "width": return { x: horizontal ? horizontal.inset + t * (horizontal.width - horizontal.inset * 2) : 38 + t * 244, y: (horizontal ? 65 : 90) + Math.sin(t * Math.PI) * (horizontal ? 12 : 20) };
    case "height": return { x: 70 + Math.sin(t * Math.PI) * 25, y: 262 - t * 224 };
    case "depth": return { x: 130 - Math.sin(t * Math.PI) * 20, y: 190 - t * 130 };
    case "size": return { x: 70 + Math.sin(t * Math.PI) * 25, y: 262 - t * 224 };
    case "roundingLower": return { x: 132 - Math.sin(t * Math.PI / 2) * 100, y: 50 + Math.cos(t * Math.PI / 2) * 100 };
    case "rounding": {
      const angle = Math.PI + t * Math.PI / 2;
      return { x: 132 + Math.cos(angle) * 100, y: 150 + Math.sin(angle) * 100 };
    }
  }
}

/** One value axis for every shape. Cross-axis travel only bends the string. */
export function trackProgress(kind: TrackKind, point: TrackPoint, horizontal?: HorizontalTrackLayout): number {
  if (kind === "width") return horizontal ? (point.x - horizontal.inset) / (horizontal.width - horizontal.inset * 2) : (point.x - 38) / 244;
  if (kind === "depth") return (190 - point.y) / 130;
  if (kind === "roundingLower") return trackProgress("rounding", { x: 164 - point.x, y: point.y });
  if (kind === "rounding") {
    const diagonal = (point.x - point.y + 18) / 100;
    if (diagonal < -1) return (diagonal + 1) / 2;
    if (diagonal > 1) return 1 + (diagonal - 1) / 2;
    return (Math.asin(diagonal / Math.SQRT2) + Math.PI / 4) / (Math.PI / 2);
  }
  return (262 - point.y) / 224;
}

/** Dragging follows a fixed value axis, even when the pointer leaves a curve. */
export function dragTrackProgress(kind: TrackKind, startT: number, dx: number, dy: number, horizontal?: HorizontalTrackLayout): number {
  if (kind === "width") return startT + dx / (horizontal ? horizontal.width - horizontal.inset * 2 : 244);
  if (kind === "depth") return startT - dy / 130;
  if (kind === "roundingLower") return startT + (-dx - dy) / 200;
  if (kind === "rounding") return startT + (dx - dy) / 200;
  return startT - dy / 224;
}

export function trackTangent(kind: TrackKind, t: number, horizontal?: HorizontalTrackLayout): TrackPoint {
  const a = trackPoint(kind, t - 0.001, horizontal), b = trackPoint(kind, t + 0.001, horizontal);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}

/** Interior pulls keep both ends pinned. At a limit, the endpoint stretches too. */
export function deformTrack(kind: TrackKind, t: number, dx: number, dy: number, horizontal?: HorizontalTrackLayout): string {
  const anchor = clamp(t, 0.0001, 0.9999);
  const samples = Array.from(new Set([...Array.from({ length: 65 }, (_, i) => i / 64), clamp(t)])).sort((a, b) => a - b);
  const points = samples.map((u, i) => {
    const point = trackPoint(kind, u, horizontal);
    const relative = u <= anchor ? u / anchor : (1 - u) / (1 - anchor);
    const weight = t <= 0 ? Math.cos(u * Math.PI / 2) : t >= 1 ? Math.sin(u * Math.PI / 2) : Math.sin(relative * Math.PI / 2);
    return `${i ? "L" : "M"}${(point.x + dx * weight).toFixed(2)},${(point.y + dy * weight).toFixed(2)}`;
  });
  return points.join(" ");
}

export function quantizeValue(value: number, min: number, max: number, step: number): number {
  return Number(clamp(min + Math.round((value - min) / step) * step, min, max).toFixed(6));
}
