import { Book } from "@/store";
import { memo, useEffect, useRef } from "react";
import { paintCover } from "./utils";

export const CoverCanvas = memo(
  ({ book, w, h }: { book: Book; w: number; h: number }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (ref.current) paintCover(ref.current.getContext("2d")!, book, w, h);
    }, [book.id, w, h]);
    return (
      <canvas
        ref={ref}
        width={w}
        height={h}
        style={{ borderRadius: 4, display: "block" }}
      />
    );
  },
);
