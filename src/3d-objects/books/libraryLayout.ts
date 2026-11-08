import { Quaternion, Vector3 } from "three";
import { BOOKS, type Book } from "@/store/books";
import { LIBRARY_SHELVES, shelfDimensions, SHELF_BASE, SHELF_ROW_HEIGHT } from "@/store/config/library";

export { shelfDimensions, SHELF_BASE, SHELF_ROW_HEIGHT } from "@/store/config/library";

export const BOOK_SIZE = [0.75, 1.08, 0.24] as const;
export function shelfBookLayout(book: Book, index: number) {
  const { columns } = shelfDimensions(book.status);
  const height = 0.6 + book.id % 4 * 0.035;
  return { height, position: [(index % columns - (columns - 1) / 2) * 0.18,
    SHELF_BASE + 0.07 + Math.floor(index / columns) * SHELF_ROW_HEIGHT + height / 2, 0.08] as [number, number, number] };
}

export function shelfBookWorldPose(book: Book) {
  const shelf = LIBRARY_SHELVES.find(shelf => shelf.status === book.status)!;
  const index = BOOKS.filter(candidate => candidate.status === book.status).findIndex(candidate => candidate.id === book.id);
  const layout = shelfBookLayout(book, index);
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), shelf.rotation);
  const position = new Vector3(...layout.position).applyQuaternion(rotation).add(new Vector3(...shelf.position));
  rotation.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2));
  return { position, rotation, scale: layout.height / BOOK_SIZE[1] };
}
