import { PHOTO_CAMERA_ADJUSTMENT, PHOTO_CAMERA_POSE, PHOTO_VIEWFINDER } from "./camera";
import { getSceneLensRadius } from "@/utils/sceneLensFraming";

/** Compose below the photo's midpoint, then lift the camera and tilt down.
 * Account for the crop's position in the full-screen scene, in both projections.
 */
export function getPhotoCameraFraming(width: number, height: number, fisheye: boolean, bodyLift = 0) {
  const frame = PHOTO_VIEWFINDER;
  const previewHeight = Math.max(120, Math.min(frame.maxHeight, (width - frame.viewportPadding) / 0.75, height - frame.reservedHeight));
  const subjectY = height - frame.bottomInset - previewHeight * (1 - frame.subjectY);
  const radius = getSceneLensRadius(width, height);
  const verticalOffset = height / 2 - subjectY;
  const subjectAngle = fisheye
    ? 2 * Math.asin(Math.max(-0.95, Math.min(0.95, verticalOffset / radius)))
    : Math.atan2(verticalOffset, radius / 2);
  const [x, baseHeight, distance] = PHOTO_CAMERA_POSE.position;
  const cameraHeight = baseHeight + bodyLift + PHOTO_CAMERA_ADJUSTMENT.lift;
  const pitch = Math.atan2(-baseHeight, distance) - subjectAngle - PHOTO_CAMERA_ADJUSTMENT.tiltDown;
  return {
    position: [x, cameraHeight, distance] as [number, number, number],
    target: [0, cameraHeight + Math.tan(pitch) * distance, 0] as [number, number, number],
  };
}
