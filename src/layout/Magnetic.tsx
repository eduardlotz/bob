import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useAppStore } from "@/store";

const SPRING_CONFIG = { damping: 100, stiffness: 400 };

type MagneticEffectType = {
  children: React.ReactNode;
  distance?: number;
  active?: boolean;
};

export function Magnetic({
  children,
  distance = 0.3,
  active = true,
}: MagneticEffectType) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { isMobile } = useAppStore();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, SPRING_CONFIG);
  const springY = useSpring(y, SPRING_CONFIG);

  useEffect(() => {
    if (isMobile || !active) return;

    if (!isHovered) {
      x.set(0);
      y.set(0);
      return;
    }

    const calculateDistance = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      x.set((e.clientX - centerX) * distance);
      y.set((e.clientY - centerY) * distance);
    };

    document.addEventListener("mousemove", calculateDistance, { passive: true });

    return () => {
      document.removeEventListener("mousemove", calculateDistance);
    };
  }, [active, distance, isHovered, isMobile, x, y]);

  if (isMobile || !active) return children;

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        x: springX,
        y: springY,
        position: "relative",
      }}
    >
      {children}
    </motion.div>
  );
}
