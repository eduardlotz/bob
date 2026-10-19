import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type Material } from "three";
import { useBobEditor } from "@/store/bobEditor";
import { useCoreStore, useViewStore } from "@/store";
import { getSelectedBlobForm, getBlobFormType, getBlobFormHalfSize } from "@/types/blobForms";
import { getBobEditorFraming } from "@/store/config/bobEditorFraming";

/** Camera framing shares the entry pose; presentation settles without a jump. */
export function BobEditorScene() {
  const { size } = useThree();
  const currentView = useViewStore(state => state.currentView);
  const controlsRef = useViewStore(state => state.cameraControlsRef);
  const tool = useBobEditor(state => state.dragging);
  const fisheye = useCoreStore(state => state.graphicPreferences.fisheyeEnabled);
  const forms = useCoreStore(state => state.blobForms);
  const draft = useBobEditor(state => state.draft);
  const selected = getSelectedBlobForm(forms);
  const halfSize = getBlobFormHalfSize(getBlobFormType(selected.id), draft?.id === selected.id ? draft.parameters : selected.parameters);
  const bodyKey = halfSize.join(",");
  const mobile = size.width <= 1000 || size.height <= 600;
  const previous = useRef({ currentView, tool, width: size.width, height: size.height, fisheye, bodyKey });

  useEffect(() => {
    const before = previous.current;
    previous.current = { currentView, tool, width: size.width, height: size.height, fisheye, bodyKey };
    // The view store owns entry. Only a tool or viewport change adjusts it here.
    if (currentView !== "phone:bob" || before.currentView !== "phone:bob") return;
    if (before.tool === tool && before.width === size.width && before.height === size.height && before.fisheye === fisheye && before.bodyKey === bodyKey) return;
    const framing = getBobEditorFraming(size.width, size.height, mobile, fisheye, tool, halfSize);
    controlsRef?.current?.setLookAt(...framing.position, ...framing.target, !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [currentView, tool, size.width, size.height, fisheye, mobile, controlsRef, bodyKey]);

  useFrame((_, delta) => {
    const target = currentView === "phone:bob" ? getBobEditorFraming(size.width, size.height, mobile, fisheye).offset : { x: 0, y: 0 };
    const offset = useBobEditor.getState().screenOffset;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const settle = (value: number, goal: number) => reduced || Math.abs(value - goal) < 0.1 ? goal : MathUtils.damp(value, goal, 18, Math.min(delta, 0.05));
    const x = settle(offset.x, target.x), y = settle(offset.y, target.y);
    if (x !== offset.x || y !== offset.y) useBobEditor.setState({ screenOffset: { x, y } });
  });
  return null;
}

/** Fade the counter without unmounting its auto-tap integration. */
export function BobEditorCounterFade({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const opacity = useRef(1);
  useFrame((_, delta) => {
    const fade = !!useBobEditor.getState().dragging;
    if (!fade && opacity.current >= 0.9999) return;
    opacity.current = MathUtils.damp(opacity.current, fade ? 0 : 1, 18, delta);
    if (!group.current) return;
    group.current.visible = opacity.current > 0.005;
    group.current.traverse(object => {
      const material = (object as Mesh).material;
      if (!material) return;
      for (const entry of (Array.isArray(material) ? material : [material]) as Material[]) {
        if (!entry.transparent) { entry.transparent = true; entry.needsUpdate = true; }
        entry.opacity = opacity.current;
      }
    });
  });
  return <group ref={group}>{children}</group>;
}

