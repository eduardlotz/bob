import { FISHEYE_CONFIG } from "@/store/config/themes";

/** Shared by the live lens and the offline skin thumbnail renderer. */
export const SCENE_LENS = { cubeResolution: 896, sphereSegments: 64 } as const;

/** Keep the lens covering all four corners when an editor shifts its composition. */
export function getSceneLensRadius(width: number, height: number, offset = { x: 0, y: 0 }) {
  return Math.max(
    Math.hypot(width, height) * (0.5 + FISHEYE_CONFIG.MIN / 2),
    Math.hypot(width / 2 + Math.abs(offset.x), height / 2 + Math.abs(offset.y)) * 1.03,
  );
}
