import type { BlobFormType } from "@/types/blobForms";
import type { BobScreenBounds, BobParameter } from "@/store/bobEditor";

export const BOB_CONTROL_MARGIN = 104;

/** Fixed viewport guides; no body bounds or live camera enter this calculation. */
export function getBobControlPosition(key: BobParameter, guide: BobScreenBounds, form: BlobFormType = "cuboid") {
  const { left, right, top, bottom } = guide;
  const centerX = (guide.left + guide.right) / 2;
  const centerY = (guide.top + guide.bottom) / 2;
  switch (key) {
    case "eggUpperRadius": return { left: right + BOB_CONTROL_MARGIN - 30, top: top - 160 };
    case "eggLowerRadius": return { left: left - 265, top: centerY - 20 };
    case "sphereRadius": return { left: right + BOB_CONTROL_MARGIN + 40 - 70, top: centerY - 150 };
    case "cubeHeight": return { left: right + BOB_CONTROL_MARGIN + 40 - 90, top: centerY - 150 };
    case "cubeWidth": if (form === "cube") return { left: right + BOB_CONTROL_MARGIN + 10, top: centerY - 150 };
      return { left: centerX - 160, top: bottom + BOB_CONTROL_MARGIN + 30 - 90 };
    case "cubeRadius": if (form === "cube") return { left: left - 202, top: centerY + 35 };
      return { left: left - 202, top: top - 125 };
    // Leave room for Width's handle even when it sits at the left endpoint.
    case "cubeDepth": return { left: Math.min(left - 300, centerX - 428), top: centerY - 25 };
  }
}
