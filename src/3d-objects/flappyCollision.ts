/** Original centre-plane pass check; rim contacts remain physical collisions. */
export function ringCrossing(
  x0: number, x1: number, y: number, z: number,
  radius: number, tube: number, birdRadius: number,
) {
  if (x0 <= 0 || x1 > 0) return null;
  // Restore the original whole-body check, including its small rim tolerance.
  const holeRadius = Math.max(0.1, radius - tube);
  const scoreRadius = Math.min(radius, holeRadius + 0.1);
  return Math.hypot(y, z) + birdRadius < scoreRadius ? "inside" : "outside";
}
