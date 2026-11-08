import { BOOKS, type Book } from "../books";

export const LIBRARY_SHELF_MIN_DISTANCE = 0.5;
export const LIBRARY_SHELF_MAX_DISTANCE = 7;
export const LIBRARY_SHELF_FOCUS_DISTANCE = 1.85;

// Keep the media corner staged while the book library is being tested.
export const LIBRARY_MEDIA_ENABLED = false;
export const LIBRARY_FLOOR_Y = -2.045;

export const SHELF_ROW_HEIGHT = 0.86;
export const SHELF_BASE = 0.4;

export function shelfDimensions(status: Book["status"]) {
  const count = BOOKS.filter(book => book.status === status).length;
  const columns = Math.max(1, Math.min(14, count));
  const rows = Math.max(1, Math.ceil(count / columns));
  return { count, columns, rows, width: Math.max(1.05, columns * 0.18 + 0.34), height: SHELF_BASE + rows * SHELF_ROW_HEIGHT };
}

// The colonnade occupies the forward semicircle, leaving the camera side open.
export const LIBRARY_ARC = { shelfRadius: 5.1, wallInnerRadius: 5.65, wallOuterRadius: 5.95 } as const;
const categories: Book["status"][] = ["currently-reading", "have-read", "will-read", "wanna-buy"];
const placements = categories.map((status, index) => {
  const angle = (-67.5 + index * 45) * Math.PI / 180;
  return { status, position: [Math.sin(angle) * LIBRARY_ARC.shelfRadius, -2.05,
    -Math.cos(angle) * LIBRARY_ARC.shelfRadius] as [number, number, number], rotation: -angle };
});

export const LIBRARY_SHELVES = placements.map(shelf => {
  const { height } = shelfDimensions(shelf.status);
  const target: [number, number, number] = [shelf.position[0], shelf.position[1] + (SHELF_BASE + height) / 2, shelf.position[2]];
  const camera: [number, number, number] = [target[0] + Math.sin(shelf.rotation) * LIBRARY_SHELF_FOCUS_DISTANCE,
    target[1] + 0.12, target[2] + Math.cos(shelf.rotation) * LIBRARY_SHELF_FOCUS_DISTANCE];
  return { ...shelf, camera, target };
});
