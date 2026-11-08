import { FLOOR_Y_POSITION } from "./scene";

type Point = [number, number, number];
export const ABOUT_ROOM = {
  floorY: FLOOR_Y_POSITION - 0.55,
  width: 10.4,
  depth: 9.6,
  height: 5.8,
  wall: "#8c947b",
  stripe: "#7f886f",
  ceiling: "#ddd2af",
  walnut: "#c89a74",
};

export const ABOUT_CORNERS = {
  music: { position: [-3.45, ABOUT_ROOM.floorY, 1] as Point, yaw: 0.18 },
  green: { position: [2.85, ABOUT_ROOM.floorY, -4.35] as Point, yaw: -0.14 },
  socials: { position: [-2.55, ABOUT_ROOM.floorY, -4.45] as Point, yaw: 0 },
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
