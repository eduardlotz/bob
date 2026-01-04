import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useCursorStore } from "@/store/cursorStore";
import { useEffect } from "react";

const CLICKABLE_SELECTOR =
  'button, [role="button"], a, input[type="button"], input[type="submit"], input[type="radio"], input[type="checkbox"], [data-clickable], [data-ui-sound-id]';

export function ClickableBridge() {
  const sound = useSoundSystem();

  const setHovering = useCursorStore((s) => s.setHoveringClickable);
  const setPointerDown = useCursorStore((s) => s.setPointerDown);

  useEffect(() => {
    const over = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(CLICKABLE_SELECTOR);
      if (target) setHovering(true);
    };

    const out = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(CLICKABLE_SELECTOR);
      if (target) setHovering(false);
    };

    const down = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(CLICKABLE_SELECTOR);
      if (target) setPointerDown(true);
    };

    const up = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(CLICKABLE_SELECTOR);
      if (target) setPointerDown(false);
    };

    const click = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest(CLICKABLE_SELECTOR);
      if (!target) return;

      const attrId = target.getAttribute("data-ui-sound-id");
      setTimeout(() => {
        attrId ? sound.playUISound(attrId) : sound.playUISound();
      }, 0);
    };

    window.addEventListener("pointerover", over);
    window.addEventListener("pointerout", out);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("click", click);

    return () => {
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("click", click);
    };
  }, [setHovering, setPointerDown]);

  return null;
}
