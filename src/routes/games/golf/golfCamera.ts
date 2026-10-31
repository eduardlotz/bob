import type CameraControls from 'camera-controls';

/** The original close-up framing, shared by follow updates and shot resets. */
export function setGolfFollowView(controls: CameraControls,
  p: { x: number; y: number; z: number }, goal: readonly number[], direction: { x: number; z: number },
  width: number, rolling: boolean, transition = true) {
  const distance = width < 600 ? .43 : .27;
  const eyeHeight = distance * (rolling ? .5 : .4);
  const goalDistance = Math.hypot(goal[0] - p.x, goal[2] - p.z);
  const targetHeight = p.y + .015 + (goal[1] - p.y) * Math.min(.2, .75 / Math.max(1, goalDistance));
  controls.setFocalOffset(0, 0, 0, false);
  controls.setLookAt(p.x - direction.x * distance, p.y + eyeHeight, p.z - direction.z * distance,
    p.x + direction.x * .75, targetHeight, p.z + direction.z * .75, transition);
}
