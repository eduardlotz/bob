import { useCursorStore } from "@/store/cursorStore";
import { useEffect } from "react";

export function CursorInputBridge() {
  const setPointerDown = useCursorStore((s) => s.setPointerDown);

  useEffect(() => {
    const down = () => setPointerDown(true);
    const up = () => setPointerDown(false);

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", up);

    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [setPointerDown]);

  return null;
}
