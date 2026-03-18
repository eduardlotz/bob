import * as THREE from "three";
import { useEffect, useRef } from "react";

import { useViewStore } from "@/store";
import { useSocialsStore } from "@/store/socials";
import { _restoreFullControls } from "@/3d-objects/books/utils";

import { THRONE_CONFIG, type ThroneId } from "./data";
import { FocusedThroneMesh, Throne } from "./throne";
import type { SocialThroneConfig } from "./types";

export const throneObjectRefs = new Map<ThroneId, THREE.Group>();

export function SocialsCorner({
  viewId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  throneDefs = THRONE_CONFIG,
}: {
  viewId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  throneDefs?: readonly SocialThroneConfig[];
}) {
  const currentView = useViewStore((state) => state.currentView);
  const setCameraEnabled = useViewStore((state) => state.setCameraEnabled);
  const focusedThrone = useSocialsStore((state) => state.focusedThrone);
  const groupRef = useRef<THREE.Group>(null);
  const viewActive = currentView === viewId;

  useEffect(() => {
    if (!viewActive) {
      useSocialsStore.getState().clearFocus();
      setCameraEnabled(true);
      _restoreFullControls();
      return;
    }

    setCameraEnabled(!focusedThrone);
  }, [focusedThrone, setCameraEnabled, viewActive]);

  return (
    <>
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        {throneDefs.map((def) => (
          <Throne
            key={def.id}
            def={def}
            focused={focusedThrone === def.id}
            viewActive={viewActive}
          />
        ))}
      </group>
      <FocusedThroneMesh groupRef={groupRef} throneDefs={throneDefs} />
    </>
  );
}
