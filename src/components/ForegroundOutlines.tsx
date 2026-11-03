import { useEffect, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store/core/store";
import { useBobSkin } from "@/hooks/useBobSkin";
import { ForegroundOutlineManager, type OutlineScope } from "./outlineManager";

export function OutlineScope({ category, children }: { category: OutlineScope; children: ReactNode }) {
  return <group userData={{ foregroundOutline: category }}>{children}</group>;
}
/** Runs inside the world portal, before the fisheye cube capture. Geometry outlines
 * survive every presentation/filter mode and cannot select untagged scenery.
 */
export function ForegroundOutlines() {
  const [manager] = useState(() => new ForegroundOutlineManager());
  const skin = useBobSkin();
  useFrame(({ scene }) => {
    const state = useCoreStore.getState();
    const theme = state.previewMode === "theme" ? state.themes.find(theme => theme.preview) : state.currentTheme;
    const color = theme?.outlineColor ?? "#000000";
    manager.sync(scene, state.graphicPreferences.outlines, { counter: color, bob: skin.outline, foreground: color });
  }, -1.3);
  useEffect(() => () => manager.dispose(), [manager]);
  return null;
}
