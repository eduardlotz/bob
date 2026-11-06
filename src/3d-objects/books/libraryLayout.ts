import { Quaternion, Vector3 } from "three";
import { BOOKS, type Book } from "@/store/books";
import { LIBRARY_SHELVES } from "@/store/config/library";

export function shelfBookLayout(book: Book, index: number) {
  const height = 0.6 + book.id % 4 * 0.035;
  return { height, position: [-1.61 + index % 16 * 0.207,
    0.38 + Math.floor(index / 16) * 0.86 + height / 2, 0.12] as [number, number, number] };
}

export function shelfBookWorldPose(book: Book) {
  const shelf = LIBRARY_SHELVES.find(shelf => shelf.status === book.status)!;
  const index = BOOKS.filter(candidate => candidate.status === book.status).findIndex(candidate => candidate.id === book.id);
  const layout = shelfBookLayout(book, index);
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), shelf.rotation);
  const position = new Vector3(...layout.position).applyQuaternion(rotation).add(new Vector3(...shelf.position));
  rotation.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2));
  return { position, rotation, scale: layout.height / 1.08 };
}
