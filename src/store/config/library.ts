import type { Book } from "../books";

export const LIBRARY_SHELF_MIN_DISTANCE = 0.5;
export const LIBRARY_SHELF_MAX_DISTANCE = 7;
export const LIBRARY_SHELF_FOCUS_DISTANCE = 2.5;

// Keep the media corner staged while the book library is being tested.
export const LIBRARY_MEDIA_ENABLED = false;

export const LIBRARY_SHELVES: {
  status: Book["status"];
  position: [number, number, number];
  rotation: number;
  camera: [number, number, number];
  target: [number, number, number];
}[] = [
  { status: "currently-reading", position: [-4.5, -2.05, -0.8], rotation: Math.PI / 2, camera: [-0.7, 1.15, 0.4], target: [-4.4, -0.05, -0.8] },
  { status: "have-read", position: [-2.25, -2.05, -4.45], rotation: 0, camera: [-2.25, 1.2, 0], target: [-2.25, -0.05, -4.35] },
  { status: "will-read", position: [2.25, -2.05, -4.45], rotation: 0, camera: [2.25, 1.2, 0], target: [2.25, -0.05, -4.35] },
  { status: "wanna-buy", position: [4.5, -2.05, -0.8], rotation: -Math.PI / 2, camera: [0.7, 1.15, 0.4], target: [4.4, -0.05, -0.8] },
];
