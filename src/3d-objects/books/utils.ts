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
  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, W, H);

  // Left filled rectangle
  ctx.fillStyle = b.fg;
  ctx.fillRect(0, H * 0.38, W * 0.48, H * 0.62);

  // Right outlined rectangle
  ctx.strokeStyle = b.fg;
  ctx.lineWidth = Math.max(2, W * 0.018);
  ctx.strokeRect(W * 0.38, H * 0.27, W * 0.58, H * 0.7);

  // Title — large bold, top-left, word-wrapped
  const titleFS = Math.floor(W * 0.17);
  ctx.font = `bold ${titleFS}px sans-serif`;
  ctx.fillStyle = b.fg;
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

  // Author — bold, bottom-right
  const authorFS = Math.floor(W * 0.1);
  ctx.font = `bold ${authorFS}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = b.fg;
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
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 192;
    paintCover(cv.getContext("2d")!, b, 128, 192);
    coverCache.set(b.id, new THREE.CanvasTexture(cv));
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

export function makeMats(
  b: Book,
  showCover: boolean,
  opacity = 1,
): THREE.Material | THREE.Material[] {
  const spine = getSolid(b.bg, opacity);
  const back = getSolid(b.bg, opacity);
  const pages = getSolid("#f5f0e8", opacity);

  if (!showCover) return spine;

  const coverMat = new THREE.MeshStandardMaterial({
    map: getCoverTex(b),
    roughness: 0.65,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
  });

  // face order: [+X=pages, -X=spine, +Y=cover, -Y=back, +Z=top-pages, -Z=bottom-pages]
  return [pages, spine, coverMat, back, pages, pages];
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera helpers
// ─────────────────────────────────────────────────────────────────────────────

// How far above and behind a stack the camera positions itself.
// Y is raised to clear the tallest possible stack; Z pulls back enough to
// frame all books in the stack at a comfortable angle.
const CAM_Y_BASE = 0.5; // base height above stack origin
const CAM_Y_PER_BOOK = 0.015; // extra height per book in stack
const CAM_Z_BACK = 1; // pull-back distance along local -Z

function getCameraControls() {
  return useViewStore.getState().cameraControlsRef?.current as
    | InstanceType<typeof CameraControlsImpl>
    | null
    | undefined;
}

/**
 * Move the camera to frame a specific stack.
 * The look-target is the top of the stack so the camera tilts naturally
 * downward rather than shooting at the table surface.
 */
export function _moveCameraToStack(idx: number) {
  const controls = getCameraControls();
  if (!controls || !BOOK_GROUP_REF.current) return;

  const stack = STACKS[idx];
  if (!stack) return;

  BOOK_GROUP_REF.current.updateWorldMatrix(true, false);

  // Look-at target: mid-height of the stack in world space
  const stackTopY = BOOK_D * stack.books.length;
  const targetLocal = new THREE.Vector3(
    stack.def.x,
    stackTopY * 0.7,
    stack.def.z,
  );
  const targetWorld = BOOK_GROUP_REF.current.localToWorld(targetLocal.clone());

  // Camera position: above and behind the stack along its rotated Z axis.
  // We apply the stack's own rotY so "behind" means "away from the camera axis".
  const groupQuat = BOOK_GROUP_REF.current.getWorldQuaternion(
    new THREE.Quaternion(),
  );
  const stackQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, stack.def.rotY, 0),
  );
  const combinedQuat = groupQuat.multiply(stackQuat);

  const camY = CAM_Y_BASE + CAM_Y_PER_BOOK * stack.books.length;
  const camOffset = new THREE.Vector3(0, camY, CAM_Z_BACK).applyQuaternion(
    combinedQuat,
  );
  const camWorld = targetWorld.clone().add(camOffset);

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

/**
 * Restore the wide desk overview camera.
 */
export function _restoreDeskCamera() {
  const controls = getCameraControls();
  if (!controls) return;
  const d = CAMERA_VIEWS.bookshelf;
  if (d.position && d.target) {
    controls.setLookAt(...d.position, ...d.target, true);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera control mode helpers
//
// Three distinct modes:
//
//   BROWSE  — user is looking at the desk / stacks.
//             Left-drag and touch-one both orbit so they can inspect stacks.
//
//   FOCUSED — a book is lifted; orbit is disabled so pointer-drag rotates
//             the book instead of fighting the camera.
//
// (The old _setOrbitControls / _setFixedControls naming was inverted and
// conflated these two cases — "fixed" was used for browse entry which
// accidentally killed left-click orbiting on desktop.)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BROWSE mode — full orbit with mouse left-button and one-finger touch.
 * Call when entering the bookshelf view or dismissing a focused book.
 */
export function _setBrowseControls() {
  useViewStore.setState({ viewMode: "fixed" });
  const controls = getCameraControls();
  if (!controls) return;
  controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
  controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
  controls.touches.two = CameraControlsImpl.ACTION.TOUCH_TRUCK;
}

/**
 * FOCUSED mode — all camera interaction disabled.
 * Pointer events are consumed by the focused book mesh for drag-rotation.
 * Call when a book becomes focused.
 */
export function _setFocusedControls() {
  //   useViewStore.setState({ viewMode: "object" });
  useViewStore.setState({ viewMode: "fixed" });
  const controls = getCameraControls();
  if (!controls) return;
  controls.mouseButtons.left = CameraControlsImpl.ACTION.NONE;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
  controls.touches.one = CameraControlsImpl.ACTION.NONE;
  controls.touches.two = CameraControlsImpl.ACTION.NONE;
}
