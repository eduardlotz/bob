import { FLOOR_Y_POSITION } from "./scene";
import { LIBRARY_FLOOR_Y } from "./library";

export type LibraryWorldTransform = ReturnType<typeof getLibraryWorldTransform>;

const scale = 2;
const world = {
  scale,
  position: [0, FLOOR_Y_POSITION - LIBRARY_FLOOR_Y * scale, -2] as [number, number, number],
};

/** The floor stays beneath Bob; the foreground extends past him toward the camera. */
export function getLibraryWorldTransform() {
  return world;
}

export function libraryWorldPoint(point: readonly number[], world: LibraryWorldTransform): [number, number, number] {
  return point.map((value, axis) => value * world.scale + world.position[axis]) as [number, number, number];
}
