import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part } from "./InstancedModels";
import { useWorldQuality } from "./quality";

function saucerGeometry(variant: number) {
  const colors = ["#aebdce", "#c0b5ce", "#a7c4bb"];
  const lights = ["#b5edee", "#e1b1e9", "#d5eb9d"];
  const width = 1.6 + variant * 0.22;
  const parts: Part[] = [
    [
      new T.SphereGeometry(1, 16, 8),
      colors[variant],
      [0, 0, 0],
      [width, 0.25 + variant * 0.03, 1.05],
    ],
    [
      new T.SphereGeometry(0.65, 12, 8),
      lights[variant],
      [0, 0.27, 0],
      [1, 0.7, 0.85],
    ],
    [
      new T.TorusGeometry(1, 0.055, 5, 20),
      "#748799",
      [0, -0.03, 0],
      [width, 1.05, 1],
      [Math.PI / 2, 0, 0],
    ],
    [
      new T.CylinderGeometry(0.35, 0.24, 0.16, 10),
      lights[variant],
      [0, -0.26, 0],
    ],
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    parts.push([
      new T.IcosahedronGeometry(0.09, 0),
      lights[variant],
      [Math.cos(a) * width * 0.86, -0.12, Math.sin(a) * 0.92],
    ]);
  }
  if (variant === 1) {
    parts.push([
      new T.CylinderGeometry(0.025, 0.045, 0.6, 5),
      colors[variant],
      [0, 0.82, 0],
    ]);
    parts.push([
      new T.IcosahedronGeometry(0.12, 0),
      lights[variant],
      [0, 1.15, 0],
    ]);
  }
  return assemble(parts);
}

function FlyingSaucer({ variant }: { variant: number }) {
  const geometry = useMemo(() => saucerGeometry(variant), [variant]);
  const mesh = useRef<T.Mesh>(null);
  const elapsed = useRef(0);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    const object = mesh.current;
    if (!object) return;
    elapsed.current += Math.min(delta, 0.05);
    const phase =
      (elapsed.current + (variant === 0 ? 0 : 45 - variant * 14)) % 45;
    object.visible = phase < 11;
    if (!object.visible) return;
    const progress = phase / 11;
    const direction = variant % 2 ? -1 : 1;
    const arc = Math.sin(progress * Math.PI);
    object.position.set(
      direction * T.MathUtils.lerp(-48, 48, progress),
      7 + variant * 2 + arc * 2,
      -30 - variant * 8 + Math.sin(progress * Math.PI * 2) * 4,
    );
    object.rotation.set(
      0.12 + Math.sin(phase * 1.2) * 0.05,
      phase * 0.15,
      direction * Math.sin(progress * Math.PI * 2) * 0.24,
    );
    object.scale.setScalar(variant === 0 ? 1.8 : 1.5);
  });
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      visible={false}
      name={`ufo-${variant}`}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.45}
        metalness={0.25}
        emissive="#a5c9d5"
        emissiveIntensity={0.08}
        flatShading
      />
    </mesh>
  );
}

export function FlyingUfos() {
  const quality = useWorldQuality();
  return (
    <group>
      <FlyingSaucer variant={0} />
      <FlyingSaucer variant={1} />
      {quality !== "low" && <FlyingSaucer variant={2} />}
    </group>
  );
}
