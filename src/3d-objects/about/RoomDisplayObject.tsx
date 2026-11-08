import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Euler, Group, Quaternion, Vector3 } from "three";
import { useCoreStore, useViewStore } from "@/store";
import { useVinylStore } from "@/store/vinyls";
import { useCursorStore } from "@/store/core/cursor";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";
import { getSceneLensRadius } from "@/utils/sceneLensFraming";
import { libraryBookFlightProgress } from "../books/libraryFocus";
import { useSocialCorner } from "./useSocialCorner";

export function RoomDisplayObject({ id, title, position, rotation = [0, 0, 0], width, height, children }: {
  id: string; title: string; position: [number, number, number]; rotation?: [number, number, number];
  width: number; height: number; children: (focused: boolean) => React.ReactNode;
}) {
  const selected = useVinylStore(state => state.selected);
  const currentView = useViewStore(state => state.currentView);
  const isSelected = selected === id;
  const fisheye = useCoreStore(state => state.graphicPreferences.fisheyeEnabled);
  const size = useThree(state => state.size);
  const { locale } = useI18n();
  const { setHoveredObject } = useFloatingBar();
  const enterCorner = useSocialCorner();
  const ref = useRef<Group>(null!);
  const home = useMemo(() => new Vector3(...position), [position[0], position[1], position[2]]);
  const homeRotation = useMemo(() => new Quaternion().setFromEuler(new Euler(...rotation)), [rotation[0], rotation[1], rotation[2]]);
  const motion = useMemo(() => ({ from: home.clone(), fromRotation: new Quaternion(), fromScale: 1,
    target: new Vector3(), rotation: new Quaternion(), cameraRotation: new Quaternion(), euler: new Euler(),
    elapsed: 1, yaw: -0.12, pitch: -0.05, spin: 0 }), [home]);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const didDrag = useRef(false);
  useLayoutEffect(() => {
    if (!ref.current) return;
    motion.from.copy(ref.current.position); motion.fromRotation.copy(ref.current.quaternion);
    motion.fromScale = ref.current.scale.x; motion.elapsed = 0;
    if (isSelected) { motion.yaw = -0.12; motion.pitch = -0.05; motion.spin = 0; }
    drag.current = null; didDrag.current = false;
  }, [isSelected, motion]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!drag.current) return;
      const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) { drag.current.moved = true; didDrag.current = true; }
      motion.yaw += dx * 0.009; motion.pitch = Math.max(-1.2, Math.min(1.2, motion.pitch + dy * 0.009));
      drag.current.x = event.clientX; drag.current.y = event.clientY;
    };
    const up = () => { drag.current = null; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [motion]);
  useFrame(({ camera }, dt) => {
    if (!ref.current) return;
    motion.elapsed += Math.min(dt, 0.1);
    const t = libraryBookFlightProgress(motion.elapsed);
    let scale = 1;
    motion.target.copy(home); motion.rotation.copy(homeRotation);
    if (isSelected) {
      const distance = 0.72;
      const lens = fisheye ? getSceneLensRadius(size.width, size.height) : undefined;
      const halfWidth = lens ? distance * size.width / lens : distance / camera.projectionMatrix.elements[0];
      const halfHeight = lens ? distance * size.height / lens : distance / camera.projectionMatrix.elements[5];
      motion.target.set(0, 0, -distance);
      camera.updateWorldMatrix(true, false);
      motion.target.applyMatrix4(camera.matrixWorld); camera.getWorldQuaternion(motion.cameraRotation);
      if (!drag.current) motion.spin += dt * 0.12;
      motion.euler.set(motion.pitch, motion.yaw + motion.spin, -0.025);
      motion.rotation.setFromEuler(motion.euler).premultiply(motion.cameraRotation);
      scale = Math.min(halfHeight * 1.5 / height, halfWidth * 1.5 / width);
    }
    ref.current.position.lerpVectors(motion.from, motion.target, t);
    ref.current.quaternion.slerpQuaternions(motion.fromRotation, motion.rotation, t);
    ref.current.scale.setScalar(motion.fromScale + (scale - motion.fromScale) * t);
  }, -1.5);
  const leave = () => { setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); };
  const hover = (event: ThreeEvent<PointerEvent>) => {
    if (selected) return;
    event.stopPropagation(); useCursorStore.getState().setHoveringClickable(true);
    setHoveredObject({ title: currentView === "socials" ? title : viewControlsMessages[locale].viewTitles.socials });
  };
  return <group ref={ref} position={home}
    onPointerEnter={hover} onPointerMove={hover} onPointerLeave={leave}
    onPointerDown={event => {
      if (!isSelected) return;
      event.stopPropagation(); didDrag.current = false;
      (event.target as Element).setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY, moved: false };
    }}
    onClick={event => {
      event.stopPropagation();
      if (event.delta > 5 || didDrag.current) { didDrag.current = false; return; }
      leave();
      if (isSelected) { useVinylStore.getState().select(null); return; }
      if (selected || !enterCorner()) return;
      useVinylStore.getState().select(id);
    }}>
    {children(isSelected)}
  </group>;
}
