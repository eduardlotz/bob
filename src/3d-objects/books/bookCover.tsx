import { Book } from "@/store";
import { useEffect, useRef } from "react";
import { paintCover } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// CoverCanvas
//
// Renders a book cover onto a <canvas> element.
// If the book has an ISBN we attempt to load the jacket from OpenLibrary.
// Their "no cover found" response is a tiny placeholder image (< 50 px wide),
// so we measure naturalWidth before painting and silently keep the fallback
// when the server returns a placeholder.
// ─────────────────────────────────────────────────────────────────────────────

interface CoverCanvasProps {
  book: Book;
  w: number;
  h: number;
  style?: React.CSSProperties;
}

export function CoverCanvas({ book, w, h, style }: CoverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Always paint the fallback first — visible immediately
    paintCover(ctx, book, w, h);

    if (!book.isbn) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      // OpenLibrary returns a ~1×1 gif when no cover exists — ignore it
      if (img.naturalWidth < 50 || img.naturalHeight < 50) return;

      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;
      ctx2.clearRect(0, 0, w, h);
      ctx2.drawImage(img, 0, 0, w, h);
    };

    // onerror: network failure or 404 → fallback canvas already painted, no action
    img.src = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;

    return () => {
      cancelled = true;
    };
    // Re-run only when the book identity changes (isbn / fallback colors)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, book.isbn, w, h]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{ display: "block", ...style }}
    />
  );
}
