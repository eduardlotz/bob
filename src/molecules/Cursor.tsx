import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, AnimatePresence } from "motion/react";
import { CursorIcon } from "@/icons/cursor";
import { useCursorStore } from "@/store/core/cursor";
import { CursorHoverIcon } from "@/icons/cursor-hover";
import { CursorClickIcon } from "@/icons/cursor-click";
import { match } from "ts-pattern";
import { CursorGrabIcon } from "@/icons/cursor-grab";
import { CursorGrabbingIcon } from "@/icons/cursor-grabbing";

export type CursorProps = {
  attachToParent?: boolean;
};

export function Cursor({ attachToParent }: CursorProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  const variant = useCursorStore((s) => s.variant);

  useEffect(() => {
    cursorX.set(window.innerWidth / 2);
    cursorY.set(window.innerHeight / 2);
  }, []);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    document.addEventListener("mousemove", updatePosition, { passive: true });
    document.body.style.cursor = attachToParent ? "auto" : "none";

    return () => {
      document.removeEventListener("mousemove", updatePosition);
      document.body.style.cursor = "auto";
    };
  }, [attachToParent, cursorX, cursorY]);

  useEffect(() => {
    const showCursor = () => setIsVisible(true);
    const hideCursor = () => setIsVisible(false);

    if (!attachToParent) return;

    window.addEventListener("blur", hideCursor);
    window.addEventListener("focus", showCursor);

    return () => {
      window.removeEventListener("blur", hideCursor);
      window.removeEventListener("focus", showCursor);
      setIsVisible(true);
    };
  }, [attachToParent]);

  return (
    <motion.div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 99999,

        x: cursorX,
        y: cursorY,
        translateX: "-6px", // little offset because of icons
        translateY: "-4px", // little offset because of icons
      }}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div initial="initial" animate="animate" exit="exit">
            {match(variant)
              .with("active", () => <CursorClickIcon />)
              .with("hover", () => <CursorHoverIcon />)
              .with("grab", () => <CursorGrabIcon />)
              .with("grabbing", () => <CursorGrabbingIcon />)
              .with("default", () => <CursorIcon />)
              .otherwise(() => null)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
