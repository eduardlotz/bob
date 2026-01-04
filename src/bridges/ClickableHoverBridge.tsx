import { useCursorStore } from "@/store/cursorStore";
import { useEffect } from "react";

const CLICKABLE_SELECTOR =
  'button, [role="button"], a, input[type="button"], input[type="submit"], [data-clickable], input[type="radio"], input[type="checkbox"], [data-ui-sound-id]';

export function ClickableHoverBridge() {
  const setHovering = useCursorStore((s) => s.setHoveringClickable);

  useEffect(() => {
    const onOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(CLICKABLE_SELECTOR)) {
        setHovering(true);
      }
    };

    const onOut = () => setHovering(false);

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);

    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, [setHovering]);

  return null;
}
