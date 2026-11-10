import { useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { DoubleSide, Group, MathUtils } from "three";
import { useAppStore, useBooksStore, useViewStore } from "@/store";
import { ABOUT_WINDOW } from "@/store/config/aboutRoom";
import { useAboutWindowStore } from "@/store/aboutWindow";
import { useCursorStore } from "@/store/core/cursor";
import { useVinylStore } from "@/store/vinyls";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { BlenderRoomPart } from "./BlenderRoomPart";
import { AboutWindowGlass } from "./AboutWeather";

/** The bottom hinge stays fixed while the top of the right sash tilts into the room. */
export function AboutWindow() {
  const open = useAboutWindowStore(state => state.open);
  const sash = useRef<Group>(null);
  const initialRotation = useRef<[number, number, number]>([0, 0, open ? ABOUT_WINDOW.openAngle : 0]);
  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  const available = () => !useAppStore.getState().showOptions && !useViewStore.getState().isTransitioning &&
    !useViewStore.getState().isPhoneView() && useVinylStore.getState().selected === null && !useBooksStore.getState().focusedBook;
  const clear = () => { setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); };
  useEffect(() => clear, [setHoveredObject]);
  useFrame((_, delta) => {
    if (sash.current) sash.current.rotation.z = MathUtils.damp(sash.current.rotation.z, open ? ABOUT_WINDOW.openAngle : 0, 18, delta);
  });
  const hover = (event: ThreeEvent<PointerEvent>) => {
    if (!available()) return;
    event.stopPropagation();
    useCursorStore.getState().setHoveringClickable(true);
    setHoveredObject({ title: locale === "de" ? (open ? "Fenster schließen" : "Fenster öffnen") : (open ? "Close window" : "Open window") });
  };
  return <>
    <BlenderRoomPart name="WindowFixed" />
    <group position={ABOUT_WINDOW.fixedCenter} rotation={[0, -Math.PI / 2, 0]}>
      <AboutWindowGlass />
    </group>
    <group ref={sash} name="about-operable-window" position={ABOUT_WINDOW.hinge} rotation={initialRotation.current}
      onPointerMove={hover} onPointerLeave={clear} onClick={event => {
        if (!available() || event.delta > 5) return;
        event.stopPropagation(); clear(); useAboutWindowStore.getState().toggle();
      }}>
      <BlenderRoomPart name="WindowSash" local />
      <group position={[0, 1.45, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <AboutWindowGlass />
        <mesh name="window-toggle-surface"><planeGeometry args={ABOUT_WINDOW.glassSize} />
          <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  </>;
}
