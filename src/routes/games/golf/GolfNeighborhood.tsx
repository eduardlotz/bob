import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as T from 'three';
import { assemble, ModelInstances, type Part, type Placement } from '@/3d-objects/worlds/InstancedModels';
import { brownstone } from '@/3d-objects/worlds/CityWorld';
import { cabinGeometry } from '@/3d-objects/worlds/WinterCabin';
import { WorldToonMaterial } from '@/3d-objects/worlds/WorldToonMaterial';
import { BirdFlock } from '@/3d-objects/worlds/BirdFlock';
import { useWorldEnvironment } from '@/3d-objects/worlds/WorldEnvironment';

function fenceGeometry() {
  const parts: Part[] = [];
  for (let i = 0; i < 5; i++) {
    const x = -.8 + i * .4;
    parts.push([new T.BoxGeometry(.16, .78, .075), '#c6b795', [x, .4, 0]]);
    const cap = new T.ConeGeometry(.113, .12, 4); cap.rotateY(Math.PI / 4);
    parts.push([cap, '#e2d4b2', [x, .85, 0]]);
  }
  for (const y of [.25, .6]) parts.push([new T.BoxGeometry(2, .09, .09), '#9d8867', [0, y, -.045]]);
  return assemble(parts);
}
const fencePlacements: Placement[] = [
  ...[-1, 1].flatMap(side => Array.from({ length: 10 }, (_, i): Placement => ({
    position: [side * 7.2, -1.5, 3 - i * 2], scale: [1, 1, 1], rotation: [0, Math.PI / 2, 0],
  }))),
  ...Array.from({ length: 7 }, (_, i): Placement => ({ position: [-6 + i * 2, -1.5, -16], scale: [1, 1, 1] })),
  ...[-1, 1].flatMap(side => Array.from({ length: 5 }, (_, i): Placement => ({ position: [side * (8.2 + i * 2), -1.5, -7], scale: [1, 1, 1] }))),
];
function neighborsGeometry() {
  const parts: Part[] = [];
  // Reuse the city's detailed facades, doors and windows around the garden lots.
  for (const [x, z, yaw, index] of [
    [-11.5, 1, Math.PI / 2, 1], [11.5, -2, -Math.PI / 2, 2],
    [-11.5, -9.5, Math.PI / 2, 3], [11.5, -11, -Math.PI / 2, 0],
    [-4.8, -21, 0, 2], [.7, -21, 0, 1], [6.2, -21, 0, 3],
  ]) brownstone(parts, x, z, yaw, index, 6.4 + index * .3);
  const geometry = assemble(parts);
  // Brownstones start at -1.1 in their original world.
  geometry.translate(0, -.4, 0);
  return geometry;
}
export function GolfNeighborhood() {
  const neighbors = useMemo(neighborsGeometry, []);
  const shed = useMemo(() => cabinGeometry({ roofColor: '#a7644d', porchColor: '#96795a', sillColor: '#c5b08a' }), []);
  const birds = useRef<T.Group>(null), distantBirds = useRef<T.Group>(null);
  const environment = useWorldEnvironment();
  useEffect(() => () => { neighbors.dispose(); shed.dispose(); }, [neighbors, shed]);
  useFrame(() => {
    const t = environment.current.elapsed;
    if (birds.current) {
      const phase = (t * .6) % 42;
      birds.current.position.set(-15 + phase * .8, 3.8 + Math.sin(t * .35) * .35, -12 - Math.sin(t * .1) * 2);
      birds.current.rotation.y = -.2;
    }
    if (distantBirds.current) {
      const phase = (t * .45 + 19) % 42;
      distantBirds.current.position.set(15 - phase * .8, 6 + Math.sin(t * .2) * .4, -23);
      distantBirds.current.rotation.y = Math.PI;
    }
  });
  return <group name="golf-neighborhood">
    <ModelInstances name="garden-picket-fences" build={fenceGeometry} placements={fencePlacements} toon />
    <mesh geometry={neighbors} name="neighbor-houses"><WorldToonMaterial vertexColors /></mesh>
    <mesh geometry={shed} position={[-4.4, -1.5, -11.5]} rotation={[0, .2, 0]} scale={.48} name="garden-shed"><WorldToonMaterial vertexColors /></mesh>
    <BirdFlock ref={birds} count={3} scale={.45} color="#485653" />
    <BirdFlock ref={distantBirds} count={4} scale={.55} />
  </group>;
}
