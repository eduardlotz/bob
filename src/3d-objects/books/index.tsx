import * as THREE from "three";
import { memo, useEffect, useRef } from "react";

import { BOOKS, useBooksStore, useViewStore } from "@/store";

import {
  BOOK_D,
  BOOK_H,
  BOOK_W,
  FocusedBookMesh,
  MICRO_ROT,
  MICRO_XZ,
  SingleBook,
} from "./singleBook";
import { _moveCameraToStack, _restoreDeskCamera } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────

// Hard physical limit — beyond ~10 books a stack becomes too tall to look
// natural on a desk. Adjust down if your camera sits low.
const MAX_PER_STACK = Math.ceil(BOOKS.length / 5); // always exactly 5 stacks

// Grid geometry — how many columns before wrapping to the next row.
// 5 cols × 2 rows = 10 stacks × 8 books = 80 books max on one table.
const GRID_COLS = 5;

// World-unit spacing between stack centres.
const COL_SPACING = 0.24; // X axis
const ROW_SPACING = 0.22; // Z axis

// Small deterministic jitter so stacks don't look machine-stamped.
// Using trigonometric functions of the stack index keeps it reproducible.
function jitterX(i: number) {
  return Math.sin(i * 2.399) * 0.012; // Fibonacci-angle spread
}
function jitterZ(i: number) {
  return Math.cos(i * 1.618) * 0.01;
}
function jitterRotY(i: number) {
  return Math.sin(i * 3.141 + 1) * 0.18;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack definitions — generated once from BOOKS at module load time
// ─────────────────────────────────────────────────────────────────────────────

export interface StackDef {
  x: number;
  z: number;
  rotY: number;
  label: string;
}

export interface StackData {
  def: StackDef;
  books: (typeof BOOKS)[number][];
  startIdx: number;
  stackIdx: number;
}

export const STACKS: StackData[] = (() => {
  const numStacks = Math.ceil(BOOKS.length / MAX_PER_STACK);
  const rows = Math.ceil(numStacks / GRID_COLS);

  // Centre the grid around (0, 0) in XZ
  const totalW = (Math.min(numStacks, GRID_COLS) - 1) * COL_SPACING;
  const totalD = (rows - 1) * ROW_SPACING;

  let bookIdx = 0;
  const stacks: StackData[] = [];

  for (let si = 0; si < numStacks; si++) {
    const col = si % GRID_COLS;
    const row = Math.floor(si / GRID_COLS);

    const x = -totalW / 2 + col * COL_SPACING + jitterX(si);
    const z = -totalD / 2 + row * ROW_SPACING + jitterZ(si);
    const rotY = jitterRotY(si);

    const count = Math.min(MAX_PER_STACK, BOOKS.length - bookIdx);

    stacks.push({
      def: { x, z, rotY, label: `Stapel ${si + 1}` },
      books: BOOKS.slice(bookIdx, bookIdx + count),
      startIdx: bookIdx,
      stackIdx: si,
    });

    bookIdx += count;
  }

  return stacks;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Module-level refs (live outside React to avoid closures)
// ─────────────────────────────────────────────────────────────────────────────

export const BOOK_GROUP_REF: { current: THREE.Group | null } = {
  current: null,
};
export const bookMeshRefs = new Map<number, THREE.Mesh>();

export const BOOK_GEO = new THREE.BoxGeometry(BOOK_W, BOOK_D, BOOK_H);

// ─────────────────────────────────────────────────────────────────────────────
// TAG_PAL — colour palette for overlay tag pills
// ─────────────────────────────────────────────────────────────────────────────

export const TAG_PAL = [
  { bg: "rgba(52,199,89,.13)", fg: "#1D7A38", bd: "rgba(52,199,89,.26)" },
  { bg: "rgba(175,82,222,.11)", fg: "#7B3FA8", bd: "rgba(175,82,222,.22)" },
  { bg: "rgba(255,204,0,.14)", fg: "#8C6C00", bd: "rgba(255,204,0,.28)" },
  { bg: "rgba(0,122,255,.11)", fg: "#0055B8", bd: "rgba(0,122,255,.22)" },
  { bg: "rgba(255,59,48,.09)", fg: "#B52B22", bd: "rgba(255,59,48,.18)" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// BookStack — renders one physical stack of books
//
// Interaction model (simplified):
//   • Any book in any stack is directly clickable as long as no book is
//     currently focused — no "open stack" step required.
//   • canInteract = !focusedBookId (and view must be active, enforced above).
//   • The group itself has no click handler; individual SingleBook meshes
//     handle their own pointer events.
// ─────────────────────────────────────────────────────────────────────────────

const BookStack = memo(
  ({
    stack,
    focusedBookId,
    viewActive,
  }: {
    stack: StackData;
    focusedBookId: number | null;
    viewActive: boolean;
  }) => {
    // Books are interactable whenever the view is active and nothing is focused
    const canInteract = viewActive && focusedBookId === null;

    return (
      <group
        position={[stack.def.x, 0, stack.def.z]}
        rotation={[0, stack.def.rotY, 0]}
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

// ─────────────────────────────────────────────────────────────────────────────
// BookStacks — scene root for all stacks + the focused-book lift mesh
// ─────────────────────────────────────────────────────────────────────────────

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
  const groupRef = useRef<THREE.Group>(null);

  const viewActive = currentView === viewId;

  // ── Keep the module-level ref in sync ────────────────────────────────────
  useEffect(() => {
    BOOK_GROUP_REF.current = groupRef.current;
  });

  // ── View enter / leave ────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewActive) {
      useBooksStore.getState().clearFocus();
      return;
    }
    // Entering this view: lock orbit & restore the desk-overview camera
    _restoreDeskCamera();
  }, [viewActive]);

  // ── Book focus / dismiss ──────────────────────────────────────────────────
  useEffect(() => {
    if (focusedBook) {
      // Camera moves to the book's stack — driven by overlay.tsx via
      // _moveCameraToStack when activeStack changes, so nothing to do here.
      return;
    }

    // Book was dismissed: restore fixed controls & desk overview
    _restoreDeskCamera();
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
          viewActive={viewActive}
        />
      ))}
      <FocusedBookMesh groupRef={groupRef} />
    </group>
  );
}
