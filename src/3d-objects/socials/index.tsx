import * as THREE from "three";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useAppStore, useViewStore } from "@/store";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useSocialsStore, ThroneId } from "@/store/socials";
import { THRONE_META } from "./data";
import { _restoreFullControls } from "@/3d-objects/books/utils";
import { CameraModel } from "../models/camera";
import { createAnimatedThroneFromElement } from "./helper";
import { FocusedThroneMesh, Throne } from "./throne";
import { GlobeModel } from "../models/globe";

const LinksOrbStatic = ({ color }: { color: string }) => (
  <mesh position={[0, 0, 0]}>
    {/* now centred – animation HOC adds offset */}
    <icosahedronGeometry args={[0.13, 1]} />
    <meshToonMaterial color={color} />
  </mesh>
);

export const AnimatedLinksOrb = createAnimatedThroneFromElement(
  <LinksOrbStatic color="blue" />,
  {
    baseHeight: 0.16,
  },
);

export const AnimatedCameraModel = createAnimatedThroneFromElement(
  <CameraModel position={[0, 0, 0]} scale={[0.27, 0.27, 0.27]} />,
  {
    baseHeight: 0.16, // lift above the pedestal (adj
    // ust to your model's size)
    spinSpeed: 0.0045, // matches built‑in objects
  },
);

export const AnimatedGlobeModel = createAnimatedThroneFromElement(
  <GlobeModel position={[0, 0, 0]} scale={[0.3, 0.3, 0.3]} />,
  {
    baseHeight: 0.2, // lift above the pedestal (adj
    // ust to your model's size)
    spinSpeed: 0.0045, // matches built‑in objects
  },
);

export interface ObjectProps {
  color?: string;
  focused: boolean;
  /**
   * True inside FocusedThroneMesh — the parent group owns Y-rotation,
   * so the component should suppress its own rotation.y accumulation.
   * When true the component must also center itself at y=0 (not its
   * pedestal resting height) so drag-rotation pivots around the visual
   * centre of the object, matching the book focus behaviour.
   */
  isFloating?: boolean;
}

export interface ThroneDef {
  id: ThroneId;
  x: number;
  z: number;
  baseColor: string;
  rimColor: string;
  /** Optionally swap the built-in object with a custom R3F model. Must honour ObjectProps. */
  customModel: ComponentType<ObjectProps>;
}

export const THRONE_DEFS: ThroneDef[] = [
  {
    id: "links",
    x: -0.2,
    z: -0.2,
    baseColor: "#161c2e",
    rimColor: "#4A9EFF",
    customModel: AnimatedGlobeModel,
  },
  {
    id: "journey",
    x: 0.2,
    z: -0.2,
    baseColor: "#1e1628",
    rimColor: "#A78BFA",
    customModel: AnimatedCameraModel,
  },
  {
    id: "stack",
    x: -0.2,
    z: 0.2,
    baseColor: "#152219",
    rimColor: "#34D399",
    customModel: AnimatedLinksOrb,
  },
  {
    id: "vibes",
    x: 0.2,
    z: 0.2,
    baseColor: "#281515",
    rimColor: "#FF6B9D",
    customModel: AnimatedLinksOrb,
  },
];

// Module-level map — same pattern as bookMeshRefs
export const throneObjectRefs = new Map<ThroneId, THREE.Group>();

export function SocialsCorner({
  viewId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  throneDefs = THRONE_DEFS,
}: {
  viewId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  throneDefs?: ThroneDef[];
}) {
  const currentView = useViewStore((s) => s.currentView);
  const setCameraEnabled = useViewStore((s) => s.setCameraEnabled);
  const focusedThrone = useSocialsStore((s) => s.focusedThrone);
  const groupRef = useRef<THREE.Group>(null);
  const viewActive = currentView === viewId;

  useEffect(() => {
    if (!viewActive) {
      useSocialsStore.getState().clearFocus();
      setCameraEnabled(true);
      _restoreFullControls();
      return;
    }
    // Lock camera completely when an object is focused so panel + drag-rotate
    // get all pointer events. Restore when browsing.
    setCameraEnabled(!focusedThrone);
  }, [focusedThrone, viewActive, setCameraEnabled]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {throneDefs.map((def) => (
        <Throne
          key={def.id}
          def={def}
          focused={focusedThrone === def.id}
          viewActive={viewActive}
        />
      ))}
      <FocusedThroneMesh groupRef={groupRef} throneDefs={throneDefs} />
    </group>
  );
}
