import { useMemo } from "react";
import { CatmullRomCurve3, DoubleSide, Shape, Vector3 } from "three";
import { CloudSky } from "@/3d-objects/worlds/CloudSky";
import { LIBRARY_ARC, LIBRARY_FLOOR_Y } from "@/store/config/library";

export function Stone({ color = "#a9afac" }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.94} metalness={0} />;
}

/** Static ivy joins the scenery batches, including its stems and two-sided leaves. */
function ClimbingVine({ angle, length, seed }: { angle: number; length: number; seed: number }) {
  const { curve, leaves, leaf } = useMemo(() => {
    const points = Array.from({ length: 17 }, (_, index) => {
      const t = index / 16;
      return new Vector3(Math.sin(t * 8 + seed) * 0.11, -t * length, 0.1 + Math.sin(t * 5 + seed) * 0.035);
    });
    const curve = new CatmullRomCurve3(points);
    const leaf = new Shape();
    leaf.moveTo(0, 0);
    leaf.bezierCurveTo(-0.12, 0.025, -0.14, 0.17, 0, 0.29);
    leaf.bezierCurveTo(0.14, 0.17, 0.12, 0.025, 0, 0);
    const leaves = Array.from({ length: Math.ceil(length * 10) }, (_, index) => {
      const t = (index + 0.5) / Math.ceil(length * 10);
      const side = index % 2 ? 1 : -1;
      const position = curve.getPoint(t);
      position.x += side * 0.045;
      position.z += 0.025;
      return { position, angle: side * (0.65 + Math.sin(index + seed) * 0.28),
        scale: 0.65 + (Math.sin(index * 2.3 + seed) + 1) * 0.22,
        color: ["#426347", "#56764f", "#66835b", "#3e5d43"][index % 4] };
    });
    return { curve, leaves, leaf };
  }, [length, seed]);
  const radius = LIBRARY_ARC.wallInnerRadius - 0.42;
  return <group position={[Math.sin(angle) * radius, 3.13, -Math.cos(angle) * radius]} rotation={[0, -angle, 0]}>
    <mesh castShadow><tubeGeometry args={[curve, 32, 0.018, 5, false]} /><meshStandardMaterial color="#526143" roughness={1} /></mesh>
    {leaves.map((entry, index) => <mesh key={index} position={entry.position} rotation={[0.15 * Math.sin(index), 0.3 * Math.cos(index + seed), entry.angle]} scale={entry.scale} castShadow receiveShadow>
      <shapeGeometry args={[leaf, 5]} /><meshStandardMaterial color={entry.color} roughness={0.86} side={DoubleSide} />
    </mesh>)}
  </group>;
}

/** Solid annular sections, including their end caps; the opening faces +Z. */
function StoneArc({ inner, outer, top, height, start = -Math.PI / 2, end = Math.PI / 2, color }: {
  inner: number; outer: number; top: number; height: number; start?: number; end?: number; color?: string;
}) {
  const shape = useMemo(() => {
    const shape = new Shape();
    const from = start - Math.PI / 2, to = end - Math.PI / 2;
    shape.moveTo(Math.cos(from) * outer, Math.sin(from) * outer);
    shape.absarc(0, 0, outer, from, to, false);
    if (inner > 0) {
      shape.lineTo(Math.cos(to) * inner, Math.sin(to) * inner);
      shape.absarc(0, 0, inner, to, from, true);
    } else shape.lineTo(0, 0);
    shape.closePath();
    return shape;
  }, [inner, outer, start, end]);
  return <mesh position={[0, top, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
    <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false, curveSegments: 48 }]} />
    <Stone color={color} />
  </mesh>;
}

function Column({ angle }: { angle: number }) {
  const radius = LIBRARY_ARC.wallInnerRadius - 0.18;
  return <group position={[Math.sin(angle) * radius, -2.04, -Math.cos(angle) * radius]} rotation={[0, -angle, 0]}>
    <mesh position={[0, 0.13, 0]} castShadow receiveShadow><boxGeometry args={[0.55, 0.26, 0.55]} /><Stone /></mesh>
    <mesh position={[0, 2.56, 0]} castShadow receiveShadow><cylinderGeometry args={[0.17, 0.22, 4.6, 12]} /><Stone color="#b9bfbc" /></mesh>
    <mesh position={[0, 4.94, 0]} castShadow receiveShadow><boxGeometry args={[0.55, 0.2, 0.55]} /><Stone /></mesh>
  </group>;
}

/** A semicircular colonnade: no rear wall, rear roof, or moving camera obstruction. */
export function LibraryRoom() {
  const { wallInnerRadius: inner, wallOuterRadius: outer } = LIBRARY_ARC;
  return <group>
    <StoneArc inner={0} outer={6.15} top={LIBRARY_FLOOR_Y} height={0.2} color="#929c99" />
    {/* Broad, quiet stone tiles follow the room's arc instead of a square grid. */}
    {[0, 1, 2, 3].flatMap(ring => {
      const count = 6 + ring * 4;
      return Array.from({ length: count }, (_, index) => <StoneArc key={`${ring}-${index}`}
        inner={ring * 1.52 + 0.012} outer={(ring + 1) * 1.52 - 0.012}
        start={-Math.PI / 2 + index / count * Math.PI + 0.002}
        end={-Math.PI / 2 + (index + 1) / count * Math.PI - 0.002}
        top={LIBRARY_FLOOR_Y + 0.02} height={0.02} color={(ring + index) % 4 ? "#aeb6b2" : "#a4ada9"} />);
    })}
    {/* A shallow apron under the overview, with the space behind the camera open. */}
    <mesh position={[0, LIBRARY_FLOOR_Y - 0.1, 0.98]} receiveShadow><boxGeometry args={[12.3, 0.2, 1.96]} /><Stone color="#aeb6b2" /></mesh>
    <StoneArc inner={inner} outer={outer} top={3} height={5.05} />
    <StoneArc inner={inner - 0.16} outer={outer + 0.04} top={-1.66} height={0.38} color="#929d99" />
    <StoneArc inner={inner - 0.2} outer={outer + 0.15} top={3.2} height={0.28} color="#c3c9c5" />
    {[-90, -45, 0, 45, 90].map(degrees => <Column key={degrees} angle={degrees * Math.PI / 180} />)}
    {[[-87, 3.65], [-49, 2.15], [-42, 1.1], [-5, 1.5], [3, 0.85], [43, 2.7], [49, 1.3], [87, 4.15]].map(([degrees, length], index) =>
      <ClimbingVine key={degrees} angle={degrees * Math.PI / 180} length={length} seed={index * 1.7} />)}
    <group position={[0, -2.02, 0.35]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 0.16, 0.72]} /><Stone color="#c3c9c5" /></mesh>
      {[-0.8, 0.8].map(x => <mesh key={x} position={[x, 0.26, 0]} castShadow receiveShadow><boxGeometry args={[0.22, 0.52, 0.58]} /><Stone /></mesh>)}
    </group>
  </group>;
}

export function LibraryDaylight() {
  return <>
    <CloudSky climate="city" colors={["#93afc7", "#c5d4df", "#e7eceb"]} stops={[0, 0.48, 1]} sunDirection={[-0.4, 1, 0.6]} />
    <hemisphereLight args={["#eef3f6", "#8b9289", 1.15]} />
    <directionalLight position={[-4, 10, 6]} color="#fffefa" intensity={1.65} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8}
      shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={0.025} shadow-radius={4} />
  </>;
}
