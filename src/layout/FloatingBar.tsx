import { AnimatePresence, motion } from "motion/react";
import React, { useState, useEffect, createContext, useContext } from "react";

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
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({
        x: e.clientX + 12,
        y: e.clientY - 24,
      });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <AnimatePresence mode="popLayout">
      {hoveredObject && (
        <motion.div
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            pointerEvents: "none",
            padding: "12px 16px",
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(32px)",
            borderRadius: "50px",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            zIndex: 10000,
          }}
          key={"hover-object-floating-bar"}
          initial={{
            scale: 0.95,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: 0.9,
            opacity: 0,
          }}
          transition={{ duration: 0.2, type: "spring" }}
        >
          {hoveredObject.title}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
