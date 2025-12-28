import { useEffect, useState } from "react";

export type CursorState = {
  x: number; // 0..1
  y: number;
  px: number; // raw px
  py: number;
};

type UseCursorOptions = {
  condition?: () => boolean;
  positionFactor?: number;
};

export const useCursor = ({
  condition = () => true,
  positionFactor = 0.2,
}: UseCursorOptions = {}) => {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      condition() &&
        setCursor({
          x: (e.clientX / window.innerWidth - 0.5) * positionFactor,
          y: -(e.clientY / window.innerHeight - 0.5) * positionFactor,
          px: e.clientX,
          py: e.clientY,
        });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [condition]);

  return cursor;
};
