import * as T from 'three';
import { BALL_RADIUS, MAX_PULL, shotFromPull } from './courses';

/** Inverse of the scene lens: picking must follow the visible, curved image. */
export function golfPointerRay(camera: T.Camera, x: number, y: number, width: number, height: number, lensRadius: number | null) {
  const raycaster = new T.Raycaster();
  if (lensRadius === null) {
    raycaster.setFromCamera(new T.Vector2(x / width * 2 - 1, 1 - y / height * 2), camera);
  } else {
    const nx = (x - width / 2) / lensRadius, ny = (height / 2 - y) / lensRadius;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld);
    raycaster.ray.direction.set(2 * nx * nz, 2 * ny * nz, 1 - 2 * nz * nz).applyQuaternion(camera.quaternion).normalize();
  }
  return raycaster.ray;
}

export function hitsGolfBob(ray: T.Ray, position: T.Vector3) {
  return ray.intersectsSphere(new T.Sphere(position, BALL_RADIUS));
}

/** Freeze the camera basis at grab time; screen-down always pulls back. */
export function golfDragBasis(camera: T.Camera) {
  const right = new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  right.y = 0; right.normalize();
  const forward = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), right);
  return { right, forward };
}

export function golfShotFromDrag(dx: number, dy: number, right: T.Vector3, forward: T.Vector3, maxPixels: number) {
  // A small dead zone lets a click or a returned drag cancel without a stroke.
  const length = Math.hypot(dx, dy);
  const scale = length > 6 ? MAX_PULL * Math.min(1, (length - 6) / maxPixels) / length : 0;
  return shotFromPull((-right.x * dx + forward.x * dy) * scale, (-right.z * dx + forward.z * dy) * scale);
}
