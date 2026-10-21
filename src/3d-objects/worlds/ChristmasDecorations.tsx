import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as T from "three";
import type { Placement, Vec3 } from "./InstancedModels";
import { NightGlowMaterial } from "./WorldNightGlow";
import { WorldToonMaterial } from "./WorldToonMaterial";

function starGeometry() {
  const shape = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 ? .19 : .43;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: false });
  geometry.translate(0, 0, -.06);
  return geometry;
}

function GlowingInstances({ build, placements, color, phase = 0, blink = false, name }: { build: () => T.BufferGeometry; placements: Placement[]; color: string; phase?: number; blink?: boolean; name: string }) {
  const geometry = useMemo(build, [build]);
  const mesh = useRef<T.InstancedMesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new T.Object3D();
    placements.forEach((p, i) => {
      dummy.position.set(...p.position); dummy.scale.set(...p.scale); dummy.rotation.set(...(p.rotation ?? [0, 0, 0])); dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [placements, geometry]);
  return <instancedMesh key={placements.length} ref={mesh} args={[geometry, undefined, placements.length]} name={name}><NightGlowMaterial color={color} phase={phase} blink={blink} /></instancedMesh>;
}
const bulbGeometry = () => new T.SphereGeometry(.075, 6, 4);

export function ChristmasDecorations({ trees, bushes }: { trees: Placement[]; bushes: Placement[] }) {
  const decorations = useMemo(() => {
    const lights: Placement[][] = [[], [], [], []];
    const stars: Placement[] = [];
    const transform = new T.Object3D();
    const point = new T.Vector3();
    const add = (p: Placement, local: Vec3, size: number): Placement => {
      transform.position.set(...p.position); transform.rotation.set(...(p.rotation ?? [0, 0, 0])); transform.scale.set(...p.scale); transform.updateMatrix();
      point.set(...local).applyMatrix4(transform.matrix);
      return { position: point.toArray() as Vec3, scale: [p.scale[0] * size, p.scale[1] * size, p.scale[2] * size], rotation: p.rotation };
    };
    trees.forEach((p, tree) => {
      stars.push(add(p, [0, 4.55, 0], 1));
      for (let tier = 0; tier < 4; tier++) {
        const radius = 1.3 - tier * .26;
        for (let j = 0; j < 10 - tier; j++) {
          const angle = j / (10 - tier) * Math.PI * 2 + tier * .55;
          lights[(j + tier + tree) % 4].push(add(p, [Math.cos(angle) * radius * .94, .66 + tier * .67, Math.sin(angle) * radius * .94], 1));
        }
      }
    });
    bushes.forEach((p, bush) => {
      for (let j = 0; j < 12; j++) {
        const angle = j / 12 * Math.PI * 2;
        lights[(j + bush) % 4].push(add(p, [Math.cos(angle) * .89, .49 + .15 * Math.sin(angle * 2), Math.sin(angle) * .72], .95));
      }
    });
    return { lights, stars };
  }, [trees, bushes]);
  return <group name="christmas-decorations">
    <GlowingInstances build={starGeometry} placements={decorations.stars} color="#ffca45" name="christmas-stars" />
    {["#ff494e", "#4de895", "#53aaff", "#ffd44d"].map((color, i) => <GlowingInstances key={color} build={bulbGeometry} placements={decorations.lights[i]} color={color} phase={i * 1.6} blink name={`christmas-lights-${i}`} />)}
  </group>;
}

export function WinterSnowmen() {
  const placements: { position: Vec3; scale: number; rotation: number; threeBalls: boolean }[] = [
    { position: [-2.2, -1.36, 1.8], scale: 1.05, rotation: .25, threeBalls: false },
    { position: [6.6, -1.36, -3], scale: 1.25, rotation: -.45, threeBalls: true },
    { position: [-9, -1.36, -7], scale: 1, rotation: .35, threeBalls: true },
    { position: [10.2, -1.36, -11], scale: 1.35, rotation: -.65, threeBalls: false },
    { position: [-8.4, -1.36, 4], scale: 1.1, rotation: 1.1, threeBalls: false },
  ];
  return <group name="winter-snowmen">{placements.map(({ position, scale, rotation, threeBalls }, i) =>
    <group key={i} position={position} scale={scale} rotation={[0, rotation, 0]}>
      <Snowman threeBalls={threeBalls} />
    </group>
  )}</group>;
}

function Snowman({ threeBalls }: { threeBalls: boolean }) {
  const headY = threeBalls ? 1.88 : 1.12;
  const armY = threeBalls ? 1.28 : .63;
  const balls = threeBalls ? [[.55, .55], [1.3, .4], [headY, .28]] : [[.48, .48], [headY, .28]];
  return <group name={threeBalls ? "snowman-three-spheres" : "snowman-two-spheres"}>
    {balls.map(([y, radius], i) => <mesh key={i} position={[0, y, 0]}>
      <sphereGeometry args={[radius, 12, 8]} /><WorldToonMaterial color={i % 2 ? "#ffffff" : "#f3fbff"} />
    </mesh>)}
    <group position={[0, headY, 0]}>
      {[-.1, .1].map(x => <mesh key={x} position={[x, .035, .258]}>
        <sphereGeometry args={[.035, 6, 4]} /><WorldToonMaterial color="#343c43" />
      </mesh>)}
      <mesh position={[0, 0, .35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[.055, .25, 7]} /><WorldToonMaterial color="#ff913b" />
      </mesh>
      <mesh position={[0, .255, 0]}><cylinderGeometry args={[.33, .33, .045, 12]} /><WorldToonMaterial color="#455766" /></mesh>
      <mesh position={[0, .38, 0]}><cylinderGeometry args={[.18, .19, .23, 10]} /><WorldToonMaterial color="#455766" /></mesh>
      <mesh position={[0, -.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[.27, .05, 5, 12]} /><WorldToonMaterial color="#bc5b4c" />
      </mesh>
      <mesh position={[.18, -.39, .3]} rotation={[0, 0, -.2]}>
        <boxGeometry args={[.1, .3, .065]} /><WorldToonMaterial color="#bc5b4c" />
      </mesh>
    </group>
    {[0, 1].map(i => <mesh key={i} position={[0, armY - i * .18, threeBalls ? .39 : .46]}>
      <sphereGeometry args={[.035, 6, 4]} /><WorldToonMaterial color="#354350" />
    </mesh>)}
    {[-1, 1].map(side => <mesh key={side} position={[side * .64, armY, 0]} rotation={[0, 0, side * -1]}>
      <cylinderGeometry args={[.025, .035, .6, 5]} /><WorldToonMaterial color="#71533d" />
    </mesh>)}
  </group>;
}
