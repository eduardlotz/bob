import * as THREE from "three";
import { memo, useEffect, useRef } from "react";

import { Book, BOOKS, useBooksStore, useViewStore } from "@/store";

import {
  BOOK_D,
  BOOK_H,
  BOOK_W,
  FocusedBookMesh,
  MICRO_ROT,
  MICRO_XZ,
  SingleBook,
} from "./singleBook";
import {
  _restoreDeskCamera,
  _restoreFullControls,
  _setBrowseControls,
  _setFocusedControls,
} from "./utils";

const MAX_BOOKS_PER_STACK = 15;
const MAX_STACKS_PER_STATUS = 3;

const GROUP_SPACING = 0.35; // X gap between status groups

// TODO: check if stupid
/**
 * Predefined (dX, dZ) offsets for 1, 2, or 3 stacks inside a group.
 * Kept small enough that no stack exits the table surface regardless of
 * GROUP_SPACING or the parent group's world-scale.
 *
 *  • 1 stack  → centred at group origin
 *  • 2 stacks → slight diagonal to avoid a perfectly symmetric look
 *  • 3 stacks → loose triangle, none exceeding ±0.14 in Z or ±0.06 in X
 */
const WITHIN_GROUP_OFFSETS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [
    [-0.1, -0.1],
    [0.07, 0.09],
  ],
  3: [
    [-0.1, -0.13],
    [0.06, 0.01],
    [-0.1, 0.13],
  ],
};

function jitterX(i: number) {
  return Math.sin(i * 2.399) * 0.005;
}
function jitterZ(i: number) {
  return Math.cos(i * 1.618) * 0.004;
}
function jitterRotY(i: number) {
  return Math.sin(i * 3.141 + 1) * 0.055;
}

type StatusKey = Book["status"];

export const STATUS_LABELS: Record<StatusKey, string> = {
  "have-read": "Gelesen",
  "currently-reading": "Lese ich aktuell",
  "will-read": "Möchte ich lesen",
  "wanna-buy": "Möchte ich kaufen",
};

const STATUS_ORDER: StatusKey[] = [
  "have-read",
  "currently-reading",
  "will-read",
  "wanna-buy",
];

export interface StackDef {
  x: number;
  z: number;
  rotY: number;
  label: string;
}

export interface StackData {
  def: StackDef;
  books: Book[];
  // bookIndices[i] is this book's index in the global BOOKS array
  bookIndices: number[];
  stackIdx: number;
  statusGroup: StatusKey;
}

export const STACKS: StackData[] = [];
export const STACKS_BY_STATUS = new Map<StatusKey, StackData[]>();

(() => {
  const groups = new Map<StatusKey, Array<{ book: Book; idx: number }>>();
  BOOKS.forEach((book, idx) => {
    if (!groups.has(book.status)) groups.set(book.status, []);
    groups.get(book.status)!.push({ book, idx });
  });

  let globalStackIdx = 0;
  const totalWidth = (STATUS_ORDER.length - 1) * GROUP_SPACING;

  STATUS_ORDER.forEach((status, groupIdx) => {
    const entries = groups.get(status) ?? [];
    if (entries.length === 0) return;

    const groupX = -totalWidth / 2 + groupIdx * GROUP_SPACING;

    const numStacks = Math.min(
      MAX_STACKS_PER_STATUS,
      Math.max(1, Math.ceil(entries.length / MAX_BOOKS_PER_STACK)),
    );
    const perStack = Math.ceil(entries.length / numStacks);

    const offsets = WITHIN_GROUP_OFFSETS[Math.min(numStacks, 3)];
    const statusStacks: StackData[] = [];

    for (let si = 0; si < numStacks; si++) {
      const slice = entries.slice(si * perStack, (si + 1) * perStack);
      if (slice.length === 0) continue;

      const [odx, odz] = offsets[si] ?? [0, 0];

      const stack: StackData = {
        def: {
          x: groupX + odx + jitterX(globalStackIdx),
          z: odz + jitterZ(globalStackIdx),
          rotY: jitterRotY(globalStackIdx),
          label: STATUS_LABELS[status],
        },
        books: slice.map((e) => e.book),
        bookIndices: slice.map((e) => e.idx),
        stackIdx: globalStackIdx,
        statusGroup: status,
      };

      STACKS.push(stack);
      statusStacks.push(stack);
      globalStackIdx++;
    }

    STACKS_BY_STATUS.set(status, statusStacks);
  });
})();

// TODO: check if module ref bad
export const BOOK_GROUP_REF: { current: THREE.Group | null } = {
  current: null,
};
export const bookMeshRefs = new Map<number, THREE.Mesh>();
export const BOOK_GEO = new THREE.BoxGeometry(BOOK_W, BOOK_D, BOOK_H);

export const TAG_PAL = [
  { bg: "rgba(52,199,89,.13)", fg: "#1D7A38", bd: "rgba(52,199,89,.26)" },
  { bg: "rgba(175,82,222,.11)", fg: "#7B3FA8", bd: "rgba(175,82,222,.22)" },
  { bg: "rgba(255,204,0,.14)", fg: "#8C6C00", bd: "rgba(255,204,0,.28)" },
  { bg: "rgba(0,122,255,.11)", fg: "#0055B8", bd: "rgba(0,122,255,.22)" },
  { bg: "rgba(255,59,48,.09)", fg: "#B52B22", bd: "rgba(255,59,48,.18)" },
] as const;

const BookStack = memo(
  ({
    stack,
    focusedBookId,
    viewActive,
  }: {
    stack: StackData;
    focusedBookId: number | null;
    viewActive: boolean;
  }) => (
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
            booksIdx={stack.bookIndices[i]}
            hidden={book.id === focusedBookId}
            canInteract={viewActive}
          />
        );
      })}
    </group>
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// BookStacks — scene root
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

  useEffect(() => {
    BOOK_GROUP_REF.current = groupRef.current;
  }, []);

  useEffect(() => {
    if (!viewActive) {
      useBooksStore.getState().clearFocus();
      _restoreFullControls();
      return;
    }

    if (focusedBook) {
      _setFocusedControls();
    } else {
      _setBrowseControls();
      _restoreDeskCamera();
    }
  }, [focusedBook?.id, viewActive]);

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
