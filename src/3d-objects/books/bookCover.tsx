import { Book } from "@/store";
import { memo, useEffect, useRef } from "react";
import { paintCover } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// OpenLibrary cover URL helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the OpenLibrary cover image URL for an ISBN.
 * Sizes: "S" (small), "M" (medium ~180px tall), "L" (large ~400px tall)
 */
export function openLibraryCoverUrl(
  isbn: string,
  size: "S" | "M" | "L" = "M",
): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CoverCanvas
//
// Renders a 2-D canvas for use inside the detail panel.
// Strategy:
//   1. Immediately paint the deterministic fallback cover.
//   2. Asynchronously load the OpenLibrary thumbnail by ISBN.
//   3. If the image loads, replace the canvas contents.
//   4. If it fails (404, network, etc.) the fallback stays visible.
// ─────────────────────────────────────────────────────────────────────────────

export const CoverCanvas = memo(
  ({ book, w, h }: { book: Book; w: number; h: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Step 1 — instant fallback
      paintCover(ctx, book, w, h);

      // Step 2 — async OpenLibrary cover
      if (!book.isbn) return;

      let cancelled = false;
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        if (cancelled) return;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      };

      // On error we simply keep the already-painted fallback — no action needed.
      img.src = openLibraryCoverUrl(book.isbn, w >= 100 ? "M" : "S");

      return () => {
        cancelled = true;
      };
    }, [book.id, book.isbn, w, h]);

    return (
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{ display: "block" }}
      />
    );
  },
);
