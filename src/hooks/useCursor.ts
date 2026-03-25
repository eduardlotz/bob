import { useEffect, useRef } from "react";

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
  const cursorRef = useRef<CursorState>({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  });
  const conditionRef = useRef(condition);

  useEffect(() => {
    conditionRef.current = condition;
  }, [condition]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!conditionRef.current()) return;

      const cursor = cursorRef.current;
      cursor.x = (e.clientX / window.innerWidth - 0.5) * positionFactor;
      cursor.y = -(e.clientY / window.innerHeight - 0.5) * positionFactor;
      cursor.px = e.clientX;
      cursor.py = e.clientY;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [positionFactor]);

  return cursorRef;
};
