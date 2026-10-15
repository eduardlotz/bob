import { getBlobFormHalfSize, type BlobFormParameters, type BlobFormType } from "@/types/blobForms";

type Point = { x: number; y: number; z: number };
export const GAME_ORIGIN: Readonly<Point> = { x: 0, y: 0, z: 0 };

/** A unit Ball is the reference. Cubes use their largest half dimension. */
export function getGameSizeFactor(formType: BlobFormType, parameters: BlobFormParameters) {
  return Math.max(...getBlobFormHalfSize(formType, parameters));
}

export function scaleGameCoordinate(value: number, sizeFactor: number, origin = 0) {
  return origin + (value - origin) * sizeFactor;
}

/** Preserve normalized progress and velocity when Settings changes mid-round. */
export function resizeGameMotion(position: Point, velocity: Point, ratio: number, origin = GAME_ORIGIN) {
  return {
    position: {
      x: scaleGameCoordinate(position.x, ratio, origin.x),
      y: scaleGameCoordinate(position.y, ratio, origin.y),
      z: scaleGameCoordinate(position.z, ratio, origin.z),
    },
    velocity: { x: velocity.x * ratio, y: velocity.y * ratio, z: velocity.z * ratio },
  };
}

export function getGameBallPhysics(baseRadius: number, sizeFactor: number) {
  return {
    radius: baseRadius * sizeFactor,
    // Keep mass at its original value. Linear speed/gravity scale with length,
    // so contact force scales linearly too, keeping score thresholds meaningful.
    mass: (4 / 3) * Math.PI * baseRadius ** 3,
  };
}
