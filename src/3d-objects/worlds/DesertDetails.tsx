import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import {
  assemble,
  ModelInstances,
  type Part,
  type Placement,
} from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { useWorldEnvironment } from "./WorldEnvironment";

function sandstoneGeometry() {
  return assemble([
    [
      new T.DodecahedronGeometry(1, 0),
      "#b5916b",
      [0, 0.28, 0],
      [0.8, 0.6, 0.6],
    ],
    [
      new T.IcosahedronGeometry(1, 0),
      "#d1b084",
      [0.55, 0.12, 0.15],
      [0.45, 0.3, 0.35],
    ],
  ]);
}
function tumbleweedGeometry() {
  const parts: Part[] = [];
  const random = seededRandom(811);
  for (let i = 0; i < 12; i++) {
    parts.push([
      new T.TorusGeometry(0.5 + random() * 0.08, 0.025, 3, 12),
      i % 2 ? "#9c774e" : "#b28a54",
      [0, 0, 0],
      [1, 0.85 + random() * 0.2, 1],
      [random() * Math.PI, random() * Math.PI, random() * Math.PI],
    ]);
  }
  return assemble(parts);
}
function Tumbleweeds() {
  const quality = useWorldQuality();
  const count = quality === "low" ? 3 : 5;
  const geometry = useMemo(tumbleweedGeometry, []);
  const mesh = useRef<T.InstancedMesh>(null);
  const dummy = useMemo(() => new T.Object3D(), []);
  const environment = useWorldEnvironment();
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    mesh.current?.instanceMatrix.setUsage(T.DynamicDrawUsage);
  }, [count]);
  useFrame(() => {
    if (!mesh.current) return;
    const elapsed = environment.current.elapsed;
    for (let i = 0; i < count; i++) {
      const speed = 0.65 + (i % 3) * 0.18;
      const x = ((elapsed * speed + (i * 56) / count + 12) % 56) - 28;
      const z = -6 - (i % 4) * 3.4;
      const size = 1 + (i % 3) * 0.25;
      dummy.position.set(
        x,
        -1.36 +
          size * 0.55 +
          Math.abs(Math.sin(elapsed * speed * 2 + i)) * 0.09,
        z,
      );
      dummy.rotation.set(
        i * 0.7,
        i,
        (-elapsed * speed) / (size * 0.55),
      );
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      key={count}
      ref={mesh}
      geometry={geometry}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      name="desert-tumbleweeds"
    >
      <WorldToonMaterial vertexColors />
    </instancedMesh>
  );
}

export function DesertDetails() {
  const quality = useWorldQuality();
  const placements = useMemo(() => {
    const random = seededRandom(456);
    const count = quality === "low" ? 24 : 44;
    return Array.from({ length: count }, (): Placement => {
      const angle = random() * Math.PI * 2;
      const radius = 7 + random() * 20;
      const size = 0.4 + random() * 0.9;
      return {
        position: [
          Math.cos(angle) * radius,
          -1.36,
          Math.sin(angle) * radius - 3,
        ],
        rotation: [0, random() * Math.PI * 2, 0],
        scale: [size, size, size],
      };
    }).filter((p) => Math.hypot(p.position[0], p.position[2]) > 6);
  }, [quality]);
  return (
    <>
      <ModelInstances
        build={sandstoneGeometry}
        placements={placements}
        name="desert-rocks"
        toon
      />
      <Tumbleweeds />
      <DesertSnakes />
      <SandstoneArch />
    </>
  );
}

function DesertSnakes() {
  const environment = useWorldEnvironment();
  const quality = useWorldQuality();
  const count = quality === "low" ? 2 : 4;
  const mesh = useRef<T.InstancedMesh>(null);
  const dummy = useMemo(() => new T.Object3D(), []);
  const segments = 21;
  const eyes = useRef<T.InstancedMesh>(null);
  const head = useMemo(() => new T.Vector3(), []);
  const headRotation = useMemo(() => new T.Quaternion(), []);
  const eyeOffset = useMemo(() => new T.Vector3(), []);
  useFrame(() => {
    if (!mesh.current || !eyes.current) return;
    const time = environment.current.elapsed;
    for (let snake = 0; snake < count; snake++) {
      const x = (snake % 2 ? 1 : -1) * (5.7 + Math.floor(snake / 2) * 5.2);
      const z = 1.5 - Math.floor(snake / 2) * 7 + Math.sin(time * .16 + snake) * 1.4;
      for (let segment = 0; segment < segments; segment++) {
        const along = segment / (segments - 1);
        const wave = Math.sin(along * 9 - time * 2 + snake);
        const width = segment === 0 ? .24 : .18 * (1 - along * .85);
        dummy.position.set(x + wave * .32, -1.36 + .17, z - along * 2.8);
        if (segment === 0) head.copy(dummy.position);
        dummy.scale.set(width * (segment === 0 ? 1.1 : 1), width * .78, segment === 0 ? .28 : .18);
        dummy.rotation.set(0, Math.atan2(-.32 * 9 * Math.cos(along * 9 - time * 2 + snake), 2.8), 0);
        if (segment === 0) headRotation.copy(dummy.quaternion);
        dummy.updateMatrix(); mesh.current.setMatrixAt(snake * segments + segment, dummy.matrix);
      }
      for (let side = 0; side < 2; side++) {
        eyeOffset.set((side ? 1 : -1) * .15, .13, .13).applyQuaternion(headRotation);
        dummy.position.copy(head).add(eyeOffset);
        dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(.045); dummy.updateMatrix(); eyes.current.setMatrixAt(snake * 2 + side, dummy.matrix);
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true; eyes.current.instanceMatrix.needsUpdate = true;
  });
  useLayoutEffect(() => {
    const color = new T.Color();
    for (let snake = 0; snake < count; snake++) for (let segment = 0; segment < segments; segment++) mesh.current?.setColorAt(snake * segments + segment, color.set(segment % 5 < 2 ? "#67492e" : "#c59a4f"));
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [count]);
  return <group name="desert-snakes">
    <instancedMesh key={`body-${count}`} ref={mesh} args={[undefined, undefined, count * segments]} frustumCulled={false}><sphereGeometry args={[1, 7, 5]} /><WorldToonMaterial /></instancedMesh>
    <instancedMesh key={`eyes-${count}`} ref={eyes} args={[undefined, undefined, count * 2]} frustumCulled={false}><sphereGeometry args={[1, 6, 4]} /><WorldToonMaterial color="#201a13" /></instancedMesh>
  </group>;
}

function archGeometry() {
  const parts: Part[] = [];
  for (let i = 0; i < 9; i++) {
    const angle = i / 8 * Math.PI;
    parts.push([new T.DodecahedronGeometry(1, 0), i % 2 ? "#c9905c" : "#dfad72", [Math.cos(angle) * 2.3, 2.4 + Math.sin(angle) * 1.9, 0], [.88, 1.05, .9], [0, i * .37, angle * .2]]);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) parts.push([new T.DodecahedronGeometry(1, 0), "#c9905c", [side * 2.3, .7 + i * 1.1, 0], [1.05 - i * .12, 1.1, 1.1], [0, i, side * .1]]);
  return assemble(parts);
}
const archPlacements: Placement[] = [{ position: [-13, -1.36, -12], rotation: [0, .45, 0], scale: [1.3, 1.3, 1.3] }];
function SandstoneArch() {
  return <ModelInstances build={archGeometry} placements={archPlacements} name="desert-sandstone-arch" toon />;
}
