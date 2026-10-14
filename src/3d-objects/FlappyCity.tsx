import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { brownstone } from "./worlds/CityWorld";
import { assemble, type Part } from "./worlds/InstancedModels";
import { seededRandom, useWorldQuality } from "./worlds/quality";

/** Reuse the world's brownstones, baked into a single repeating backdrop. */
export function FlappyCity() {
  const quality = useWorldQuality();
  const geometry = useMemo(() => {
    const parts: Part[] = [];
    const random = seededRandom(482);
    for (let i = 0; i < 8; i++) {
      brownstone(parts, i * 5.2, 0, 0, i, 5.8 + random() * 2.5);
      if (quality !== "low") brownstone(parts, i * 5.2 + 1.5, -7, 0, i + 2, 8 + random() * 5);
    }
    return assemble(parts);
  }, [quality]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scroll = useRef(0);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    scroll.current = (scroll.current + Math.min(delta, 0.05) * 0.65) % 41.6;
    for (let i = 0; i < 3; i++) {
      dummy.position.set(-41.6 + i * 41.6 - scroll.current, -11, -16);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <group name="flappy-city">
    <instancedMesh ref={mesh} args={[geometry, undefined, 3]} frustumCulled={false}>
      <meshStandardMaterial vertexColors roughness={1} flatShading />
    </instancedMesh>
    <directionalLight color="#ffe2b4" intensity={1.5} position={[-12, 18, 8]} />
    <mesh position={[-22, 20, -65]}>
      <sphereGeometry args={[5, 24, 16]} />
      <meshBasicMaterial color="#ffe8b9" />
    </mesh>
  </group>;
}
