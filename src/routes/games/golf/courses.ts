export const TILE_SIZE = 1.35;
export const COURSE_Y = -1.3;
export const TURF_HEIGHT = 0.063327 * TILE_SIZE;
export const BALL_RADIUS = 0.055;
export const MAX_SHOT_SPEED = 7;
export const MAX_PULL = 1.8;
export const MIN_SHOT_POWER = .01;

export type GolfAsset = 'end' | 'straight' | 'open' | 'hole-round' | 'corner' |
  'ramp-low' | 'ramp-medium' | 'ramp' | 'bump-walls' | 'obstacle-block' |
  'narrow-square' | 'windmill' | 'castle' | 'flag-red';
export type Tile = { asset: GolfAsset; x: number; z: number; height?: number; turn?: number; rough?: boolean };
export type Pond = { x: number; z: number; width: number; depth: number };
export type Course = { name: [string, string]; par: number; tiles: Tile[]; ponds: Pond[] };
const t = (asset: GolfAsset, x: number, z: number, height = 0, turn = 0, rough = false): Tile => ({ asset, x, z, height, turn, rough });
const lane = (...assets: GolfAsset[]) => assets.map((asset, i) => t(asset, 0, -i, 0, asset === 'hole-round' ? 2 : 0));
const pond = (x: number, z: number, width = 3.2, depth = 1.6): Pond => ({ x, z, width, depth });

/** Coordinates use the pack's one-unit tile grid; height remains in model units. */
export const GOLF_COURSES: Course[] = [
  { name: ['Der erste Putt', 'First putt'], par: 2, tiles: lane('end', 'straight', 'straight', 'hole-round'), ponds: [] },
  { name: ['Sanfte Welle', 'Gentle rise'], par: 3, tiles: [t('end', 0, 0), t('ramp-low', 0, -1, 0, 2), t('straight', 0, -2, .1), t('hole-round', 0, -3, .1, 2)], ponds: [] },
  { name: ['Um die Ecke', 'Around the bend'], par: 3, tiles: [t('end', 0, 0), t('obstacle-block', 0, -1), t('corner', 0, -2, 0, 2), t('straight', 1, -2, 0, 1), t('hole-round', 2, -2, 0, 1)], ponds: [] },
  { name: ['Durchs Nadelöhr', 'Thread the needle'], par: 3, tiles: lane('end', 'bump-walls', 'narrow-square', 'straight', 'hole-round'), ponds: [] },
  { name: ['Die Gartenmühle', 'Garden mill'], par: 4, tiles: lane('end', 'straight', 'windmill', 'straight', 'hole-round'), ponds: [] },
  { name: ['Über den Teich', 'Across the pond'], par: 4, tiles: [t('end', 0, 0), t('ramp-medium', 0, -1, 0, 2), t('open', 0, -2, .25), t('straight', 0, -3, .25), t('hole-round', 0, -4, .25, 2)], ponds: [pond(0, -2, 3.8, 1.5)] },
  { name: ['Wiese und Wasser', 'Rough and water'], par: 4, tiles: [t('end', 0, 0), t('open', 0, -1, 0, 0, true), t('open', 0, -2, 0, 0, true), t('corner', 0, -3, 0, 2), t('narrow-square', 1, -3, 0, 1), t('hole-round', 2, -3, 0, 1)], ponds: [pond(-1.15, -1.6, 1.2, 3.1), pond(1.15, -1.6, 1.2, 3.1)] },
  { name: ['Der Wassersprung', 'Water jump'], par: 4, tiles: [t('end', 0, 0), t('straight', 0, -1), t('ramp', 0, -2, 0, 2), t('open', 0, -3.5, .15), t('straight', 0, -4.5, .15), t('hole-round', 0, -5.5, .15, 2)], ponds: [pond(0, -2.9, 3.4, 1.1)] },
  { name: ['Zur Burg', 'Castle climb'], par: 5, tiles: [t('end', 0, 0), t('ramp-medium', 0, -1, 0, 2), t('castle', 0, -2, .25), t('corner', 0, -3, .25, 2), t('obstacle-block', 1, -3, .25, 1), t('ramp-low', 2, -3, .25, 1), t('hole-round', 3, -3, .35, 1)], ponds: [pond(1.7, -3, 3, 2.4)] },
  { name: ['Das Gartenfinale', 'Garden finale'], par: 6, tiles: [t('end', 0, 0), t('ramp-medium', 0, -1, 0, 2), t('windmill', 0, -2, .25), t('corner', 0, -3, .25, 2), t('narrow-square', 1, -3, .25, 1), t('corner', 2, -3, .25), t('ramp', 2, -4, .25, 2), t('open', 2, -5.5, .4, 0, true), t('castle', 2, -6.5, .4), t('hole-round', 2, -7.5, .4, 2)], ponds: [pond(2, -4.9, 3.6, 1.1)] },
];
export const GOLF_ASSETS: GolfAsset[] = Array.from(new Set<GolfAsset>([
  ...GOLF_COURSES.flatMap(c => c.tiles.map(tile => tile.asset)), 'flag-red',
]));
export const tilePosition = (tile: Tile): [number, number, number] => [tile.x * TILE_SIZE, COURSE_Y + (tile.height ?? 0) * TILE_SIZE, tile.z * TILE_SIZE];
export function goalPosition(course: Course): [number, number, number] {
  const tile = course.tiles[course.tiles.length - 1];
  const [x, y, z] = tilePosition(tile);
  return [x, y + TURF_HEIGHT, z];
}
export function shotFromPull(dx: number, dz: number) {
  const distance = Math.hypot(dx, dz);
  const power = Math.min(1, distance / MAX_PULL);
  // Extra travel at the low end makes close putts controllable without losing ramp power.
  const speed = (.15 * power + .85 * power * power) * MAX_SHOT_SPEED;
  return { power, x: distance ? dx / distance * speed : 0, z: distance ? dz / distance * speed : 0 };
}
/** Only capture a slow, low ball; a fast putt can lip out or fly over the cup. */
export function canSink(position: { x: number; y: number; z: number }, speed: number, goal: readonly number[]) {
  return Math.hypot(position.x - goal[0], position.z - goal[2]) < .095 && position.y < goal[1] + BALL_RADIUS + .035 && position.y > goal[1] - .25 && speed < 1.5;
}
export function isRough(course: Course, x: number, z: number) {
  return course.tiles.some(t => t.rough && Math.abs(x / TILE_SIZE - t.x) < .44 && Math.abs(z / TILE_SIZE - t.z) < .44);
}

export type BallPosition = { x: number; y: number; z: number };
export function isOutsideCourse(course: Course, position: BallPosition) {
  const halfTile = TILE_SIZE / 2 + BALL_RADIUS * .25;
  return !course.tiles.some(tile => Math.abs(position.x - tile.x * TILE_SIZE) <= halfTile && Math.abs(position.z - tile.z * TILE_SIZE) <= halfTile);
}
/** Airborne ramp shots may cross gaps; a low or stranded ball outside must return. */
export function ballNeedsReset(course: Course, position: BallPosition, lastShot: BallPosition, verticalSpeed: number, stopped: boolean) {
  if (position.y < COURSE_Y - .3) return true;
  const water = course.ponds.some(pond => Math.abs(position.x / TILE_SIZE - pond.x) < pond.width / 2 && Math.abs(position.z / TILE_SIZE - pond.z) < pond.depth / 2 && position.y < COURSE_Y - .03);
  return water || (isOutsideCourse(course, position) && (stopped || (position.y <= lastShot.y + .03 && verticalSpeed <= .01)));
}
