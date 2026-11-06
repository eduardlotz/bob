import { type Camera, Quaternion, Vector3 } from "three";

export const LIBRARY_BOOK_FLIGHT_SECONDS = 0.65;
export const LIBRARY_BOOK_FOCUS_DISTANCE = 0.8;
const BOOK_HEIGHT = 1.08;
const BOOK_WIDTH = 0.75;
const BOOK_RADIUS = Math.hypot(BOOK_WIDTH / 2, BOOK_HEIGHT / 2, 0.105 / 2);

/** Camera-local framing leaves room for the side drawer or the mobile bottom sheet. */
export function libraryBookFocusPose(
  camera: Camera,
  viewport: { width: number; height: number },
  position: Vector3,
  rotation: Quaternion,
  lensRadius?: number,
) {
  const mobile = viewport.width < 760;
  const distance = LIBRARY_BOOK_FOCUS_DISTANCE;
  // The fisheye's screen scale differs from the hidden perspective camera,
  // especially on portrait screens. Size the book for the displayed lens.
  const halfWidth = lensRadius ? distance * viewport.width / lensRadius : distance / camera.projectionMatrix.elements[0];
  const halfHeight = lensRadius ? distance * viewport.height / lensRadius : distance / camera.projectionMatrix.elements[5];
  const drawerFraction = mobile ? 0 : Math.min(0.52, 388 / viewport.width);
  const centerX = -drawerFraction;
  const centerY = mobile ? 0.42 : 0;
  if (lensRadius) {
    const x = centerX * viewport.width / (2 * lensRadius);
    const y = centerY * viewport.height / (2 * lensRadius);
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    position.set(2 * x * z, 2 * y * z, 1 - 2 * z * z).multiplyScalar(-distance / (1 - 2 * z * z));
  } else position.set(halfWidth * centerX, halfHeight * centerY, -distance);
  camera.updateWorldMatrix(true, false);
  position.applyMatrix4(camera.matrixWorld);
  camera.getWorldQuaternion(rotation);
  // A large cover in the available screen area, with clearance for a full orbit.
  return Math.min(
    (distance - 0.12) / BOOK_RADIUS,
    halfHeight * (mobile ? 0.96 : 1.55) / BOOK_HEIGHT,
    halfWidth * (mobile ? 1.65 : (1 - drawerFraction) * 1.6) / BOOK_WIDTH,
  );
}

export function libraryBookFlightProgress(elapsed: number) {
  const t = Math.min(1, Math.max(0, elapsed / LIBRARY_BOOK_FLIGHT_SECONDS));
  return 1 - (1 - t) ** 3;
}
