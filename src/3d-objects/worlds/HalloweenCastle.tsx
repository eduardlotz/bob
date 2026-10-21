import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part } from "./InstancedModels";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { FireFlames } from "./Fireplace";
import { useWorldEnvironment } from "./WorldEnvironment";

function arch(width: number, height: number) {
  const shape = new T.Shape();
  shape.moveTo(-width, 0); shape.lineTo(width, 0);
  shape.lineTo(width, height - width);
  shape.absarc(0, height - width, width, 0, Math.PI, false);
  shape.lineTo(-width, 0); shape.closePath();
  return shape;
}

function castleGeometry() {
  const parts: Part[] = [[new T.BoxGeometry(82, 44, 6), "#14121b", [0, 22, -3]]];
  for (const side of [-1, 1]) {
    parts.push([new T.CylinderGeometry(5.4, 6.5, 50, 8), "#18151f", [side * 32, 25, 1]]);
    parts.push([new T.ConeGeometry(7, 15, 8), "#100f17", [side * 32, 56, 1]]);
    for (const x of [12.5, 23]) {
      parts.push([new T.BoxGeometry(2.6, 37, 3), "#1b1723", [side * x, 18.5, 1]]);
      parts.push([new T.BoxGeometry(3.3, 1.2, 3.7), "#211b29", [side * x, 2.5, 1.15]]);
    }
  }
  for (let x = -38; x <= 38; x += 5.5) parts.push([new T.BoxGeometry(3, 3.2, 6.4), "#14121b", [x, 45, -3]]);
  return assemble(parts);
}

function doorGeometry() {
  const parts: Part[] = [[new T.ShapeGeometry(arch(5.8, 19.25), 16), "#6b565a", [0, .35, .22]]];
  for (let i = -5; i <= 5; i++) {
    const x = i * 1.02;
    const height = 13.45 + Math.sqrt(5.8 ** 2 - x ** 2);
    parts.push([new T.BoxGeometry(.045, height - .1, .04), "#3c2b33", [x, .35 + height / 2, .27]]);
  }
  for (const side of [-1, 1]) {
    for (const y of [3.2, 8.5, 13.6]) parts.push([new T.BoxGeometry(4.9, .32, .14), "#100f17", [side * 2.95, y, .37]]);
    parts.push([new T.TorusGeometry(.38, .075, 5, 12), "#9d6c3b", [side * .8, 5.1, .5]]);
    parts.push([new T.BoxGeometry(.3, .52, .15), "#69472f", [side * .8, 5.48, .43]]);
  }
  return assemble(parts);
}

function WallTorch({ side }: { side: number }) {
  const environment = useWorldEnvironment();
  const light = useRef<T.PointLight>(null);
  useFrame(() => {
    if (!light.current) return;
    const { elapsed, daylight } = environment.current;
    light.current.intensity = (1 - daylight) * (36 + Math.sin(elapsed * 6 + side) * 3);
  });
  return <group position={[side * 8.3, 3.4, -15.8]} name="castle-wall-torch">
    <mesh position={[0, -.45, -.2]} rotation={[.2, 0, 0]}><cylinderGeometry args={[.16, .22, 1.7, 6]} /><WorldToonMaterial color="#35232b" /></mesh>
    <mesh position={[0, .3, 0]}><coneGeometry args={[.58, .55, 7, 1, true]} /><WorldToonMaterial color="#342c31" side={T.DoubleSide} /></mesh>
    <mesh position={[0, -.7, -.65]} rotation={[.6, 0, 0]}><boxGeometry args={[.25, .25, 1.8]} /><WorldToonMaterial color="#211d26" /></mesh>
    <group position={[0, .2, 0]} scale={1.8}><FireFlames /></group>
    <pointLight ref={light} position={[0, 1, 1.1]} color="#ff9b46" intensity={0} distance={18} decay={2} castShadow={false} />
  </group>;
}

/** The complete silhouette sits behind the grove, leaving room around its towers. */
export function HalloweenCastle() {
  const geometry = useMemo(castleGeometry, []);
  const door = useMemo(doorGeometry, []);
  const frame = useMemo(() => new T.ShapeGeometry(arch(7, 21), 20), []);
  const paintedFrame = useMemo(() => new T.ShapeGeometry(arch(6.2, 20), 20), []);
  useEffect(() => () => { geometry.dispose(); door.dispose(); frame.dispose(); paintedFrame.dispose(); }, [geometry, door, frame, paintedFrame]);
  return <group name="halloween-castle" scale={.5} position={[0, -.68, -28]}>
    <group position={[0, -1.36, -18]}>
      <mesh geometry={geometry}><WorldToonMaterial vertexColors fog={false} /></mesh>
      <mesh geometry={frame} position={[0, 0, .08]}><WorldToonMaterial color="#0e0d15" fog={false} /></mesh>
      <mesh geometry={paintedFrame} position={[0, .12, .12]} name="castle-painted-doorframe"><meshBasicMaterial color="#685661" fog={false} /></mesh>
      <mesh geometry={door} name="castle-massive-double-door"><meshBasicMaterial vertexColors fog={false} /></mesh>
      <mesh position={[0, 8.3, .3]}><boxGeometry args={[.075, 16.3, .04]} /><meshBasicMaterial color="#2e232f" fog={false} /></mesh>
      <mesh position={[0, .12, 1.2]}><boxGeometry args={[15, .24, 3.5]} /><WorldToonMaterial color="#3b303b" /></mesh>
    </group>
    <WallTorch side={-1} /><WallTorch side={1} />
  </group>;
}
