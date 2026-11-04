import type { TransitionShape } from "@/styles/screenTransitions";

const CIRCLE = "M1 0A1 1 0 1 0-1 0A1 1 0 1 0 1 0Z";
const ROUNDED_RECTANGLE = "M-.7-1H.7Q1-1 1-.7V.7Q1 1 .7 1H-.7Q-1 1-1 .7V-.7Q-1-1-.7-1Z";
const apertureImages = new Map<string, string>();

export interface BobTransitionFocus { x: number; y: number; halfWidth: number; halfHeight: number; }
/** Updated by the visible Bob, without rerendering the application every frame. */
export const bobTransitionFocus: { current: BobTransitionFocus | null } = { current: null };

export function getInitialTransitionCenter(width: number, height: number, focus: BobTransitionFocus | null) {
  return { x: width / 2, y: (focus?.y ?? height / 2) - 10 };
}

export function getTransitionGeometry(
  width: number, height: number, progress: number,
  shape: TransitionShape, bobShape: string, aspectRatio: number,
  focus: BobTransitionFocus | null,
  center?: Pick<BobTransitionFocus, "x" | "y">,
) {
  const x = center?.x ?? focus?.x ?? width / 2;
  const y = center?.y ?? focus?.y ?? height / 2;
  const resolved = shape === "bob" ? (bobShape === "sphere" ? "circle" : bobShape === "egg" ? "oval" : "rounded-rectangle") : shape;
  const ratio = resolved === "circle" ? 1 : typeof resolved === "object" ? resolved.aspectRatio ?? 1 : aspectRatio;
  const ratioX = Math.min(1, ratio), ratioY = Math.min(1, 1 / ratio);
  const innerRadius = typeof resolved === "object" ? resolved.innerRadius : 1;
  const minimum = focus ? Math.max(focus.halfWidth / ratioX, focus.halfHeight / ratioY) / innerRadius : 0;
  const farthestCorner = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  const maximum = (farthestCorner + 2) / Math.min(ratioX, ratioY) / innerRadius;
  const radius = minimum + (maximum - minimum) * progress;
  return {
    x, y, halfWidth: radius * ratioX, halfHeight: radius * ratioY,
    outerRadius: resolved === "rounded-rectangle" || typeof resolved === "object"
      ? Math.hypot(radius * ratioX, radius * ratioY)
      : Math.max(radius * ratioX, radius * ratioY),
    path: typeof resolved === "object" ? resolved.path : resolved === "rounded-rectangle" ? ROUNDED_RECTANGLE : CIRCLE,
  };
}

export function getTransitionMask(width: number, height: number, geometry: ReturnType<typeof getTransitionGeometry>) {
  const { x, y, halfWidth, halfHeight, path } = geometry;
  let image = apertureImages.get(path);
  if (!image) {
    // Decode each silhouette once. Updating an SVG data URL every animation
    // frame can make WebKit repeatedly load mask images, leaving gaps while busy.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 2 2" width="2" height="2" preserveAspectRatio="none"><path d="${path}" fill="black"/></svg>`;
    image = `url("data:image/svg+xml,${encodeURIComponent(svg)}"), linear-gradient(#000, #000)`;
    apertureImages.set(path, image);
  }
  return {
    image,
    size: `${Math.max(0, halfWidth * 2)}px ${Math.max(0, halfHeight * 2)}px, ${width}px ${height}px`,
    position: `${x - halfWidth}px ${y - halfHeight}px, 0px 0px`,
  };
}
