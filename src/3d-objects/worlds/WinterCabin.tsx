import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part } from "./InstancedModels";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { NightGlowMaterial } from "./WorldNightGlow";
import { useWorldEnvironment } from "./WorldEnvironment";

// Keep this footprint clear when arranging the winter trees.
export const WINTER_CABIN_POSITION: [number, number, number] = [5.7, -1.36, -14];

function cabinGeometry() {
  const parts: Part[] = [];
  for (let row = 0; row < 11; row++) {
    const y = .22 + row * .3;
    for (const side of [-1, 1]) {
      parts.push([new T.CylinderGeometry(.19, .19, 5.9, 7), row % 2 ? "#886044" : "#76503b", [0, y, side * 2.2], [1, 1, 1], [0, 0, Math.PI / 2]]);
      parts.push([new T.CylinderGeometry(.19, .19, 4.85, 7), row % 2 ? "#79563f" : "#684631", [side * 2.65, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0]]);
    }
  }
  const gable = new T.Shape();
  gable.moveTo(-3.25, 3.25); gable.lineTo(3.25, 3.25); gable.lineTo(0, 5.6); gable.closePath();
  parts.push([new T.ExtrudeGeometry(gable, { depth: 5.3, bevelEnabled: false }), "#805b43", [0, 0, -2.65]]);
  const slope = Math.atan2(2.35, 3.25);
  for (const side of [-1, 1]) {
    parts.push([new T.BoxGeometry(4.17, .2, 5.65), "#f0f8ff", [side * 1.625, 4.53, 0], [1, 1, 1], [0, 0, -side * slope]]);
    parts.push([new T.BoxGeometry(4.2, .19, .18), "#49352c", [side * 1.625, 4.37, 2.82], [1, 1, 1], [0, 0, -side * slope]]);
  }
  parts.push([new T.BoxGeometry(1.25, 2.45, .14), "#44322b", [-1.02, 1.3, 2.42]]);
  for (let i = 0; i < 4; i++) parts.push([new T.BoxGeometry(.025, 2.3, .035), "#6a4d36", [-1.47 + i * .3, 1.3, 2.51]]);
  parts.push([new T.SphereGeometry(.065, 6, 4), "#b18e50", [-.62, 1.3, 2.56]]);
  parts.push([new T.BoxGeometry(2, .2, 1.2), "#86674e", [-1, .1, 2.9]]);
  parts.push([new T.BoxGeometry(2.15, .1, 1.3), "#e3eff7", [-1, .23, 2.9]]);
  // A high window stays visible above the counter in the home camera.
  for (const side of [-1, 1]) {
    parts.push([new T.BoxGeometry(.13, 1.48, .2), "#443028", [side * .83, 4.22, 2.8]]);
    parts.push([new T.BoxGeometry(1.8, .13, .2), "#443028", [0, 4.22 + side * .675, 2.8]]);
  }
  parts.push([new T.BoxGeometry(.07, 1.27, .12), "#51392b", [0, 4.22, 2.91]]);
  parts.push([new T.BoxGeometry(1.55, .07, .12), "#51392b", [0, 4.22, 2.91]]);
  parts.push([new T.BoxGeometry(1.95, .1, .4), "#e9f4fc", [0, 3.5, 2.85]]);
  return assemble(parts);
}

export function WinterCabin() {
  const geometry = useMemo(cabinGeometry, []);
  const light = useRef<T.PointLight>(null);
  const environment = useWorldEnvironment();
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (light.current) light.current.intensity = (1 - environment.current.daylight) * 2.4;
  });
  return <group position={WINTER_CABIN_POSITION} rotation={[0, -.16, 0]} name="winter-wooden-cabin">
    <mesh geometry={geometry}><WorldToonMaterial vertexColors /></mesh>
    <mesh position={[0, 4.22, 2.78]} name="cabin-warm-window">
      <planeGeometry args={[1.55, 1.27]} /><NightGlowMaterial color="#edb266" nightIntensity={.65} />
    </mesh>
    <pointLight ref={light} position={[0, 4.22, 3.7]} color="#ffc37a" intensity={0} distance={8} decay={2} castShadow={false} />
  </group>;
}
