import { Book, CAMERA_VIEWS, useViewStore } from "@/store";
import CameraControlsImpl from "camera-controls";
import * as THREE from "three";
import { BOOK_GROUP_REF, STACKS } from ".";
import { BOOK_D } from "./singleBook";

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

  const marginX = W * 0.08;
  const panelTop = H * 0.06;
  const panelBot = H * 0.4;
  const panelW = W - marginX * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(marginX, panelTop, panelW, panelBot - panelTop);

  const barH = Math.max(4, H * 0.038);
  ctx.fillStyle = fg;
  ctx.fillRect(marginX, panelBot, panelW, barH);

  const pad = W * 0.06;
  const textX = marginX + pad;
  const maxW = panelW - pad * 2;
  // Available vertical space for title inside the panel (leave room for author)
  const maxTitleH = (panelBot - panelTop) * 0.65;

  // ── Auto-size title to fit ≤ 3 lines ─────────────────────────────────────
  const MAX_LINES = 3;
  const TITLE_MAX = Math.floor(W * 0.13);
  const TITLE_MIN = Math.floor(W * 0.07);

  let titleFS = TITLE_MAX;
  let titleLines: string[] = [];

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let fs = TITLE_MAX; fs >= TITLE_MIN; fs -= 2) {
    ctx.font = `${fs}px sans-serif`;
    const lines = wrapText(ctx, b.title, maxW);
    const lineH = fs * 1.25;
    if (lines.length <= MAX_LINES && lines.length * lineH <= maxTitleH) {
      titleFS = fs;
      titleLines = lines;
      break;
    }
    // Keep last attempt as fallback (TITLE_MIN)
    titleFS = fs;
    titleLines = lines.slice(0, MAX_LINES);
  }

  ctx.font = `${titleFS}px sans-serif`;
  ctx.fillStyle = "#1a1a1a";
  const lineH = titleFS * 1.25;
  titleLines.forEach((line, i) =>
    ctx.fillText(line, textX, panelTop + H * 0.05 + i * lineH),
  );

  // ── Author ────────────────────────────────────────────────────────────────
  const authorFS = Math.floor(W * 0.085);
  ctx.font = `${authorFS}px serif`;
  ctx.fillStyle = "#3a3a3a";
  const authorY =
    panelTop + H * 0.05 + titleLines.length * lineH + authorFS * 0.5;
  ctx.fillText(b.author, textX, authorY);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Cover texture ─────────────────────────────────────────────────────────────
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
        // OpenLibrary serves a tiny placeholder (~1×1) when no cover exists.
        // Keep the fallback canvas if the image is suspiciously small.
        if (img.naturalWidth < 50 || img.naturalHeight < 50) return;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, 128, 192);
        ctx.drawImage(img, 0, 0, 128, 192);
        tex.needsUpdate = true;
      };
      // onerror = network failure → fallback canvas stays, no action needed
      img.src = `https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`;
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

  const coverMat = new THREE.MeshBasicMaterial({
    map: getCoverTex(b),
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
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.DOLLY;
  controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
  controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY;
}

// utils.ts

export function enterBookshelfView() {
  const store = useViewStore.getState();
  const controls = getCameraControls();
  if (!controls) return;

  // Update store state without triggering applyViewModeToControls or reset()
  store.setCurrentView("bookshelf");

  // Set controls FIRST — on mobile any touch during the fly-in must already
  // be in truck mode, not orbit
  controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.TRUCK;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
  controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
  controls.touches.two = CameraControlsImpl.ACTION.TOUCH_TRUCK;

  // Single setLookAt — no competing calls
  const d = CAMERA_VIEWS.bookshelf;
  if (d.position && d.target) {
    controls.setLookAt(...d.position, ...d.target, true);
  }
}

export function enterFocusedBookView(stackIdx: number) {
  const controls = getCameraControls();
  if (!controls) return;

  // Disable all input first
  controls.mouseButtons.left = CameraControlsImpl.ACTION.NONE;
  controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
  controls.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
  controls.touches.one = CameraControlsImpl.ACTION.NONE;
  controls.touches.two = CameraControlsImpl.ACTION.NONE;

  // Then move — no input can interrupt
  _moveCameraToStack(stackIdx);
}
