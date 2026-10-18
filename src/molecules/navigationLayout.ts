import { MathUtils, PerspectiveCamera, Vector3, type Camera, type Object3D } from "three";

// The approved menu was laid out in this reference perspective projection.
// HTML is outside the scene's lens pass, so it must not inherit the render FOV
// that SceneLens changes when switching between fisheye and direct rendering.
const MENU_FOV = 50;
const MENU_DISTANCE = 7;
export const OPTIONS_Y_OFFSET = -1.5;
const MENU_MARGIN = 0.1;
const BOTTOM_NAV_MARGIN = 0.15;
const MENU_TAN_HALF_FOV = Math.tan(MathUtils.degToRad(MENU_FOV) / 2);

export function getNavigationPositions(count: number, width: number, height: number) {
  if (count <= 0 || width <= 0 || height <= 0) return [];

  const worldHeight = 2 * MENU_TAN_HALF_FOV * MENU_DISTANCE;
  const worldWidth = worldHeight * width / height;
  const halfSafeWidth = worldWidth * (1 - 2 * MENU_MARGIN) / 2;
  const halfSafeHeight = worldHeight * (1 - MENU_MARGIN - BOTTOM_NAV_MARGIN) / 2;
  const radiusMultiplier = Math.min(1, Math.sqrt(count / 6));
  const bottomOffset = worldHeight * (BOTTOM_NAV_MARGIN + 0.05);
  const centerX = width < 768 ? 0 : -0.5;

  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * halfSafeWidth * radiusMultiplier;
    const y = Math.sin(angle) * halfSafeHeight * radiusMultiplier;
    return new Vector3(
      x + centerX,
      Math.max(-halfSafeHeight + bottomOffset, Math.min(halfSafeHeight, y)) + OPTIONS_Y_OFFSET,
      0,
    );
  });
}

/** Preserve menu framing while following the live camera pose and transitions.
 * Each calculator reuses a scratch vector without camera clones or React updates.
 */
export function createNavigationPositionCalculator() {
  const point = new Vector3();
  return (object: Object3D, camera: Camera, size: { width: number; height: number }): number[] => {
    point.setFromMatrixPosition(object.matrixWorld);
    if (camera instanceof PerspectiveCamera) {
      point.applyMatrix4(camera.matrixWorldInverse);
      const focalLength = size.height * camera.zoom / (2 * MENU_TAN_HALF_FOV);
      return [
        size.width / 2 + point.x * focalLength / -point.z,
        size.height / 2 - point.y * focalLength / -point.z,
      ];
    }
    point.project(camera);
    return [(point.x + 1) * size.width / 2, (1 - point.y) * size.height / 2];
  };
}
