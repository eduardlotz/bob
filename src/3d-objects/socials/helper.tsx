import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ObjectProps } from ".";

// Reuse the same animation base (no changes needed)
function AnimatedThroneBase({
  focused,
  isFloating,
  baseHeight = 0.16,
  spinSpeed = 0.0045,
  children,
}: ObjectProps & {
  children: React.ReactNode;
  baseHeight?: number;
  spinSpeed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    t.current += dt;

    const bob = Math.sin(t.current * 1.3) * 0.038;
    const baseScale = focused ? 1.14 : 1;
    const pulse = Math.sin(t.current * 1.8) * 0.018;
    const scale = baseScale + pulse;

    groupRef.current.position.y = isFloating
      ? bob
      : baseHeight + bob + (focused ? 0.055 : 0);
    groupRef.current.scale.setScalar(scale);

    if (!isFloating) {
      groupRef.current.rotation.y += dt * spinSpeed;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

/**
 * Creates a component from a fixed JSX element that will be animated like a throne object.
 * The returned component accepts the standard `ObjectProps` (color, focused, isFloating)
 * and passes `color` down to the element (if it wants to use it).
 */
export function createAnimatedThroneFromElement(
  element: React.ReactElement,
  options?: { baseHeight?: number; spinSpeed?: number },
): React.ComponentType<ObjectProps> {
  const displayName =
    (element.type as any)?.displayName ||
    (element.type as any)?.name ||
    "Element";

  const AnimatedThroneElement = (props: ObjectProps) => {
    const { color, focused, isFloating } = props;
    return (
      <AnimatedThroneBase
        focused={focused}
        isFloating={isFloating}
        baseHeight={options?.baseHeight}
        spinSpeed={options?.spinSpeed}
      >
        {/* Clone the element to inject the color prop (optional) */}
        {React.cloneElement(element, { color })}
      </AnimatedThroneBase>
    );
  };

  AnimatedThroneElement.displayName = `AnimatedThrone(${displayName})`;
  return AnimatedThroneElement;
}
