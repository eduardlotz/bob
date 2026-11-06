import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ROUTE_PATHS, useAppStore, useCoreStore } from "@/store";
import { useBobEditor } from "@/store/bobEditor";
import { createAutoTapPayout } from "@/utils/autoTapPayout";

/** Earnings stay mounted across routes; Home's text and particles do not. */
export function AutoTapController() {
  const [advance] = useState(createAutoTapPayout);
  useFrame((_, delta) => {
    const state = useCoreStore.getState();
    if (state.isPaused) return;
    const steps = advance(delta, state.getAutoTapRate(), false);
    if (steps <= 0) return;
    state.addAutoTaps(steps);

    if (useAppStore.getState().currentRoute === ROUTE_PATHS.HOME &&
      state.graphicPreferences.effectsEnabled && !useBobEditor.getState().open) {
      (window as any).createTapParticles?.(0, 0.5, -2, 15);
    }
  });
  return null;
}
