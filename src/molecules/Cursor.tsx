// stolen from https://github.com/ibelick/motion-primitives/blob/main/components/core/cursor.tsx

import React, { useEffect, useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "motion/react";
import { CursorIcon } from "@/icons/cursor";
import { useCursorStore } from "@/store/cursorStore";
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
    if (!attachToParent) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "auto";
    }

    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    document.addEventListener("mousemove", updatePosition);

    return () => {
      document.removeEventListener("mousemove", updatePosition);
    };
  }, [cursorX, cursorY]);

  const cursorXSpring = useSpring(cursorX, { duration: 0 });
  const cursorYSpring = useSpring(cursorY, { duration: 0 });

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    if (attachToParent && cursorRef.current) {
      const parent = window.document;
      if (parent) {
        parent.addEventListener("mouseenter", () => {
          parent.body.style.cursor = "none";
          handleVisibilityChange(true);
        });
        parent.addEventListener("mouseleave", () => {
          parent.body.style.cursor = "auto";
          handleVisibilityChange(false);
        });
      }
    }

    return () => {
      if (attachToParent && cursorRef.current) {
        const parent = window.document;
        if (parent) {
          parent.removeEventListener("mouseenter", () => {
            parent.body.style.cursor = "none";
            handleVisibilityChange(true);
          });
          parent.removeEventListener("mouseleave", () => {
            parent.body.style.cursor = "auto";
            handleVisibilityChange(false);
          });
        }
      }
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

        x: cursorXSpring,
        y: cursorYSpring,
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
              .otherwise(() => (
                <CursorIcon />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
