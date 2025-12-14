import { useEffect } from "react";

export function useClickOutside(
  refs: React.RefObject<HTMLElement>[],
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: PointerEvent) => {
      const path = e.composedPath();

      for (const ref of refs) {
        if (ref.current && path.includes(ref.current)) return;
      }

      handler();
    };

    document.addEventListener("pointerdown", listener);
    return () => document.removeEventListener("pointerdown", listener);
  }, [refs, handler]);
}
