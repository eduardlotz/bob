import React, { useState, useRef, useEffect } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface FloatingBarProps {
  title: string;
  children: React.ReactNode;
}

// FloatingBar component - wrap any R3F object with this
// Usage: <FloatingBar title="Element 1"><Box /></FloatingBar>
export const FloatingBar: React.FC<FloatingBarProps> = ({
  title,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const labelPositionRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!isHovered) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const updatePositions = () => {
      // Smooth label follow with delay
      const targetX = mousePositionRef.current.x - 20;
      const targetY = mousePositionRef.current.y - 40;

      labelPositionRef.current.x +=
        (targetX - labelPositionRef.current.x) * 0.15;
      labelPositionRef.current.y +=
        (targetY - labelPositionRef.current.y) * 0.15;

      setLabelPosition({
        x: labelPositionRef.current.x,
        y: labelPositionRef.current.y,
      });

      // Update dot position from 3D object position
      if (groupRef.current) {
        const canvas = document.querySelector("canvas");
        if (canvas) {
          const camera = (canvas as any).__camera;

          if (camera) {
            const vector = groupRef.current.position.clone();
            vector.project(camera);

            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

            const randomOffsetX = Math.sin(Date.now() * 0.003) * 15;
            const randomOffsetY = Math.cos(Date.now() * 0.002) * 15;

            setDotPosition({
              x: x + randomOffsetX,
              y: y + randomOffsetY,
            });
          }
        }
      }

      animationRef.current = requestAnimationFrame(updatePositions);
    };

    animationRef.current = requestAnimationFrame(updatePositions);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    document.body.style.cursor = "default";
  };

  return (
    <>
      <group
        ref={groupRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {children}
      </group>

      {isHovered && (
        <>
          <Html
            position={[0, 1.5, 0]}
            // center
            style={{
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div
              style={{
                position: "fixed",
                left: `${labelPosition.x}px`,
                top: `${labelPosition.y}px`,
                minWidth: "fit-content",
                width: "fit-content",
                maxWidth: "calc(100vw - 32px)",
                whiteSpace: "nowrap",
                color: "#ffffff",
                padding: "12px 16px",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                borderRadius: "50px",
                fontSize: "16px",
                letterSpacing: "-0.02em",
                fontWeight: 600,
                zIndex: 1000,
                pointerEvents: "none",
              }}
            >
              {title}
            </div>
            <div
              style={{
                position: "fixed",
                left: `${dotPosition.x}px`,
                top: `${dotPosition.y}px`,
                width: "8px",
                height: "8px",
                backgroundColor: "#ffffff",
                borderRadius: "50%",
                boxShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
                zIndex: 999,
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
              }}
            />
          </Html>
        </>
      )}
    </>
  );
};
