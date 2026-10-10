import { useEffect, useMemo } from "react";
import * as T from "three";
import {
  assemble,
  ModelInstances,
  type Part,
  type Vec3,
  type Placement,
} from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";

function ringPlacements(
  count: number,
  seed: number,
  radius: number,
  spread: number,
  scale: number,
): Placement[] {
  const random = seededRandom(seed);
  const result: Placement[] = [];
  for (let i = 0; result.length < count && i < count * 20; i++) {
    const angle = random() * Math.PI * 2;
    const r = radius + random() * spread;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r - 3;
    // Keep the home character and the menu camera's approach unobstructed.
    if (Math.hypot(x, z) < 6.5 || (Math.abs(x) < 4.25 && z > -0.5 && z < 12.5))
      continue;
    const s = scale * (0.75 + random() * 0.5);
    result.push({
      position: [x, -1.36, z],
      scale: [s, s * (0.9 + random() * 0.2), s],
      rotation: [0, random() * Math.PI * 2, 0],
    });
  }
  return result;
}

function treeGeometry() {
  const parts: Part[] = [
    [new T.CylinderGeometry(0.18, 0.32, 2.9, 7), "#79583d", [0, 1.45, 0]],
  ];
  for (const side of [-1, 1]) {
    parts.push([
      new T.CylinderGeometry(0.08, 0.16, 1.7, 6),
      "#856044",
      [side * 0.45, 2.3, 0],
      [1, 1, 1],
      [0, 0, side * -0.6],
    ]);
  }
  const crowns: [Vec3, Vec3, string][] = [
    [[0, 3.6, 0], [1.7, 1.6, 1.5], "#58804a"],
    [[-1.05, 2.85, 0.3], [1.3, 1.0, 1.2], "#416b3d"],
    [[1.1, 3.15, -0.2], [1.25, 1.25, 1.3], "#709650"],
    [[0.2, 3.05, 1.0], [1.15, 1.1, 1.1], "#638b46"],
  ];
  crowns.forEach(([p, s, c]) =>
    parts.push([new T.IcosahedronGeometry(1, 1), c, p, s]),
  );
  return assemble(parts);
}
function pineGeometry() {
  const parts: Part[] = [
    [new T.CylinderGeometry(0.12, 0.22, 1.5, 7), "#755441", [0, 0.75, 0]],
  ];
  for (let i = 0; i < 4; i++) {
    const radius = 1.3 - i * 0.26;
    const y = 1.4 + i * 0.67;
    parts.push([new T.ConeGeometry(radius, 1.7, 9), "#47766a", [0, y, 0]]);
    parts.push([
      new T.ConeGeometry(radius * 0.93, 1.35, 9),
      i % 2 ? "#f4fbff" : "#dbeef4",
      [0, y + 0.22, 0],
    ]);
  }
  return assemble(parts);
}
function rockGeometry() {
  return assemble([
    [
      new T.IcosahedronGeometry(1, 0),
      "#a0a38a",
      [0, 0.3, 0],
      [0.8, 0.55, 0.65],
    ],
  ]);
}
function moonRockGeometry() {
  return assemble([
    [
      new T.DodecahedronGeometry(1, 0),
      "#c6ae75",
      [0, 0.3, 0],
      [0.8, 0.65, 0.6],
    ],
  ]);
}
function cactusGeometry() {
  const parts: Part[] = [
    [new T.CylinderGeometry(0.25, 0.29, 2.2, 8), "#4f8056", [0, 1.1, 0]],
    [new T.SphereGeometry(0.25, 8, 5), "#6b975d", [0, 2.2, 0]],
  ];
  for (const side of [-1, 1]) {
    const y = side < 0 ? 0.95 : 1.35;
    parts.push([
      new T.CylinderGeometry(0.16, 0.19, 0.7, 7),
      "#5e8c59",
      [side * 0.4, y, 0],
      [1, 1, 1],
      [0, 0, Math.PI / 2],
    ]);
    parts.push([
      new T.CylinderGeometry(0.16, 0.18, 0.85, 7),
      "#67965e",
      [side * 0.72, y + 0.32, 0],
    ]);
    parts.push([
      new T.SphereGeometry(0.16, 7, 5),
      "#79a36a",
      [side * 0.72, y + 0.74, 0],
    ]);
  }
  return assemble(parts);
}
export function ForestModels() {
  const quality = useWorldQuality();
  const trees = useMemo(
    () => ringPlacements(quality === "low" ? 28 : 48, 41, 10, 13, 1.65),
    [quality],
  );
  const rocks = useMemo(
    () => ringPlacements(quality === "low" ? 12 : 24, 65, 7, 10, 0.7),
    [quality],
  );
  return (
    <>
      <ModelInstances
        name="forest-trees"
        build={treeGeometry}
        placements={trees}
      />
      <ModelInstances
        name="forest-rocks"
        build={rockGeometry}
        placements={rocks}
      />
    </>
  );
}
export function WinterModels() {
  const quality = useWorldQuality();
  const trees = useMemo(
    () => ringPlacements(quality === "low" ? 22 : 34, 77, 8, 11, 2),
    [quality],
  );
  return (
    <ModelInstances
      name="winter-pines"
      build={pineGeometry}
      placements={trees}
    />
  );
}
export function DesertCacti() {
  const quality = useWorldQuality();
  const placements = useMemo(
    () => ringPlacements(quality === "low" ? 18 : 34, 92, 7.5, 10, 1),
    [quality],
  );
  return (
    <ModelInstances
      name="desert-cacti"
      build={cactusGeometry}
      placements={placements}
    />
  );
}
export function MoonRocks() {
  const placements = useMemo(
    () =>
      ringPlacements(20, 93, 7, 5, 0.65)
        .filter((p) => Math.hypot(p.position[0], p.position[2] + 0.72) < 14)
        .map((p) => {
          const [x, , z] = p.position;
          p.position[1] =
            -17.44 + Math.sqrt(256 - x * x - (z + 0.72) ** 2) - 0.1;
          return p;
        }),
    [],
  );
  return (
    <ModelInstances
      name="moon-rocks"
      build={moonRockGeometry}
      placements={placements}
    />
  );
}
export function Dune({
  position,
  scale,
  color,
}: {
  position: Vec3;
  scale: Vec3;
  color: string;
}) {
  const geometry = useMemo(() => {
    const g = new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      p.setXYZ(
        i,
        x,
        y * (0.85 + 0.15 * Math.cos(x * 5 + z * 3)) +
          Math.sin(z * 4) * y * 0.06,
        z,
      );
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={position} scale={scale}>
      <meshStandardMaterial color={color} flatShading roughness={1} />
    </mesh>
  );
}

export function SnowmanDetails() {
  return (
    <group>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.27, 0.245]}>
          <sphereGeometry args={[0.035, 6, 4]} />
          <meshStandardMaterial color="#343c43" />
        </mesh>
      ))}
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.245, 0.045, 5, 12]} />
        <meshStandardMaterial color="#bc5b4c" />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.045, 12]} />
        <meshStandardMaterial color="#455766" />
      </mesh>
      <mesh position={[0, 0.57, 0]}>
        <cylinderGeometry args={[0.17, 0.18, 0.22, 10]} />
        <meshStandardMaterial color="#455766" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.5, -0.1, 0]}
          rotation={[0, 0, side * -1.0]}
        >
          <cylinderGeometry args={[0.022, 0.035, 0.5, 5]} />
          <meshStandardMaterial color="#71533d" />
        </mesh>
      ))}
    </group>
  );
}

export function RingedPlanet({ small = false }: { small?: boolean }) {
  const quality = useWorldQuality();
  const geometry = useMemo(() => {
    const g = new T.SphereGeometry(
      1,
      quality === "low" ? 24 : 40,
      quality === "low" ? 16 : 28,
    );
    const positions = g.getAttribute("position");
    const colors = new Float32Array(positions.count * 3);
    const base = new T.Color(small ? "#819eb3" : "#cbb48a");
    const band = new T.Color(small ? "#cedee2" : "#f3d7aa");
    const color = new T.Color();
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const wave = Math.sin(y * 32 + Math.sin(positions.getX(i) * 5) * 0.4);
      color
        .copy(base)
        .lerp(band, (wave * 0.5 + 0.5) * 0.7)
        .toArray(colors, i * 3);
    }
    g.setAttribute("color", new T.BufferAttribute(colors, 3));
    return g;
  }, [quality, small]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const radius = small ? 4.6 : 8.8;
  return (
    <group
      position={small ? [30, 7, -52] : [-24, 10, -46]}
      rotation={[0.34, -0.28, small ? -0.22 : 0.3]}
      scale={radius}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <group rotation={[1.18, 0.14, -0.42]}>
        <mesh>
          <ringGeometry args={[1.28, 1.58, 64]} />
          <meshStandardMaterial
            color="#d7c7aa"
            side={T.DoubleSide}
            roughness={1}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[1.62, 1.85, 64]} />
          <meshStandardMaterial
            color="#9e9385"
            side={T.DoubleSide}
            roughness={1}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[1.9, 1.96, 64]} />
          <meshBasicMaterial color="#ddd0b9" side={T.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function MoonTerrain({
  groundColor,
  accentColor,
  glowIntensity,
}: {
  groundColor: string;
  accentColor: string;
  glowIntensity: number;
}) {
  const quality = useWorldQuality();
  const geometry = useMemo(() => {
    const random = seededRandom(311);
    const craters = Array.from({ length: 65 }, () => {
      const y = random() * 2 - 1,
        angle = random() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      return {
        direction: new T.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)),
        radius: 0.09 + random() * 0.13,
        depth: 0.5 + random() * 0.65,
      };
    });
    const segments = quality === "low" ? 48 : 72;
    const g = new T.SphereGeometry(16, segments, Math.round(segments * 0.75));
    const p = g.getAttribute("position"),
      normal = new T.Vector3();
    const colors = new Float32Array(p.count * 3);
    const base = new T.Color(groundColor),
      rimColor = new T.Color(accentColor),
      color = new T.Color();
    for (let i = 0; i < p.count; i++) {
      normal.fromBufferAttribute(p, i).normalize();
      let displacement = 0,
        shade = 0,
        rimLight = 0;
      for (const crater of craters) {
        const distance = normal.distanceTo(crater.direction) / crater.radius;
        if (distance > 1.35) continue;
        const bowl = 1 - T.MathUtils.smoothstep(distance, 0.05, 0.95);
        const rim = Math.exp(-((distance - 1) ** 2) * 65);
        displacement += -bowl * crater.depth + rim * crater.depth * 0.26;
        shade = Math.max(shade, bowl * 0.48);
        rimLight = Math.max(rimLight, rim * 0.3);
      }
      p.setXYZ(
        i,
        normal.x * (16 + displacement),
        normal.y * (16 + displacement),
        normal.z * (16 + displacement),
      );
      color
        .copy(base)
        .multiplyScalar(1 - shade)
        .lerp(rimColor, rimLight)
        .toArray(colors, i * 3);
    }
    g.setAttribute("color", new T.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [quality, groundColor, accentColor]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      name="moon-terrain"
      geometry={geometry}
      position={[0, -17.44, -0.72]}
      rotation={[0.48, -0.22, 0.84]}
    >
      <meshStandardMaterial
        vertexColors
        roughness={1}
        emissive={accentColor}
        emissiveIntensity={glowIntensity * 0.04}
      />
    </mesh>
  );
}
