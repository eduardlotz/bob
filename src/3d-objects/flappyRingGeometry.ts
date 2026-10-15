type Position = [number, number, number];
const SEGMENTS = 12;
const DIRECTIONS = [-1, 1].flatMap((depth) =>
  Array.from({ length: SEGMENTS }, (_, index): Position => {
    const angle = (index / SEGMENTS) * Math.PI * 2;
    return [depth, Math.cos(angle), Math.sin(angle)];
  }),
);

/** Same circular rim contacts at every game size; visuals keep their own tube. */
export function getFlappyRingColliders(radius: number, tube: number, sizeFactor = 1) {
  const ballRadius = Math.max(0.06, tube * 0.75) * sizeFactor;
  const depth = Math.max(0.03, tube * 0.6) * sizeFactor;
  const ringRadius = Math.max(0.12, radius - tube * 0.15) * sizeFactor;
  return {
    radius: ballRadius,
    positions: DIRECTIONS.map(([side, y, z]): Position => [side * depth, y * ringRadius, z * ringRadius]),
  };
}
