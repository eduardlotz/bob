import { FLOOR_Y_POSITION } from "./scene";

type Point = [number, number, number];
export const ABOUT_ROOM = {
  floorY: FLOOR_Y_POSITION - 0.55,
  width: 10.4,
  depth: 9.6,
  height: 6.38,
  wall: "#8c947b",
  stripe: "#7f886f",
  ceiling: "#ddd2af",
  walnut: "#291f17",
};

export const ABOUT_CORNERS = {
  music: { position: [-3.45, ABOUT_ROOM.floorY, 1] as Point, yaw: 0.18 },
  green: { position: [2.85, ABOUT_ROOM.floorY, -4.35] as Point, yaw: -0.14 },
  socials: { position: [-2.295, ABOUT_ROOM.floorY, -4.45] as Point, yaw: 0 },
};

/** Camera and model placement share the same transform, including the inward angle. */
export function aboutCornerPose(corner: keyof typeof ABOUT_CORNERS, position: Point, target: Point) {
  const { position: origin, yaw } = ABOUT_CORNERS[corner];
  const world = ([x, y, z]: Point): Point => [
    origin[0] + x * Math.cos(yaw) + z * Math.sin(yaw),
    origin[1] + y,
    origin[2] - x * Math.sin(yaw) + z * Math.cos(yaw),
  ];
  return { position: world(position), target: world(target) };
}

export const ABOUT_CORNER_ORBIT = {
  minDistance: 0.65, maxDistance: 6, defaultDistance: 2.8,
  minPolarAngle: 0.35, maxPolarAngle: 1.9,
};

export const ABOUT_LOUNGE = {
  chair: [4.02, ABOUT_ROOM.floorY, 3.62] as Point,
  lamp: [4.62, ABOUT_ROOM.floorY, 2.0] as Point,
  table: [4.68, ABOUT_ROOM.floorY, 2.68] as Point,
  yaw: Math.atan2(4.02, 3.62),
};

export const ABOUT_PHOTO_SCALE = 1.10;
export const ABOUT_VINYL_SHELF_Y = 2.1;
export const ABOUT_MUSIC_WALL_OFFSET = -0.38;
export const ABOUT_MUSIC_BACK_OFFSET = -1;

export const ABOUT_PHOTO_POSITIONS: Point[] = Array.from({ length: 4 }, (_, index) => [
  ABOUT_CORNERS.socials.position[0] + (index - 1.5) * .9,
  ABOUT_ROOM.floorY + ABOUT_VINYL_SHELF_Y + .045 + .264 * Math.cos(.13),
  -4.43,
]);
export const ABOUT_PHOTO_ROTATIONS: Point[] = Array.from({ length: 4 }, (_, index) => [-.13, (index - 1.5) * -.04, 0]);
export const ABOUT_CIGARETTE_SMOKE_OFFSET: Point = [-.0535, .7525, -.015];

export function aboutSocialPosterPose(index: number, relativeToFrontWall = false) {
  const front = index >= 3;
  return {
    position: (front
      ? [3.65, (relativeToFrontWall ? 0 : ABOUT_ROOM.floorY) + 4.2 - (index - 3) * 1.1, relativeToFrontWall ? -.103 : 4.697]
      : [5.197, ABOUT_ROOM.floorY + 4.2 - index * 1.1, 3.15]) as Point,
    rotation: [0, front ? Math.PI : -Math.PI / 2, 0] as Point,
  };
}

export const ABOUT_WINDOW = {
  openAngle: Math.PI / 15,
  fixedCenter: [5.1, 3.05, -1.3225] as Point,
  hinge: [5.1, 1.6, .3225] as Point,
  glassSize: [1.375, 2.78] as [number, number],
};
