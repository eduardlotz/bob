/**
 * BookStacks.tsx — three-level book navigation
 *
 * root → stack → book
 *
 * Canvas export  : <BookStacks>
 * DOM export     : <BookPortalOverlay>  — mount OUTSIDE <Canvas>, always mounted
 */

import * as THREE from "three";
import CameraControlsImpl from "camera-controls";
import { create } from "zustand";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeEvent } from "@react-three/fiber";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import styled, { css } from "styled-components";
import {
  Book,
  BOOK_BY_ID,
  BOOKS,
  useBooksStore,
  useViewStore,
  CAMERA_VIEWS,
} from "@/store";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useAppStore } from "@/store";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";

// ═══════════════════════════════════════════════════════════════════════════
// ★  TUNE ZONE
// ═══════════════════════════════════════════════════════════════════════════

// Book mesh (metres)
const BOOK_W = 0.14; // spine width  X
const BOOK_D = 0.025; // thickness    Y (stacking axis when flat)
const BOOK_H = 0.2; // page height  Z

// Stack layout
const STACK_DEFS = [
  { x: -0.55, z: 0.0, rotY: 0.12, count: 4, label: "Stapel A" },
  { x: -0.25, z: 0.04, rotY: -0.08, count: 3, label: "Stapel B" },
  { x: 0.05, z: -0.02, rotY: 0.18, count: 5, label: "Stapel C" },
  { x: 0.38, z: 0.03, rotY: -0.14, count: 3, label: "Stapel D" },
  { x: 0.65, z: 0.0, rotY: 0.06, count: 4, label: "Stapel E" },
] as const;

// Per-book micro jitter
const MICRO_XZ = [
  [0, 0],
  [0.006, -0.004],
  [-0.005, 0.006],
  [0.008, -0.002],
  [-0.003, 0.007],
] as const;
const MICRO_ROT = [0, 0.04, -0.06, 0.03, -0.04] as const;

// Focused book physical animation
/** Scale of the book mesh when fully focused (1 = natural stack size) */
const FOCUS_SCALE = 1.4;
/** Distance in front of camera (metres) where the book floats */
const FOCUS_DIST = 0.42;
/** Lerp factor per frame for position / quaternion (higher = faster) */
const FOCUS_POS_LERP = 0.16;
/** Faster lerp when book is dismissing (scale → 0) */
const FOCUS_DISMISS_LERP = 0.22;

// Camera nudge when entering a stack view (group-local offset)
const STACK_CAM_OFFSET = new THREE.Vector3(0, 0.22, 0.44);

// Portal
const OVERLAY_ROOT_ID = "motion-root";
const PANEL_W = "340px";

// Tag colour palette (cycled)
const TAG_PAL = [
  { bg: "rgba(52,199,89,.13)", fg: "#1D7A38", bd: "rgba(52,199,89,.26)" },
  { bg: "rgba(175,82,222,.11)", fg: "#7B3FA8", bd: "rgba(175,82,222,.22)" },
  { bg: "rgba(255,204,0,.14)", fg: "#8C6C00", bd: "rgba(255,204,0,.28)" },
  { bg: "rgba(0,122,255,.11)", fg: "#0055B8", bd: "rgba(0,122,255,.22)" },
  { bg: "rgba(255,59,48,.09)", fg: "#B52B22", bd: "rgba(255,59,48,.18)" },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// Stacks data (module-level, immutable after boot)
// ═══════════════════════════════════════════════════════════════════════════

interface StackData {
  def: (typeof STACK_DEFS)[number];
  books: Book[];
  startIdx: number; // index into BOOKS[]
  stackIdx: number; // index into STACKS[]
}

const STACKS: StackData[] = (() => {
  let idx = 0;
  return STACK_DEFS.map((def, i) => {
    const s: StackData = {
      def,
      books: BOOKS.slice(idx, idx + def.count),
      startIdx: idx,
      stackIdx: i,
    };
    idx += def.count;
    return s;
  });
})();

// ═══════════════════════════════════════════════════════════════════════════
// Overlay navigation store
// ═══════════════════════════════════════════════════════════════════════════

type OverlayPage = "closed" | "root" | "stack";
// "book" is derived — whenever useBooksStore.focusedBook !== null

interface BookOverlayStore {
  page: OverlayPage;
  stackIdx: number;
  openRoot: () => void;
  openStack: (i: number) => void;
  closePanel: () => void; // × in root / stack → hide panel
  goToRoot: () => void; // × in book view  → show root (keep panel)
}

const useBookOverlay = create<BookOverlayStore>((set) => ({
  page: "closed",
  stackIdx: 0,

  openRoot: () => {
    useBooksStore.getState().clearFocus();
    set({ page: "root" });
  },

  openStack: (i) => {
    useBooksStore.getState().clearFocus();
    set({ page: "stack", stackIdx: i });
    _moveCameraToStack(i);
  },

  closePanel: () => {
    useBooksStore.getState().clearFocus();
    set({ page: "closed" });
  },

  goToRoot: () => {
    useBooksStore.getState().clearFocus();
    set({ page: "root" });
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Module-level refs (shared between Canvas and DOM components)
// ═══════════════════════════════════════════════════════════════════════════

/** The <group> wrapping all stacks — needed for world-space calculations */
const BOOK_GROUP_REF: { current: THREE.Group | null } = { current: null };

/** bookId → individual book mesh — captures exact world positions for lift-off animation */
const bookMeshRefs = new Map<number, THREE.Mesh>();

// ═══════════════════════════════════════════════════════════════════════════
// Camera helpers
// ═══════════════════════════════════════════════════════════════════════════

function _moveCameraToStack(idx: number) {
  const controls = useViewStore.getState().cameraControlsRef?.current as any;
  if (!controls || !BOOK_GROUP_REF.current) return;
  BOOK_GROUP_REF.current.updateWorldMatrix(true, false);
  const def = STACKS[idx].def;
  const sw = BOOK_GROUP_REF.current.localToWorld(
    new THREE.Vector3(def.x, 0.05, def.z),
  );
  const quat = BOOK_GROUP_REF.current.getWorldQuaternion(
    new THREE.Quaternion(),
  );
  const cw = STACK_CAM_OFFSET.clone().applyQuaternion(quat).add(sw);
  controls.setLookAt(cw.x, cw.y, cw.z, sw.x, sw.y, sw.z, true);
}

function _restoreDeskCamera() {
  const controls = useViewStore.getState().cameraControlsRef?.current as any;
  if (!controls) return;
  const d = CAMERA_VIEWS.desk;
  if (d.position && d.target)
    controls.setLookAt(...d.position, ...d.target, true);
}

function _setFixedControls() {
  useViewStore.setState({ viewMode: "fixed" });
  const controls = useViewStore.getState().cameraControlsRef?.current as any;
  if (controls) {
    controls.mouseButtons.left = CameraControlsImpl.ACTION.NONE;
    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
  }
}

function _setOrbitControls() {
  useViewStore.setState({ viewMode: "object" });
  const controls = useViewStore.getState().cameraControlsRef?.current as any;
  if (controls) {
    controls.mouseButtons.left = CameraControlsImpl.ACTION.ROTATE;
    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared geometry
// ═══════════════════════════════════════════════════════════════════════════

const BOOK_GEO = new THREE.BoxGeometry(BOOK_W, BOOK_D, BOOK_H);

// ═══════════════════════════════════════════════════════════════════════════
// Texture / material helpers
// ═══════════════════════════════════════════════════════════════════════════

function lighten(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.min(255, ((n >> 16) & 255) + a)},${Math.min(255, ((n >> 8) & 255) + a)},${Math.min(255, (n & 255) + a)})`;
}

function paintCover(
  ctx: CanvasRenderingContext2D,
  b: Book,
  W: number,
  H: number,
) {
  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, lighten(b.bg, 35));
  grd.addColorStop(1, b.bg);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.26, W * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = `${b.fg}25`;
  ctx.fill();
  ctx.strokeStyle = `${b.fg}40`;
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.beginPath();
  ctx.moveTo(14, H * 0.64);
  ctx.lineTo(W - 14, H * 0.64);
  ctx.strokeStyle = `${b.fg}50`;
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W - 14 - i * 8, 14, 2, 0, Math.PI * 2);
    ctx.fillStyle = i < b.rating ? `${b.fg}cc` : `${b.fg}22`;
    ctx.fill();
  }
  if (b.favorite) {
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = `${b.fg}bb`;
    ctx.textAlign = "left";
    ctx.fillText("♥", 10, 16);
  }

  const words = b.title.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length > 11 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  const fs = lines.length > 2 ? 16 : 20;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.textAlign = "left";
  lines.forEach((l, i) => ctx.fillText(l, 14, H * 0.68 + i * (fs + 4)));
  ctx.font = "12px sans-serif";
  ctx.fillStyle = `${b.fg}cc`;
  ctx.fillText(b.author, 14, H - 12);
}

const coverCache = new Map<number, THREE.CanvasTexture>();
function getCoverTex(b: Book): THREE.CanvasTexture {
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
function getSolid(hex: string, opacity = 1): THREE.MeshStandardMaterial {
  const k = `${hex}_${opacity.toFixed(2)}`;
  if (!matCache.has(k))
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
  return matCache.get(k)!;
}

/** BoxGeometry face order: [+X, -X, +Y(cover), -Y, +Z, -Z].  +Y = cover art when flat. */
function makeMats(
  b: Book,
  showCover: boolean,
  opacity = 1,
): THREE.Material | THREE.Material[] {
  const s = getSolid(b.bg, opacity);
  if (!showCover) return s;
  return [
    s,
    s,
    new THREE.MeshStandardMaterial({
      map: getCoverTex(b),
      roughness: 0.65,
      metalness: 0,
      transparent: opacity < 1,
      opacity,
    }),
    s,
    s,
    s,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CoverCanvas — DOM canvas, used inside the portal overlay
// ═══════════════════════════════════════════════════════════════════════════

const CoverCanvas = memo(
  ({ book, w, h }: { book: Book; w: number; h: number }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (ref.current) paintCover(ref.current.getContext("2d")!, book, w, h);
    }, [book.id, w, h]);
    return (
      <canvas
        ref={ref}
        width={w}
        height={h}
        style={{ borderRadius: 4, display: "block" }}
      />
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// FocusedBookMesh — THREE.js, lives INSIDE the BookStacks group
//
// When a book is focused:
//   • The original mesh in the stack becomes invisible (opacity 0 via hidden prop)
//   • This component renders the book starting at that mesh's world position
//   • Lerps position (world-space) toward FOCUS_DIST in front of camera
//   • Lerps scale from 1 → FOCUS_SCALE
//   • Lerps quaternion from flat-lying → upright, cover facing camera
//   • On dismiss: lerps scale back to 0 then unmounts
//
// Rotation derivation:
//   BoxGeometry(W,D,H): +Y face = cover art (lying flat).
//   Rx(-π/2) stands it up: +Y_local → -Z_local (cover faces -Z).
//   Ry(θ) where θ = atan2(camDir.x, camDir.z) rotates so -Z points toward camera.
//   → Three.js Euler('XYZ'): (-π/2, θ, 0) applies Rx first, then Ry in original frame. ✓
// ═══════════════════════════════════════════════════════════════════════════

// Pre-allocated temporaries to avoid GC pressure in useFrame
const _t = {
  invMat: new THREE.Matrix4(),
  pQuat: new THREE.Quaternion(),
  pScale: new THREE.Vector3(),
  pPos: new THREE.Vector3(),
  localPos: new THREE.Vector3(),
  localQuat: new THREE.Quaternion(),
  tQuat: new THREE.Quaternion(),
  camDir: new THREE.Vector3(),
  targetW: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, "XYZ"),
};

const FocusedBookMesh = ({
  groupRef,
}: {
  groupRef: RefObject<THREE.Group | null>;
}) => {
  const focusedBook = useBooksStore((s) => s.focusedBook);

  const [renderBook, setRenderBook] = useState<Book | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // World-space lerp state (initialised on focus)
  const curWorldPos = useRef(new THREE.Vector3());
  const curWorldQuat = useRef(new THREE.Quaternion());
  const curScale = useRef(0);
  const targetScale = useRef(0);
  const isDismissing = useRef(false);
  const active = useRef(false); // false until first focus

  useEffect(() => {
    if (focusedBook) {
      // Capture exact world-position of this book's mesh in the stack
      const src = bookMeshRefs.get(focusedBook.id);
      if (src) {
        src.getWorldPosition(curWorldPos.current);
        src.getWorldQuaternion(curWorldQuat.current);
      } else if (groupRef.current) {
        // Fallback: approximate stack position
        groupRef.current.updateWorldMatrix(true, false);
        const st = STACKS.find((s) =>
          s.books.some((b) => b.id === focusedBook.id),
        );
        if (st) {
          const idx = st.books.findIndex((b) => b.id === focusedBook.id);
          const [ox, oz] = MICRO_XZ[idx % MICRO_XZ.length];
          groupRef.current.localToWorld(
            curWorldPos.current.set(
              st.def.x + ox,
              BOOK_D * 0.5 + idx * BOOK_D,
              st.def.z + oz,
            ),
          );
        }
        curWorldQuat.current.identity();
      }

      // Start at natural scale (same as in the stack) so the lift-off is seamless
      curScale.current = 1;
      targetScale.current = FOCUS_SCALE;
      isDismissing.current = false;
      active.current = true;
      setRenderBook(focusedBook);
    } else {
      // Dismiss: scale back to 0
      isDismissing.current = true;
      targetScale.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBook?.id]);

  useFrame(({ camera }) => {
    if (!meshRef.current || !groupRef.current || !active.current) return;

    const lf = isDismissing.current ? FOCUS_DISMISS_LERP : FOCUS_POS_LERP;

    // ── Scale ─────────────────────────────────────────────────────────────
    curScale.current += (targetScale.current - curScale.current) * lf;

    // ── Target world position: FOCUS_DIST in front of camera ──────────────
    camera.getWorldDirection(_t.camDir);
    _t.targetW.copy(camera.position).addScaledVector(_t.camDir, FOCUS_DIST);

    // Lerp position only while approaching; on dismiss stay in place
    if (!isDismissing.current) {
      curWorldPos.current.lerp(_t.targetW, FOCUS_POS_LERP);

      // ── Target quaternion: upright book, cover facing camera ─────────────
      // θ = atan2(camDir.x, camDir.z)  →  Euler XYZ (-π/2, θ, 0)
      // Rx(-π/2) stands book up; Ry(θ) rotates cover (-Z_local) to face camera
      _t.euler.set(-Math.PI / 2, Math.atan2(_t.camDir.x, _t.camDir.z), 0);
      _t.tQuat.setFromEuler(_t.euler);
      curWorldQuat.current.slerp(_t.tQuat, FOCUS_POS_LERP * 1.8);
    }

    // ── Convert world pos/quat → group-local ──────────────────────────────
    groupRef.current.updateWorldMatrix(true, false);
    _t.invMat.copy(groupRef.current.matrixWorld).invert();
    _t.localPos.copy(curWorldPos.current).applyMatrix4(_t.invMat);

    // localQuat = inverse(parentQuat) * worldQuat
    groupRef.current.matrixWorld.decompose(_t.pPos, _t.pQuat, _t.pScale);
    _t.localQuat.copy(_t.pQuat).invert().multiply(curWorldQuat.current);

    meshRef.current.position.copy(_t.localPos);
    meshRef.current.quaternion.copy(_t.localQuat);
    meshRef.current.scale.setScalar(curScale.current);

    // Unmount after scale-out completes
    if (isDismissing.current && curScale.current < 0.008) {
      active.current = false;
      isDismissing.current = false;
      setRenderBook(null);
    }
  });

  const mats = useMemo(
    () => (renderBook ? makeMats(renderBook, true) : null),
    [renderBook?.id],
  );
  if (!renderBook || !mats) return null;

  return <mesh ref={meshRef} geometry={BOOK_GEO} material={mats} castShadow />;
};

// ═══════════════════════════════════════════════════════════════════════════
// SingleBook — individual book mesh in a stack
// • Registers itself in bookMeshRefs for world-position capture
// • Provides hover label (floating bar) when canInteract
// • Provides click-to-focus when canInteract
// • Hidden (opacity 0) when it is the currently focused book
// ═══════════════════════════════════════════════════════════════════════════

const SingleBook = memo(
  ({
    book,
    pos,
    rotY,
    isTop,
    booksIdx,
    hidden,
    canInteract,
  }: {
    book: Book;
    pos: [number, number, number];
    rotY: number;
    isTop: boolean;
    booksIdx: number;
    hidden: boolean;
    canInteract: boolean;
  }) => {
    const { setHoveredObject } = useFloatingBar();
    const setFocused = useBooksStore((s) => s.setFocused);

    const mats = useMemo(
      () => makeMats(book, isTop, hidden ? 0 : 1),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [book.id, isTop, hidden],
    );

    // Register mesh ref so FocusedBookMesh can capture world position
    const setRef = useCallback(
      (m: THREE.Mesh | null) => {
        if (m) bookMeshRefs.set(book.id, m);
        else bookMeshRefs.delete(book.id);
      },
      [book.id],
    );

    const onOver = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        if (!canInteract) return;
        e.stopPropagation();
        setHoveredObject({ title: book.title });
        document.body.style.cursor = "pointer";
      },
      [book.title, canInteract, setHoveredObject],
    );

    const onOut = useCallback(() => {
      setHoveredObject(null);
      document.body.style.cursor = "default";
    }, [setHoveredObject]);

    const onClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        if (!canInteract) return;
        e.stopPropagation();
        setFocused(booksIdx);
      },
      [booksIdx, canInteract, setFocused],
    );

    return (
      <mesh
        ref={setRef}
        geometry={BOOK_GEO}
        material={mats}
        position={pos}
        rotation={[0, rotY, 0]}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      />
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// BookStack — one pile of books
// Clicking the group (not a specific book) opens the stack in the overlay.
// Individual book clicks handled by SingleBook when canInteract.
// ═══════════════════════════════════════════════════════════════════════════

const BookStack = memo(
  ({
    stack,
    focusedBookId,
    overlayPage,
    activeStackIdx,
  }: {
    stack: StackData;
    focusedBookId: number | null;
    overlayPage: OverlayPage;
    activeStackIdx: number;
  }) => {
    const isThisStack = stack.stackIdx === activeStackIdx;
    const inStackMode = overlayPage === "stack" && isThisStack;
    // Individual book interaction only active in stack mode for this stack, no book focused
    const canInteract = inStackMode && focusedBookId === null;

    const onGroupClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        if (focusedBookId) return; // orbit mode — ignore stack clicks
        // If a SingleBook already stopPropagated (because canInteract), this won't fire
        e.stopPropagation();
        useBookOverlay.getState().openStack(stack.stackIdx);
      },
      [stack.stackIdx, focusedBookId],
    );

    return (
      <group
        position={[stack.def.x, 0, stack.def.z]}
        rotation={[0, stack.def.rotY, 0]}
        onClick={onGroupClick}
      >
        {stack.books.map((book, i) => {
          const [ox, oz] = MICRO_XZ[i % MICRO_XZ.length];
          return (
            <SingleBook
              key={book.id}
              book={book}
              pos={[ox, BOOK_D * 0.5 + i * BOOK_D, oz]}
              rotY={MICRO_ROT[i % MICRO_ROT.length]}
              isTop={i === stack.books.length - 1}
              booksIdx={stack.startIdx + i}
              hidden={book.id === focusedBookId}
              canInteract={canInteract}
            />
          );
        })}
      </group>
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// BookStacks — main Canvas export
//
//   <Canvas>
//     <BookStacks viewId="desk" position={[x,y,z]} rotation={[0,r,0]} />
//   </Canvas>
//   <BookPortalOverlay />   ← sibling to Canvas, ALWAYS mounted
// ═══════════════════════════════════════════════════════════════════════════

export function BookStacks({
  viewId,
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = [1, 1, 1] as [number, number, number],
}: {
  viewId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const currentView = useViewStore((s) => s.currentView);
  const focusedBook = useBooksStore((s) => s.focusedBook);
  const overlayPage = useBookOverlay((s) => s.page);
  const activeStackIdx = useBookOverlay((s) => s.stackIdx);
  const groupRef = useRef<THREE.Group>(null);

  // Sync module-level group ref every render
  useEffect(() => {
    BOOK_GROUP_REF.current = groupRef.current;
  });

  // ── View entry / exit ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentView !== viewId) {
      useBooksStore.getState().clearFocus();
      useBookOverlay.setState({ page: "closed" });
      return;
    }
    // Auto-open overlay to root when entering this view
    useBookOverlay.setState({ page: "root" });
    // Enforce fixed (non-orbit) camera mode
    _setFixedControls();
  }, [currentView, viewId]);

  // ── Focus state → switch camera mode ───────────────────────────────────
  useEffect(() => {
    if (!focusedBook) {
      // Restore fixed mode; if we're in a stack, re-centre on it
      _setFixedControls();
      const { page, stackIdx } = useBookOverlay.getState();
      if (page === "stack") _moveCameraToStack(stackIdx);
      else if (page === "root") _restoreDeskCamera();
      return;
    }
    // Book focused → orbit mode (user can drag to spin)
    _setOrbitControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBook?.id]);

  const focusedBookId = focusedBook?.id ?? null;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {STACKS.map((stack) => (
        <BookStack
          key={stack.stackIdx}
          stack={stack}
          focusedBookId={focusedBookId}
          overlayPage={overlayPage}
          activeStackIdx={activeStackIdx}
        />
      ))}
      {/* Physical book animation lives inside the group for correct transform inheritance */}
      <FocusedBookMesh groupRef={groupRef} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Overlay content sub-components
// Only the CONTENT div is animated (AnimatePresence).
// Header and footer are rendered statically by BookPortalOverlay.
// ═══════════════════════════════════════════════════════════════════════════

const SLIDE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.17 },
};

// ─── Root content — list of stacks ─────────────────────────────────────────

const RootContent = memo(() => (
  <motion.div
    {...SLIDE_VARIANTS}
    style={{
      flex: 1,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    }}
  >
    <PanelScroll>
      {STACKS.map((s) => (
        <StackListItem
          key={s.stackIdx}
          onClick={() => useBookOverlay.getState().openStack(s.stackIdx)}
        >
          <div
            style={{
              flexShrink: 0,
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,.13)",
            }}
          >
            <CoverCanvas book={s.books[s.books.length - 1]} w={36} h={54} />
          </div>
          <StackMeta>
            <span className="name">{s.def.label}</span>
            <span className="count">{s.books.length} Bücher</span>
          </StackMeta>
          <ChevronIcon>
            <ChevronRightIcon />
          </ChevronIcon>
        </StackListItem>
      ))}
    </PanelScroll>
  </motion.div>
));

// ─── Stack content — books in one stack ────────────────────────────────────

const StackContent = memo(({ stack }: { stack: StackData }) => (
  <motion.div
    {...SLIDE_VARIANTS}
    style={{
      flex: 1,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    }}
  >
    <PanelScroll>
      {stack.books.map((b, i) => (
        <BookListItem
          key={b.id}
          onClick={() =>
            useBooksStore.getState().setFocused(stack.startIdx + i)
          }
        >
          <div
            style={{
              flexShrink: 0,
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,.12)",
            }}
          >
            <CoverCanvas book={b} w={40} h={60} />
          </div>
          <BookItemMeta>
            <span className="title">{b.title}</span>
            <span className="author">{b.author}</span>
            <HeartsRow>
              {Array.from({ length: 5 }, (_, j) => (
                <Heart key={j} $on={j < b.rating}>
                  ♥
                </Heart>
              ))}
            </HeartsRow>
          </BookItemMeta>
          <ChevronIcon>
            <ChevronRightIcon />
          </ChevronIcon>
        </BookListItem>
      ))}
    </PanelScroll>
  </motion.div>
));

// ─── Book content — detail for focused book ─────────────────────────────────

const BookContent = memo(
  ({ book, stack }: { book: Book; stack: StackData }) => {
    const navigateToBookId = useBooksStore((s) => s.navigateToBookId);
    const tags: string[] = (book as any).tags ?? [];

    return (
      <motion.div
        {...SLIDE_VARIANTS}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <PanelScroll>
          {/* Hero row: cover + rating + title + author */}
          <HeroRow>
            <div
              style={{
                flexShrink: 0,
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 4px 18px rgba(0,0,0,.17)",
              }}
            >
              <CoverCanvas book={book} w={72} h={108} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <HeartsRow>
                {Array.from({ length: 5 }, (_, i) => (
                  <Heart key={i} $on={i < book.rating}>
                    ♥
                  </Heart>
                ))}
              </HeartsRow>
              <HeroTitle>{book.title}</HeroTitle>
              <HeroAuthor>{book.author}</HeroAuthor>
            </div>
          </HeroRow>

          {(tags.length > 0 || book.favorite) && (
            <>
              <Rule />
              <SectionLabel>Tags</SectionLabel>
              <TagsWrap>
                {tags.map((t, i) => {
                  const p = TAG_PAL[i % TAG_PAL.length];
                  return (
                    <TagPill key={t} $bg={p.bg} $fg={p.fg} $bd={p.bd}>
                      {t}
                    </TagPill>
                  );
                })}
                {book.favorite && (
                  <TagPill
                    $bg={TAG_PAL[4].bg}
                    $fg={TAG_PAL[4].fg}
                    $bd={TAG_PAL[4].bd}
                  >
                    ♥ Favorit
                  </TagPill>
                )}
              </TagsWrap>
            </>
          )}

          <Rule />
          <SectionLabel>Rezension</SectionLabel>
          <ReviewText>{book.review}</ReviewText>

          {book.related.length > 0 && (
            <>
              <Rule />
              <SectionLabel>Ähnliche Themen</SectionLabel>
              {book.related.map((rid) => {
                const rb = BOOK_BY_ID.get(rid);
                return rb ? (
                  <BookListItem key={rid} onClick={() => navigateToBookId(rid)}>
                    <div
                      style={{
                        flexShrink: 0,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <CoverCanvas book={rb} w={32} h={48} />
                    </div>
                    <BookItemMeta>
                      <span className="title">{rb.title}</span>
                      <span className="author">{rb.author}</span>
                    </BookItemMeta>
                  </BookListItem>
                ) : null;
              })}
            </>
          )}
        </PanelScroll>
      </motion.div>
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// BookPortalOverlay — DOM export, mount OUTSIDE <Canvas>
//
// Always mounted. AnimatePresence handles panel slide-in/out.
// Header and footer are STATIC — only the content area uses AnimatePresence.
// ═══════════════════════════════════════════════════════════════════════════

export const BookPortalOverlay = () => {
  const { isMobile } = useAppStore();
  const focusedBook = useBooksStore((s) => s.focusedBook);
  const focusedIdx = useBooksStore((s) => s.focusedIdx);
  const page = useBookOverlay((s) => s.page);
  const stackIdx = useBookOverlay((s) => s.stackIdx);

  // Effective view: "book" when a book is focused, else overlay store page
  const effectivePage: OverlayPage | "book" = focusedBook ? "book" : page;
  const isOpen = effectivePage !== "closed";
  const isBook = effectivePage === "book";
  const isStack = effectivePage === "stack";
  const isRoot = effectivePage === "root";

  const activeStack = STACKS[stackIdx] ?? STACKS[0];

  // ── Stack navigation (root & stack views) ────────────────────────────────
  const prevStack = useCallback(() => {
    const next = (stackIdx - 1 + STACKS.length) % STACKS.length;
    useBookOverlay.getState().openStack(next);
  }, [stackIdx]);

  const nextStack = useCallback(() => {
    const next = (stackIdx + 1) % STACKS.length;
    useBookOverlay.getState().openStack(next);
  }, [stackIdx]);

  // ── Book navigation within the active stack ───────────────────────────────
  const prevBook = useCallback(() => {
    if (focusedIdx === null) return;
    const pos = focusedIdx - activeStack.startIdx;
    const next =
      (pos - 1 + activeStack.books.length) % activeStack.books.length;
    useBooksStore.getState().setFocused(activeStack.startIdx + next);
  }, [focusedIdx, activeStack]);

  const nextBook = useCallback(() => {
    if (focusedIdx === null) return;
    const pos = focusedIdx - activeStack.startIdx;
    const next = (pos + 1) % activeStack.books.length;
    useBooksStore.getState().setFocused(activeStack.startIdx + next);
  }, [focusedIdx, activeStack]);

  // ── Footer dots ───────────────────────────────────────────────────────────
  const dotCount = isBook ? activeStack.books.length : STACKS.length;
  const activeDot = isBook
    ? focusedIdx !== null
      ? focusedIdx - activeStack.startIdx
      : 0
    : stackIdx;
  const onPrev = isBook ? prevBook : prevStack;
  const onNext = isBook ? nextBook : nextStack;

  // ── Header ────────────────────────────────────────────────────────────────
  // Back button: stack → "Bücher", book → stack label
  // Close button: root/stack → closePanel, book → goToRoot (keep panel)
  const showBack = isStack || isBook;
  const backLabel = isBook ? activeStack.def.label : "Bücher";
  const onBack = isBook
    ? () => useBooksStore.getState().clearFocus() // book → stays in stack view
    : () => useBookOverlay.getState().openRoot(); // stack → goes to root
  const onClose = isBook
    ? () => useBookOverlay.getState().goToRoot() // book × → root
    : () => useBookOverlay.getState().closePanel(); // root/stack × → close

  const root =
    typeof document !== "undefined"
      ? document.getElementById(OVERLAY_ROOT_ID)
      : null;

  const content = (
    <>
      {/* ── Panel (slides in once, stays for root/stack/book) ── */}
      <AnimatePresence>
        {isOpen && (
          <Panel
            key="panel"
            $mobile={isMobile}
            initial={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { x: 80, opacity: 0, filter: "blur(6px)" }
            }
            animate={
              isMobile
                ? { y: "0%", opacity: 1 }
                : { x: 0, opacity: 1, filter: "blur(0px)" }
            }
            exit={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { x: 80, opacity: 0, filter: "blur(6px)" }
            }
            transition={{ type: "spring", bounce: 0.2, duration: 0.42 }}
          >
            {/* ── Static header — no AnimatePresence ── */}
            <PanelHeader>
              {showBack ? (
                <BackBtn onClick={onBack}>
                  <ChevronLeftIcon />
                  <span>{backLabel}</span>
                </BackBtn>
              ) : (
                <HeaderTitle>Bücher</HeaderTitle>
              )}
              <CloseBtn onClick={onClose} aria-label="Schließen">
                ×
              </CloseBtn>
            </PanelHeader>

            {/* ── Animated content section only ── */}
            <AnimatePresence mode="wait" initial={false}>
              {isRoot && <RootContent key="root" />}
              {isStack && (
                <StackContent key={`stack-${stackIdx}`} stack={activeStack} />
              )}
              {isBook && focusedBook && (
                <BookContent
                  key={`book-${focusedBook.id}`}
                  book={focusedBook}
                  stack={activeStack}
                />
              )}
            </AnimatePresence>

            {/* ── Static footer — no AnimatePresence ── */}
            <PanelFooter>
              <FooterNav>
                <FooterBtn onClick={onPrev}>
                  <ChevronLeftIcon />
                </FooterBtn>
                <DotsRow>
                  {Array.from({ length: dotCount }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === activeDot ? "18px" : "6px",
                        opacity: i === activeDot ? 1 : 0.18,
                        background: i === activeDot ? "#111" : "#aaa",
                      }}
                      style={{ height: 6, borderRadius: 3 }}
                    />
                  ))}
                </DotsRow>
                <FooterBtn onClick={onNext}>
                  <ChevronRightIcon />
                </FooterBtn>
              </FooterNav>
            </PanelFooter>
          </Panel>
        )}
      </AnimatePresence>

      {/* ── Floating prev/next arrows — only in book view ── */}
      <AnimatePresence>
        {isBook && (
          <>
            <FloatArrow
              key="prev"
              $side="left"
              $mobile={isMobile}
              onClick={prevBook}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <ChevronLeftIcon />
            </FloatArrow>
            <FloatArrow
              key="next"
              $side="right"
              $mobile={isMobile}
              onClick={nextBook}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <ChevronRightIcon />
            </FloatArrow>
          </>
        )}
      </AnimatePresence>
    </>
  );

  if (!root) return null;
  return createPortal(content, root);
};

// ═══════════════════════════════════════════════════════════════════════════
// Styled components — iOS-style light panel
// ═══════════════════════════════════════════════════════════════════════════

const Panel = styled(motion.aside)<{ $mobile: boolean }>`
  position: fixed;
  z-index: 40;
  pointer-events: auto;
  background: rgba(248, 246, 241, 0.97);
  backdrop-filter: blur(30px) saturate(1.6);
  -webkit-backdrop-filter: blur(30px) saturate(1.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${({ $mobile }) =>
    $mobile
      ? css`
          left: 0;
          right: 0;
          bottom: 0;
          height: 72vh;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.22);
        `
      : css`
          top: 0;
          right: 0;
          bottom: 0;
          width: ${PANEL_W};
          max-width: 90vw;
          border-left: 1px solid rgba(0, 0, 0, 0.07);
          box-shadow: -10px 0 52px rgba(0, 0, 0, 0.13);
        `}
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 1px;
  background: none;
  border: none;
  color: #007aff;
  font-size: 0.96rem;
  cursor: pointer;
  padding: 0;
  svg {
    width: 16px;
    height: 16px;
    color: #007aff;
  }
`;

const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  font-size: 1.15rem;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.14);
  }
`;

const PanelScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
`;

const PanelFooter = styled.div`
  flex-shrink: 0;
  padding: 10px 16px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
`;

const FooterNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const FooterBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #444;
  transition: background 0.15s;
  svg {
    width: 14px;
    height: 14px;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.09);
  }
`;

const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
  max-width: 180px;
`;

// Stack list
const StackListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const StackMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  .name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #111;
  }
  .count {
    font-size: 0.75rem;
    color: #999;
  }
`;

const ChevronIcon = styled.div`
  svg {
    width: 14px;
    height: 14px;
    color: #ccc;
  }
`;

// Book list
const BookListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const BookItemMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  .title {
    font-size: 0.83rem;
    font-weight: 600;
    color: #222;
  }
  .author {
    font-size: 0.72rem;
    color: #999;
  }
`;

// Book detail
const HeroRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 4px;
`;
const HeartsRow = styled.div`
  display: flex;
  gap: 3px;
`;
const Heart = styled.span<{ $on: boolean }>`
  font-size: 14px;
  color: ${({ $on }) => ($on ? "#FF3B30" : "rgba(0,0,0,.1)")};
`;
const HeroTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 700;
  color: #111;
  margin: 0;
  line-height: 1.3;
`;
const HeroAuthor = styled.p`
  font-size: 0.8rem;
  color: #888;
  margin: 0;
`;
const Rule = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin: 14px 0;
`;
const SectionLabel = styled.p`
  font-size: 0.59rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #aaa;
  margin: 0 0 6px;
`;
const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;
const TagPill = styled.span<{ $bg: string; $fg: string; $bd: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.74rem;
  font-weight: 500;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border: 1px solid ${({ $bd }) => $bd};
`;
const ReviewText = styled.p`
  font-size: 0.78rem;
  line-height: 1.72;
  color: #555;
  font-style: italic;
  margin: 0;
`;

// Floating book-view arrows
const FloatArrow = styled(motion.button)<{
  $side: "left" | "right";
  $mobile: boolean;
}>`
  position: fixed;
  z-index: 41;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(14, 12, 8, 0.52);
  backdrop-filter: blur(14px);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
  svg {
    width: 18px;
    height: 18px;
  }
  &:hover {
    background: rgba(35, 28, 18, 0.7);
    border-color: rgba(255, 255, 255, 0.4);
  }

  ${({ $side, $mobile }) => {
    if ($mobile)
      return css`
        bottom: calc(72vh + 1.5rem);
        ${$side === "left" ? "left: 1.25rem;" : "right: 1.25rem;"}
      `;
    return css`
      top: 50%;
      transform: translateY(-50%);
      ${$side === "left"
        ? "left: 1.25rem;"
        : `right: calc(${PANEL_W} + 1.25rem);`}
      &:active {
        transform: translateY(-50%) scale(0.93);
      }
    `;
  }}
`;
