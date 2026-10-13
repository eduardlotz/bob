/** Rim contact belongs to Rapier. Only bypassing the ring ends the round. */
export function ringCrossing(x0: number, y0: number, x1: number, y1: number, radius: number) {
  if (x0 <= 0 || x1 > 0) return null;
  const fraction = x0 / (x0 - x1);
  const y = y0 + (y1 - y0) * fraction;
  // Use Bob's centre to distinguish the inner and outer side of the solid rim.
  // Requiring his whole sphere to fit here would turn allowed touches into losses.
  return Math.abs(y) <= radius + 1e-6 ? "inside" : "outside";
}
