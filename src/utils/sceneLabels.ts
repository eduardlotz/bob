import { Vector3, type Camera, type Object3D } from "three";
import { useCoreStore } from "@/store/core/store";
import { useBobEditor } from "@/store/bobEditor";
import { getSceneLensRadius } from "./sceneLensFraming";

/** Inverse of the picking ray: DOM labels share the visible lens projection. */
export function projectSceneLabel(point: Vector3, camera: Camera, width: number, height: number, fisheye: boolean, offset = { x: 0, y: 0 }) {
  if (!fisheye) {
    point.project(camera);
    return [(point.x + 1) * width / 2, (1 - point.y) * height / 2];
  }
  point.applyMatrix4(camera.matrixWorldInverse).normalize();
  const nz = Math.sqrt(Math.max(0.000001, (1 - point.z) / 2));
  const radius = getSceneLensRadius(width, height, offset);
  return [width / 2 + point.x / (2 * nz) * radius - offset.x,
    height / 2 - point.y / (2 * nz) * radius - offset.y];
}

export function createSceneLabelPosition() {
  const point = new Vector3();
  return (object: Object3D, camera: Camera, size: { width: number; height: number }) => {
    point.setFromMatrixPosition(object.matrixWorld);
    return projectSceneLabel(point, camera, size.width, size.height,
      useCoreStore.getState().graphicPreferences.fisheyeEnabled,
      useBobEditor.getState().screenOffset);
  };
}
