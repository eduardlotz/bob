import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as T from 'three';
import { GrassField, type GrassExclusion } from '@/3d-objects/worlds/DenseGrassField';
import { StylizedTrees, StylizedBushes } from '@/3d-objects/worlds/StylizedVegetation';
import type { Placement } from '@/3d-objects/worlds/InstancedModels';
import { EnvironmentAudio } from '@/3d-objects/worlds/EnvironmentAudio';
import { useWorldEnvironment } from '@/3d-objects/worlds/WorldEnvironment';
import { waveTexture, waterVertex, waterFragment } from '@/3d-objects/worlds/waterSurface';
import { useCoreStore } from '@/store';
import type { EnvironmentAudioConfig } from '@/types/worldEnvironment';
import { COURSE_Y, TILE_SIZE, goalPosition, type Course, type Pond } from './courses';
import { CloudSky } from '@/3d-objects/worlds/CloudSky';
import { ModelInstances, assemble, type Part } from '@/3d-objects/worlds/InstancedModels';
import { GolfNeighborhood } from './GolfNeighborhood';
const audio: EnvironmentAudioConfig = { layers: [
  { soundId: 'ambience-garden', volume: .25, mode: 'loop' },
  { soundId: 'ambience-forest-wind', volume: .15, mode: 'loop' },
  { soundId: 'ambience-bird', volume: .25, mode: 'random', intervalSeconds: [12, 24], excerpts: [{ startSeconds: 4, durationSeconds: 5, fadeInSeconds: .5, fadeOutSeconds: 1 }] },
] };
function GolfPond({ pond }: { pond: Pond }) {
  const environment = useWorldEnvironment();
  const material = useRef<T.ShaderMaterial>(null);
  const waves = useMemo(waveTexture, []);
  const geometry = useMemo(() => {
    const geometry = new T.PlaneGeometry(pond.width * TILE_SIZE, pond.depth * TILE_SIZE, 12, 10);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, [pond.width, pond.depth]);
  const uniforms = useMemo(() => ({ ...T.UniformsUtils.clone(T.UniformsLib.fog), uWaves: { value: waves }, uTime: { value: 0 }, uDay: { value: 1 } }), [waves]);
  useEffect(() => () => { waves.dispose(); geometry.dispose(); }, [waves, geometry]);
  useFrame(() => { if (material.current) material.current.uniforms.uTime.value = environment.current.elapsed; });
  return <group position={[pond.x * TILE_SIZE, COURSE_Y - .12, pond.z * TILE_SIZE]}>
    <mesh geometry={geometry}><shaderMaterial ref={material} uniforms={uniforms} vertexShader={waterVertex} fragmentShader={waterFragment} fog /></mesh>
    <mesh position={[0, -.13, 0]}><boxGeometry args={[pond.width * TILE_SIZE + .12, .16, pond.depth * TILE_SIZE + .12]} /><meshToonMaterial color="#b8b39a" /></mesh>
  </group>;
}
export function GolfGarden({ course }: { course: Course }) {
  const authorized = useCoreStore(s => s.isReady);
  const exclusions = useMemo<GrassExclusion[]>(() => [
    { center: [goalPosition(course)[0], goalPosition(course)[2] - 2.5] as [number, number], size: [2.8, 1] as [number, number] },
    ...course.tiles.map(tile => ({ center: [tile.x * TILE_SIZE, tile.z * TILE_SIZE] as [number, number], size: [TILE_SIZE + .12, TILE_SIZE + .12] as [number, number] })),
    ...course.ponds.map(p => ({ center: [p.x * TILE_SIZE, p.z * TILE_SIZE] as [number, number], size: [p.width * TILE_SIZE + .2, p.depth * TILE_SIZE + .2] as [number, number] })),
  ], [course]);
  const trees = useMemo<Placement[]>(() => [
    ...[-1, 1].flatMap(side => [-1, -5.5, -10, -14].map((z, i): Placement => ({
      position: [side * (5.7 + (i % 2) * .5), -1.5, z + (side > 0 ? .8 : 0)],
      scale: [.55 + i * .11, .65 + i * .12, .55 + i * .11], rotation: [0, i * 1.7 + side, 0],
    }))),
    ...[-6, 2.5, 7].map((x, i): Placement => ({ position: [x, -1.5, -17.5], scale: [1, 1.1 + i * .15, 1], rotation: [0, x, 0] })),
  ], []);
  const bushes = useMemo<Placement[]>(() => [-1, 1].flatMap(side => [-2, -6, -12, -15].map((z, i): Placement => ({
    position: [side * (6.3 - (i % 2) * .4), -1.5, z], scale: [.65 + i * .08, .7 + i * .04, .8], rotation: [0, z, 0],
  }))), []);
  return <group name="golf-garden">
    <CloudSky climate="forest" colors={['#84c5ff', '#c8f3ff', '#dce7ce']} stops={[0, .55, 1]} sunDirection={[-.18, .45, -1]} />
    <GrassField position={[0, -1.5, 0]} radius={28} height={.29} density={.72} exclusions={exclusions} />
    <GolfNeighborhood />
    <ModelInstances name="garden-flower-beds" build={flowerBedGeometry} placements={flowerBeds} toon />
    {course.ponds.map((pond, i) => <GolfPond key={i} pond={pond} />)}
    <StylizedTrees placements={trees} />
    <StylizedBushes placements={bushes} />
    {course.tiles.filter(t => t.rough).map((tile, i) => <GrassField key={i} position={[tile.x * TILE_SIZE, COURSE_Y + (tile.height ?? 0) * TILE_SIZE + .09, tile.z * TILE_SIZE]} size={[1.05, 1.05]} height={.045} density={.7} />)}
    <EnvironmentAudio config={audio} authorized={authorized} />
  </group>;
}

const flowerBeds: Placement[] = [-1, 1].flatMap(side => [-3.2, -8.2, -13.5].map((z, i): Placement => ({
  position: [side * 6.3, -1.5, z], scale: [.7, 1, .7], rotation: [0, i * .4, 0],
})));
function flowerBedGeometry() {
  const parts: Part[] = [[new T.CylinderGeometry(.75, .78, .08, 12), '#66503b', [0, .04, 0], [1, 1, .6]]];
  for (let i = 0; i < 13; i++) {
    const angle = i * 2.4, r = .15 + (i % 3) * .2, height = .22 + (i % 4) * .035;
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r * .55;
    parts.push([new T.CylinderGeometry(.008, .012, height, 4), '#5d823d', [x, height / 2 + .08, z]]);
    const color = ['#e6b862', '#d68d92', '#e7dcc3'][i % 3];
    for (let petal = 0; petal < 5; petal++) {
      const a = petal / 5 * Math.PI * 2;
      parts.push([new T.IcosahedronGeometry(.035, 0), color, [x + Math.cos(a) * .035, height + .08, z + Math.sin(a) * .035], [1, .6, 1]]);
    }
    parts.push([new T.IcosahedronGeometry(.023, 0), '#e3b943', [x, height + .1, z]]);
  }
  return assemble(parts);
}
