import { type Camera, Quaternion, Vector3 } from "three";

const FLIGHT_SECONDS = .38;
const FOCUS_DISTANCE = .72;

/** Books, sleeves, and prints share one centered inspection pose. */
export function roomObjectFocusPose(
  camera: Camera,
  viewport: { width: number; height: number },
  position: Vector3,
  rotation: Quaternion,
  width: number,
  height: number,
  lensRadius?: number,
  depth = 0,
) {
  const distance = FOCUS_DISTANCE;
  const halfWidth = lensRadius ? distance * viewport.width / lensRadius : distance / camera.projectionMatrix.elements[0];
  const halfHeight = lensRadius ? distance * viewport.height / lensRadius : distance / camera.projectionMatrix.elements[5];
  position.set(0, 0, -distance);
  camera.updateWorldMatrix(true, false);
  position.applyMatrix4(camera.matrixWorld);
  camera.getWorldQuaternion(rotation);
  // Thick objects also need clearance to turn without crossing the camera.
  const turnClearance = depth > 0 ? (distance - .12) / Math.hypot(width / 2, height / 2, depth / 2) : Infinity;
  return Math.min(halfHeight * 1.5 / height, halfWidth * 1.5 / width, turnClearance);
}

export function roomObjectFlightProgress(elapsed: number) {
  const t = Math.min(1, Math.max(0, elapsed / FLIGHT_SECONDS));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
