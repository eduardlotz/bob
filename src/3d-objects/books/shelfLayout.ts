import { Quaternion, Vector3 } from "three";
import { BOOKS, type Book } from "@/store/books";
import { ABOUT_ROOM } from "@/store/config/aboutRoom";

export const BOOK_SIZE = [0.75, 1.08, 0.10] as const;
export const ABOUT_BOOKSHELF = {
  position: [2.65, ABOUT_ROOM.floorY, -4.43] as [number, number, number],
  width: 2.5,
  height: 3.85,
  depth: .48,
  levels: [.27, 1.14, 2.01, 2.88],
};

/** Four tiers: to read, two rows of read books, and the current reading pile. */
export function shelfBookWorldPose(book: Book) {
  const peers = BOOKS.filter(candidate => candidate.status === book.status);
  const index = peers.findIndex(candidate => candidate.id === book.id);
  const split = Math.ceil(peers.length / 2);
  const row = book.status === "currently-reading" ? 3 : book.status === "will-read" ? 0 : 1 + Math.floor(index / split);
  const column = book.status === "have-read" ? index % split : index;
  const height = .62 + book.id % 4 * .025;
  const scale = height / BOOK_SIZE[1];
  return {
    position: new Vector3(ABOUT_BOOKSHELF.position[0] - 1.08 + column * .069,
      ABOUT_ROOM.floorY + ABOUT_BOOKSHELF.levels[row] + .045 + height / 2, -4.42),
    rotation: new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
    scale,
  };
}
