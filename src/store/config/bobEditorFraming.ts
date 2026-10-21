import type { BobParameter } from "@/types/bobControlValues";
import { getSceneLensRadius } from "@/utils/sceneLensFraming";

/** Viewport anchors are independent of Bob's geometry, idle motion and camera. */
export function getBobEditorGuide(width: number, height: number) {
  const half = Math.hypot(width, height) * 0.052;
  const centerX = width / 2;
  // Reserve the phone panel and the full Width caption, once per viewport.
  const centerY = Math.min(height * 0.4 + 6, height - 408 - half);
  return { left: centerX - half, right: centerX + half, top: centerY - half, bottom: centerY + half };
}

/** Keep the default front view independent of the currently selected tool. */
export function getBobEditorFraming(width: number, height: number, mobile: boolean, fisheye: boolean, tool: BobParameter | null = null, halfSize: [number, number, number] = [1, 1, 1]) {
  const landscape = width > height && height <= 600;
  const guide = getBobEditorGuide(width, height);
  const previewY = mobile ? landscape ? Math.max(50, (height - 196) / 2) : height * (height <= 700 ? 0.33 : 0.45) : (guide.top + guide.bottom) / 2 - 6;
  const offset = { x: mobile && landscape ? width * 0.25 : 0, y: height / 2 - previewY };
  const scale = fisheye ? getSceneLensRadius(width, height, offset) / getSceneLensRadius(width, height) : 1;
  const verticalCapacity = mobile ? landscape ? 1 : 2 : Math.max(0.9, height * 0.0018);
  const bodyScale = Math.max(1, halfSize[0] / 2, halfSize[1] / verticalCapacity, halfSize[2] / 2);
  const distance = (mobile ? landscape ? 8 : height <= 700 ? 6.5 : 4.8 : 5.8) * scale * bodyScale;
  const quarter = tool === "cubeDepth" || tool === "cubeRadius";
  const angle = quarter ? Math.PI / 4 : 0;
  const radius = distance * (quarter ? 0.94 : 1);
  const targetY = mobile && landscape ? Math.max(0, halfSize[1] - 1) * 1.2 : 0;
  return {
    offset,
    position: [Math.sin(angle) * radius, targetY + (tool ? radius * (quarter ? 0.28 : 0.025) : mobile ? radius * 0.085 : 0.65), Math.cos(angle) * radius] as [number, number, number],
    target: [0, targetY, 0] as [number, number, number],
  };
}
