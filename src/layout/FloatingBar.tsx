import { useAppStore, useViewStore } from "@/store";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import React, { useState, useEffect, createContext, useContext } from "react";
import styled from "styled-components";

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

  const smoothX = useSpring(x, { mass: 0.8, damping: 25 });
  const smoothY = useSpring(y, { mass: 0.8, damping: 25 });

  useEffect(() => {
    if (
      !hoveredObject ||
      isMobile ||
      focusedImageTitle === hoveredObject.title
    ) {
      return;
    }

    const move = (e: MouseEvent) => {
      x.set(e.clientX + 24);
      y.set(e.clientY - 24);
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [focusedImageTitle, hoveredObject, isMobile, x, y]);

  return (
    <AnimatePresence mode="popLayout">
      {hoveredObject &&
        focusedImageTitle !== hoveredObject.title &&
        !isMobile && (
          <motion.div
            style={{
              position: "fixed",
              left: smoothX,
              top: smoothY,
              pointerEvents: "none",
              padding: "12px 16px",
              background: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(24px)",
              borderRadius: "50px",
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
  font-size: 1rem;
  font-weight: 600;
  color: "#fff";
  text-align: center;
  white-space: nowrap;
`;
