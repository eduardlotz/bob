export type BobIdleAnimation = "spin" | "look" | "bounce" | "sleep";

export const BOB_IDLE_DURATIONS: Record<BobIdleAnimation, number> = {
  spin: 3000,
  look: 4200,
  bounce: 2400,
  sleep: 6000,
};

// Seconds, pitch, yaw, roll, vertical offset, vertical stretch.
type PoseKey = readonly [number, number, number, number, number, number];

const POSES: Record<BobIdleAnimation, readonly PoseKey[]> = {
  spin: [
    [0, 0, 0, 0, 0, 1],
    [0.4, 0.035, -0.24, 0.06, -0.035, 0.92],
    [0.6, -0.025, -0.24, 0.035, 0.06, 1.12],
    [1.45, -0.025, Math.PI * 2 + 0.1, -0.045, 0.06, 1.04],
    [1.65, 0.03, Math.PI * 2 + 0.1, -0.09, -0.035, 0.9],
    [1.9, -0.02, Math.PI * 2 - 0.045, 0.055, 0.045, 1.08],
    [2.2, 0.01, Math.PI * 2 + 0.02, -0.03, -0.01, 0.97],
    [2.55, 0, Math.PI * 2 - 0.008, 0.012, 0.01, 1.015],
    [3, 0, Math.PI * 2, 0, 0, 1],
  ],
  look: [
    [0, 0, 0, 0, 0, 1],
    [0.4, 0, 0, 0, 0, 1],
    [0.85, 0.06, -0.48, -0.05, 0, 1],
    [1.45, 0.06, -0.48, -0.05, 0, 1],
    [2.1, -0.06, 0.42, 0.12, 0, 1],
    [2.85, -0.06, 0.42, 0.12, 0, 1],
    [3.55, 0, -0.04, -0.02, 0, 1],
    [4.2, 0, 0, 0, 0, 1],
  ],
  bounce: [
    [0, 0, 0, 0, 0, 1],
    [0.3, 0.05, 0, 0, -0.08, 0.88],
    [0.48, -0.04, 0, -0.025, 0.18, 1.14],
    [0.76, -0.04, 0, -0.025, 0.38, 1.02],
    [1.02, 0.04, 0, 0.02, -0.06, 0.89],
    [1.2, -0.02, 0, 0.015, 0.14, 1.08],
    [1.4, -0.02, 0, 0.015, 0.18, 1.01],
    [1.62, 0.02, 0, -0.01, -0.025, 0.96],
    [1.85, 0, 0, 0, 0.02, 1.02],
    [2.4, 0, 0, 0, 0, 1],
  ],
  sleep: [
    [0, 0, 0, 0, 0, 1],
    [0.9, 0.16, 0.04, -0.16, -0.04, 0.98],
    [4.9, 0.16, 0.04, -0.16, -0.04, 0.98],
    [5.65, -0.025, 0, 0.025, 0.025, 1.025],
    [6, 0, 0, 0, 0, 1],
  ],
};

export const smoothIdleStep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

// Write into a reusable pose so idle motion does not allocate every frame.
export function sampleBobIdlePose(
  animation: BobIdleAnimation,
  seconds: number,
  pose: number[],
) {
  const keys = POSES[animation];
  let end = 1;
  while (end < keys.length - 1 && seconds > keys[end][0]) end++;
  const from = keys[end - 1];
  const to = keys[end];
  const blend = smoothIdleStep((seconds - from[0]) / (to[0] - from[0]));
  for (let axis = 1; axis < from.length; axis++) {
    pose[axis - 1] = from[axis] + (to[axis] - from[axis]) * blend;
  }

  if (animation === "sleep") {
    const asleep = smoothIdleStep(seconds / 0.9) *
      (1 - smoothIdleStep((seconds - 4.9) / 0.75));
    const breath = Math.sin((seconds - 0.9) * Math.PI * 1.25) * asleep;
    pose[3] += breath * 0.012;
    pose[4] += breath * 0.012;
  }
}
