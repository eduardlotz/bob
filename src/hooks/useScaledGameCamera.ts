import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type CameraControls from "camera-controls";
import { useViewStore } from "@/store/viewStore";

/** Keep zoom limits consistent with the scaled game, and restore them on exit. */
export function useScaledGameCamera(sizeFactor: number) {
  const ref = useViewStore((state) => state.cameraControlsRef);
  const limits = useRef<{ controls: CameraControls; min: number; max: number }>();
  useFrame(() => {
    const controls = ref?.current;
    if (!controls) return;
    if (limits.current?.controls !== controls) {
      limits.current = { controls, min: controls.minDistance, max: controls.maxDistance };
    }
    // Other views (e.g. opening Settings during a round) also write these limits.
    // Two scalar assignments keep setLookAt from clamping a large/small game.
    controls.minDistance = limits.current.min * sizeFactor;
    controls.maxDistance = limits.current.max * sizeFactor;
  });
  useEffect(() => () => {
    const saved = limits.current;
    if (!saved) return;
    saved.controls.minDistance = saved.min;
    saved.controls.maxDistance = saved.max;
    limits.current = undefined;
  }, [ref]);
  return ref;
}
