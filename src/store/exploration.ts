import { create } from "zustand";
import { BOOKS, BOOK_BY_ID, type Book } from "./books";
import { LIBRARY_SHELVES } from "./config/library";

export const useLibraryStore = create<{
  status: Book["status"] | null;
  bookId: number | null;
  media: "blogs" | "videos" | null;
  mediaIndex: number;
  playingVideo: boolean;
  browse: (status: Book["status"] | null) => void;
  openBook: (bookId: number | null) => void;
  navigateBook: (direction: -1 | 1) => void;
  navigateShelf: (direction: -1 | 1) => void;
  openMedia: (media: "blogs" | "videos" | null, index?: number) => void;
  playVideo: () => void;
  reset: () => void;
}>((set, get) => ({
  status: null, bookId: null, media: null, mediaIndex: 0, playingVideo: false,
  browse: (status) => set({ status, bookId: null, media: null, playingVideo: false }),
  openBook: (bookId) => {
    if (bookId === null) { set({ bookId }); return; }
    const book = BOOK_BY_ID.get(bookId);
    if (!book) return;
    if (get().status !== book.status) { get().browse(book.status); return; }
    set({ bookId, status: book.status, media: null, playingVideo: false });
  },
  navigateBook: (direction) => {
    const { status, bookId } = get();
    const books = BOOKS.filter(book => book.status === status);
    if (!books.length) return;
    const index = books.findIndex(book => book.id === bookId);
    const next = index < 0 ? (direction > 0 ? 0 : books.length - 1) : (index + direction + books.length) % books.length;
    get().openBook(books[next].id);
  },
  navigateShelf: (direction) => {
    const index = LIBRARY_SHELVES.findIndex(shelf => shelf.status === get().status);
    const next = (Math.max(index, 0) + direction + LIBRARY_SHELVES.length) % LIBRARY_SHELVES.length;
    get().browse(LIBRARY_SHELVES[next].status);
  },
  openMedia: (media, mediaIndex = 0) => set({ media, mediaIndex, status: null, bookId: null, playingVideo: false }),
  playVideo: () => set({ playingVideo: true }),
  reset: () => set({ status: null, bookId: null, media: null, mediaIndex: 0, playingVideo: false }),
}));
