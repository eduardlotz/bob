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
  for (let i = 0; i < 7; i++) {
    parts.push([
      new T.TorusGeometry(0.5 + random() * 0.08, 0.018, 3, 12),
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
  const count = quality === "low" ? 4 : 8;
  const geometry = useMemo(tumbleweedGeometry, []);
  const mesh = useRef<T.InstancedMesh>(null);
  const dummy = useMemo(() => new T.Object3D(), []);
  const elapsed = useRef(0);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    mesh.current?.instanceMatrix.setUsage(T.DynamicDrawUsage);
  }, [count]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    elapsed.current += Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const speed = 0.65 + (i % 3) * 0.18;
      const x = ((elapsed.current * speed + (i * 56) / count) % 56) - 28;
      const z = -7 - (i % 4) * 3.4;
      const size = 0.65 + (i % 3) * 0.2;
      dummy.position.set(
        x,
        -1.36 +
          size * 0.55 +
          Math.abs(Math.sin(elapsed.current * speed * 2 + i)) * 0.09,
        z,
      );
      dummy.rotation.set(
        i * 0.7,
        i,
        (-elapsed.current * speed) / (size * 0.55),
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
      <meshStandardMaterial vertexColors roughness={1} />
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
      />
      <Tumbleweeds />
    </>
  );
}
