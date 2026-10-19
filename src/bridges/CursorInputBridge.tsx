import { useCursorStore } from "@/store/core/cursor";
import { useEffect } from "react";

export function CursorInputBridge() {
  const setPointerDown = useCursorStore((s) => s.setPointerDown);

  useEffect(() => {
    const down = () => setPointerDown(true);
    const up = () => setPointerDown(false);

    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    window.addEventListener("blur", up);

    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      window.removeEventListener("blur", up);
    };
  }, [setPointerDown]);

  return null;
}
