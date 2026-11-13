import { useAppStore, useViewStore } from "@/store";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
  useReducedMotion,
} from "motion/react";
import React, { useState, useEffect, createContext, useContext } from "react";
import styled from "styled-components";
import { sceneChipStyle } from "@/components/SceneChip";

interface FloatingBarContextType {
  hoveredObject: {
    title: string;
  } | null;
  setHoveredObject: (
    obj: {
      title: string;
    } | null
  ) => void;
}

const FloatingBarContext = createContext<FloatingBarContextType>({
  hoveredObject: null,
  setHoveredObject: () => {},
});

export const useFloatingBar = () => useContext(FloatingBarContext);

export const FloatingBarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hoveredObject, setHoveredObject] = useState<{
    title: string;
  } | null>(null);

  return (
    <FloatingBarContext.Provider value={{ hoveredObject, setHoveredObject }}>
      {children}
    </FloatingBarContext.Provider>
  );
};

interface FloatingBarProps {
  title: string;
  children: React.ReactNode;
}

export const FloatingBar: React.FC<FloatingBarProps> = ({
  title,
  children,
}) => {
  const { setHoveredObject } = useFloatingBar();

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();

    setHoveredObject({
      title,
    });
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
  };

  return (
    <group
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </group>
  );
};

export const FloatingBarUI: React.FC = () => {
  const { hoveredObject } = useFloatingBar();
  const { isMobile } = useAppStore();
  const { focusedImageTitle } = useViewStore();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const reducedMotion = useReducedMotion();
  const smoothX = useSpring(x, { mass: 0.65, damping: 23, stiffness: 190 });
  const smoothY = useSpring(y, { mass: 0.65, damping: 23, stiffness: 190 });
  const velocityX = useVelocity(smoothX);
  const velocityY = useVelocity(smoothY);
  const momentum = useTransform([velocityX, velocityY], ([vx, vy]: number[]) =>
    Math.max(-12, Math.min(12, vx * 0.014 + Math.sign(vx) * Math.abs(vy) * 0.004)));
  const rotation = useSpring(momentum, { stiffness: 220, damping: 19 });

  useEffect(() => {
    if (isMobile) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX + 24);
      y.set(e.clientY - 24);
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [isMobile, x, y]);

  return (
    <AnimatePresence mode="popLayout">
      {hoveredObject &&
        focusedImageTitle !== hoveredObject.title &&
        !isMobile && (
          <motion.div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              x: reducedMotion ? x : smoothX,
              y: reducedMotion ? y : smoothY,
              rotate: reducedMotion ? 0 : rotation,
              transformOrigin: "0 100%",
              pointerEvents: "none",
              zIndex: 10000,
            }}
            key={"hover-object-floating-bar"}
            initial={{
              scale: 0.95,
              filter: "blur(6px)",
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              filter: "blur(6px)",
            }}
            transition={{
              mass: 0.6,
              type: "spring",
            }}
          >
            <FloatingBarLabel
              initial={{
                scale: 0.95,
                filter: "blur(6px)",
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
                filter: "blur(6px)",
              }}
              transition={{
                mass: 0.2,
                type: "spring",
              }}
            >
              {hoveredObject.title}
            </FloatingBarLabel>
          </motion.div>
        )}
    </AnimatePresence>
  );
};

const FloatingBarLabel = styled(motion.p)`
  ${sceneChipStyle}
`;
