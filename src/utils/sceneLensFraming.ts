import { FISHEYE_CONFIG } from "@/store/config/themes";

/** Keep the lens covering all four corners when an editor shifts its composition. */
export function getSceneLensRadius(width: number, height: number, offset = { x: 0, y: 0 }) {
  return Math.max(
    Math.hypot(width, height) * (0.5 + FISHEYE_CONFIG.MIN / 2),
    Math.hypot(width / 2 + Math.abs(offset.x), height / 2 + Math.abs(offset.y)) * 1.03,
  );
}
