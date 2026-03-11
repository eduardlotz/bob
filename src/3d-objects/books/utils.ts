import { Book, CAMERA_VIEWS, useViewStore } from "@/store";
import CameraControlsImpl from "camera-controls";
import * as THREE from "three";
import { BOOK_GROUP_REF, STACKS } from ".";
import { BOOK_D } from "./singleBook";

// ─────────────────────────────────────────────────────────────────────────────
// Colour helpers
// ─────────────────────────────────────────────────────────────────────────────

export function lighten(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.min(255, ((n >> 16) & 255) + a)},${Math.min(255, ((n >> 8) & 255) + a)},${Math.min(255, (n & 255) + a)})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Book cover painting
// ─────────────────────────────────────────────────────────────────────────────

export function paintCover(
  ctx: CanvasRenderingContext2D,
  b: Book,
  W: number,
  H: number,
) {
  const bg = b.fallbackBackgroundColor;
  const fg = b.fallbackTextColor;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = fg;
  ctx.fillRect(0, H * 0.38, W * 0.48, H * 0.62);

  ctx.strokeStyle = fg;
  ctx.lineWidth = Math.max(2, W * 0.018);
  ctx.strokeRect(W * 0.38, H * 0.27, W * 0.58, H * 0.7);

  const titleFS = Math.floor(W * 0.17);
  ctx.font = `bold ${titleFS}px sans-serif`;
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  const words = b.title.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > W * 0.7 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = t;
    }
  }
  if (cur) lines.push(cur);
  lines.forEach((l, i) =>
    ctx.fillText(l, W * 0.06, H * 0.1 + titleFS + i * (titleFS * 1.15)),
  );

  const authorFS = Math.floor(W * 0.1);
  ctx.font = `bold ${authorFS}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = fg;
  b.author
    .split(" ")
    .forEach((part, i) =>
      ctx.fillText(
        part.toUpperCase(),
        W * 0.96,
        H * 0.88 + i * (authorFS * 1.2),
      ),
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Texture / material caches
// ─────────────────────────────────────────────────────────────────────────────

const coverCache = new Map<number, THREE.CanvasTexture>();

export function getCoverTex(b: Book): THREE.CanvasTexture {
  if (!coverCache.has(b.id)) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 192;
    paintCover(canvas.getContext("2d")!, b, 128, 192);
    const tex = new THREE.CanvasTexture(canvas);
    coverCache.set(b.id, tex);

    if (b.isbn) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, 128, 192);
        ctx.drawImage(img, 0, 0, 128, 192);
        tex.needsUpdate = true;
      };
      img.src = `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg`;
    }
  }
  return coverCache.get(b.id)!;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function getSolid(hex: string, opacity = 1): THREE.MeshStandardMaterial {
  const k = `${hex}_${opacity.toFixed(2)}`;
  if (!matCache.has(k)) {
    matCache.set(
      k,
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.82,
        metalness: 0,
        transparent: opacity < 1,
        opacity,
      }),
    );
  }
  return matCache.get(k)!;
}

const PAGE_MAT = new THREE.MeshStandardMaterial({
  color: "#f5f0e8",
  roughness: 0.9,
  metalness: 0,
});

export function makeMats(
  b: Book,
  showCover: boolean,
  opacity = 1,
): THREE.Material | THREE.Material[] {
  const spine = getSolid(b.fallbackBackgroundColor, opacity);
  const back = getSolid(b.fallbackBackgroundColor, opacity);
  const pages = opacity < 1 ? getSolid("#f5f0e8", opacity) : PAGE_MAT;

  if (!showCover) {
    return [pages, spine, spine, back, pages, pages];
  }

  const coverMat = new THREE.MeshStandardMaterial({
    map: getCoverTex(b),
    roughness: 0.65,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
  });

  return [pages, spine, coverMat, back, pages, pages];
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera — focus on a stack
//
// Uses a fixed world-space offset from the target (above + slightly toward
// viewer) rather than a stack-rotation-relative offset.  This means:
//
//   • Camera only travels the small XZ delta between stacks → no big swings
//   • View angle is always consistent (slight top-down from front)
//   • Neighbouring stacks stay clearly below the camera → no clipping
// ─────────────────────────────────────────────────────────────────────────────

// Fixed offset in world space from the look-at target.
// Y = above the target, Z = toward the viewer (camera-controls default is -Z forward)
const FOCUS_CAM_OFFSET = new THREE.Vector3(0, 0.38, 0.42);

function getCameraControls() {
  return useViewStore.getState().cameraControlsRef?.current as
    | InstanceType<typeof CameraControlsImpl>
    | null
    | undefined;
}

export function _moveCameraToStack(idx: number) {
  const controls = getCameraControls();
  if (!controls || !BOOK_GROUP_REF.current) return;

  const stack = STACKS[idx];
  if (!stack) return;

  BOOK_GROUP_REF.current.updateWorldMatrix(true, false);

  // Target = mid-height of the stack, in world space
  const stackMidY = BOOK_D * stack.books.length * 2;
  const targetLocal = new THREE.Vector3(stack.def.x, stackMidY, stack.def.z);
  const targetWorld = BOOK_GROUP_REF.current.localToWorld(targetLocal.clone());

  // Camera = target + fixed world-space offset (no rotation applied)
  const camWorld = targetWorld.clone().add(FOCUS_CAM_OFFSET);

  controls.setLookAt(
    camWorld.x,
    camWorld.y,
    camWorld.z,
    targetWorld.x,
    targetWorld.y,
    targetWorld.z,
    true, // animated
  );
}

export function _restoreDeskCamera() {
  const controls = getCameraControls();
  if (!controls) return;
  const d = CAMERA_VIEWS.bookshelf;
  if (d.position && d.target) {
    controls.setLookAt(...d.position, ...d.target, true);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera control modes
//
//  BROWSE  (desk view)
//    Left-drag / touch-one  → TRUCK (pan XZ)
//    Wheel / pinch          → ZOOM  (inspect stacks from above)
//    Right-drag             → TRUCK
//
//  FOCUSED (book is lifted)
//    All inputs disabled — pointer is owned by the book interaction.
//
//  DEFAULT (any other route / view)
//    Full controls restored so nothing bleeds into other parts of the app.
// ─────────────────────────────────────────────────────────────────────────────

/** Call when entering the bookshelf view. Pan + zoom only, no orbit. */
export function _setBrowseControls() {
  useViewStore.setState({ viewMode: "fixed" });
  const controls = getCameraControls();
  if (!controls) return;
  controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.ZOOM;
  controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
  controls.touches.two = CameraControlsImpl.ACTION.TOUCH_ZOOM_TRUCK;
}

/** Call when a book becomes focused. All camera input disabled. */
export function _setFocusedControls() {
  useViewStore.setState({ viewMode: "fixed" });
  const controls = getCameraControls();
  if (!controls) return;
  controls.mouseButtons.left = CameraControlsImpl.ACTION.NONE;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
  controls.touches.one = CameraControlsImpl.ACTION.NONE;
  controls.touches.two = CameraControlsImpl.ACTION.NONE;
}

/**
 * Call when LEAVING the bookshelf view entirely.
 * Restores full orbit + zoom so other routes / scenes work correctly.
 * Without this, the truck-only or no-input overrides from the bookshelf
 * bleed into every other camera-controlled view in the app.
 */
export function _restoreFullControls() {
  const controls = getCameraControls();
  if (!controls) return;
  controls.mouseButtons.left = CameraControlsImpl.ACTION.ROTATE;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.ZOOM;
  controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
  controls.touches.two = CameraControlsImpl.ACTION.TOUCH_ZOOM_TRUCK;
}
