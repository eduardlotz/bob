import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { GradientTexture } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { type ReactNode, useCallback, useRef } from "react";
import { DoubleSide, type MeshBasicMaterial } from "three";
import * as THREE from "three";

type MiniGameThroneProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  objectOffset?: [number, number, number];
  objectScale?: [number, number, number] | number;
};

const STONE_PRIMARY = "#e4ddcf";
const STONE_SECONDARY = "#c7bba8";
const STONE_WARM = "#f1e8d8";
const SPOTLIGHT_TOP = "#ffffff";
const SPOTLIGHT_BOTTOM = "#f5df9a";
const SPOTLIGHT_HEIGHT = 9.5;
const SPOTLIGHT_TOP_RADIUS = 0.08;
const SPOTLIGHT_BOTTOM_RADIUS = 1.26;
const SPOTLIGHT_TARGET_Y = -0.34;

const fade = (current: number, target: number, delta: number) =>
  current + (target - current) * Math.min(1, delta * 8);

export function MiniGameThrone({
  children,
  label,
  onClick,
  position = [0, 0, 0],
  rotation,
  scale = 1,
  objectOffset = [0, 1.52, 0],
  objectScale = 1,
}: MiniGameThroneProps) {
  const { setHoveredObject } = useFloatingBar();
  const objectRef = useRef<THREE.Group>(null);
  const spotlightMaterialRef = useRef<MeshBasicMaterial>(null);
  const hoveredRef = useRef(false);

  useFrame(({ clock }, delta) => {
    const hovered = hoveredRef.current;

    if (objectRef.current) {
      const elapsed = clock.getElapsedTime();
      objectRef.current.rotation.y += delta * (hovered ? 1.15 : 0.55);
      objectRef.current.position.y =
        objectOffset[1] + Math.sin(elapsed * 1.6) * 0.04;
    }

    const target = hovered ? 1 : 0;
    if (spotlightMaterialRef.current) {
      spotlightMaterialRef.current.opacity = fade(
        spotlightMaterialRef.current.opacity,
        target * 0.09,
        delta,
      );
    }
  });

  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (hoveredRef.current) return;

      hoveredRef.current = true;
      setHoveredObject({ title: label });
      useCursorStore.getState().setHoveringClickable(true);
    },
    [label, setHoveredObject],
  );

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!hoveredRef.current) return;

    hoveredRef.current = false;
    setHoveredObject(null);
    useCursorStore.getState().setHoveringClickable(false);
  }, [setHoveredObject]);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      hoveredRef.current = false;
      setHoveredObject(null);
      useCursorStore.getState().setHoveringClickable(false);
      onClick();
    },
    [onClick, setHoveredObject],
  );
  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <group>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[0.92, 1.08, 0.16, 8]} />
          <meshToonMaterial color={STONE_SECONDARY} />
        </mesh>

        <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.34, 1.2, 40]} />
          <meshToonMaterial color={STONE_WARM} />
        </mesh>

        <mesh position={[0, 1.47, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.18, 0.3, 1.18]} />
          <meshToonMaterial color={STONE_PRIMARY} />
        </mesh>
      </group>

      <group ref={objectRef} position={objectOffset} scale={objectScale}>
        {children}
      </group>

      <mesh position={[0, SPOTLIGHT_TARGET_Y + SPOTLIGHT_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[
            SPOTLIGHT_TOP_RADIUS,
            SPOTLIGHT_BOTTOM_RADIUS,
            SPOTLIGHT_HEIGHT,
            128,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          ref={spotlightMaterialRef}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        >
          <GradientTexture
            stops={[0, 0.42, 1]}
            colors={[SPOTLIGHT_TOP, SPOTLIGHT_BOTTOM, "#ffffff"]}
            size={256}
          />
        </meshBasicMaterial>
      </mesh>

      <mesh>
        <sphereGeometry args={[1.35, 24, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
