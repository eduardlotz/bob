const PAYOUT_INTERVAL = 0.25;
const FLOAT_EPSILON = 1e-9;

/** Keep fractional earnings alive independently of the counter's visual lifetime. */
export function createAutoTapPayout() {
  let pending = 0;
  let elapsed = 0;

  return (delta: number, rate: number, paused: boolean): number => {
    if (paused || rate <= 0) return 0;
    pending += rate * delta;
    elapsed += delta;
    if (pending + FLOAT_EPSILON < 1 || elapsed < PAYOUT_INTERVAL) return 0;

    const steps = Math.floor(pending + FLOAT_EPSILON);
    pending -= steps;
    elapsed = 0;
    return steps;
  };
}
