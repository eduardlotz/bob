import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part, type Vec3 } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";

function box(parts: Part[], color: string, position: Vec3, scale: Vec3) {
  parts.push([new T.BoxGeometry(1, 1, 1), color, position, scale]);
}

function brownstone(
  parts: Part[],
  x: number,
  z: number,
  yaw: number,
  index: number,
  height: number,
) {
  const local: Part[] = [];
  const base = -1.1;
  const brick = ["#a77760", "#ae8a6b", "#89665b", "#b79b7c"];
  box(local, brick[index % 4], [0, base + height / 2, 0], [4.6, height, 5]);
  box(local, "#d2c0a3", [0, base + height, 0], [4.95, 0.25, 5.25]);
  box(local, "#755b4c", [0, base + 0.9, 2.55], [0.8, 1.8, 0.12]);
  for (let step = 0; step < 3; step++) {
    box(
      local,
      "#b6ab96",
      [0, -1.2 + step * 0.12, 3.45 - step * 0.23],
      [1.25, 0.24, 0.8 - step * 0.15],
    );
  }
  for (let floor = 0; floor < 3; floor++) {
    for (const offset of [-1.3, 0, 1.3]) {
      if (floor === 0 && offset === 0) continue;
      const y = base + 1.3 + floor * 1.9;
      box(local, "#bcae95", [offset, y, 2.57], [0.96, 1.4, 0.12]);
      box(
        local,
        floor % 2 ? "#c6d6ce" : "#425a66",
        [offset, y, 2.66],
        [0.7, 1.1, 0.03],
      );
      box(local, "#d3c8b1", [offset, y - 0.7, 2.75], [1.05, 0.12, 0.3]);
    }
  }
  if (index % 3 === 0) {
    local.push([
      new T.CylinderGeometry(0.65, 0.65, 1.3, 8),
      "#8e7963",
      [0, base + height + 1.2, 0],
    ]);
    local.push([
      new T.ConeGeometry(0.8, 0.4, 8),
      "#4e5c64",
      [0, base + height + 2, 0],
    ]);
    for (const side of [-0.5, 0.5])
      box(local, "#57616b", [side, base + height + 0.4, 0], [0.08, 0.8, 0.08]);
  }
  // Rotate the entire facade to face its street, including doors and stoops.
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  for (const part of local) {
    const [px, py, pz] = part[2]!;
    part[2] = [x + px * c + pz * s, py, z - px * s + pz * c];
    part[4] = [0, yaw, 0];
    parts.push(part);
  }
}

function cityGeometry() {
  const parts: Part[] = [];
  const random = seededRandom(908);
  const crossStreets = [-40, -14, 0];
  const avenues = [-22, 0, 22];
  // Bob is at (0, 0): the central avenue and cross street meet beneath him.
  for (const z of crossStreets) {
    box(parts, "#434d5b", [0, -1.36, z], [116, 0.08, 7.5]);
    for (let x = -54; x <= 54; x += 4) {
      if (avenues.some((avenue) => Math.abs(x - avenue) < 5)) continue;
      box(parts, "#e7c76a", [x, -1.3, z], [2, 0.015, 0.09]);
    }
  }
  for (const x of avenues) {
    box(parts, "#434d5b", [x, -1.36, -4], [7.5, 0.08, 116]);
    for (let z = -58; z <= 50; z += 4) {
      if (crossStreets.some((street) => Math.abs(z - street) < 5)) continue;
      box(parts, "#e7c76a", [x, -1.3, z], [0.09, 0.015, 2]);
    }
  }
  // Four corner blocks and zebra crossings make the central intersection legible.
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      box(
        parts,
        "#c6c5ba",
        [x * 11, -1.22, z < 0 ? -7.1 : 9.5],
        [13, 0.28, z < 0 ? 5.2 : 10],
      );
    }
    for (let stripe = -3; stripe <= 3; stripe++) {
      box(
        parts,
        "#e7e5da",
        [stripe * 0.85, -1.295, x * 5.4],
        [0.42, 0.02, 1.8],
      );
      box(
        parts,
        "#e7e5da",
        [x * 5.4, -1.295, stripe * 0.85],
        [1.8, 0.02, 0.42],
      );
    }
  }
  // Buildings wrap both sides of the avenue and continue behind the camera.
  let building = 0;
  for (const side of [-1, 1]) {
    for (const z of [-7, 7.5, 12.75, 18, 23.25, 28.5]) {
      brownstone(
        parts,
        side * 10.5,
        z,
        (-side * Math.PI) / 2,
        building++,
        5.8 + random() * 1.8,
      );
    }
    for (const x of [31, 36.2, 41.4, 46.6]) {
      brownstone(parts, side * x, -8, 0, building++, 6 + random() * 2);
      brownstone(parts, side * x, 8, Math.PI, building++, 6 + random() * 2);
    }
  }
  // Background blocks leave gaps where the avenues continue through the city.
  for (const x of [
    -46, -40.8, -35.6, -30.4, -13, -7.8, 7.8, 13, 30.4, 35.6, 40.8, 46,
  ]) {
    brownstone(parts, x, -26, 0, building++, 6 + random() * 2.3);
  }
  let tower = 0;
  for (const z of [-33, -50]) {
    for (const x of [-45, -34, -12, 12, 34, 45]) {
      const height = 14 + random() * 15;
      const width = 4.5 + random() * 1.5;
      const color = ["#8c9caa", "#aab5bd", "#8995a3", "#b6b6af"][tower++ % 4];
      box(parts, color, [x, height / 2 - 1.3, z], [width, height, 6]);
      box(parts, "#778894", [x, height - 0.3, z], [width * 0.7, 2, 4.5]);
      for (let y = 1; y < height - 1; y += 1.7) {
        for (let col = -1; col <= 1; col++)
          box(
            parts,
            (col + Math.floor(y)) % 4 === 0 ? "#e4d9ad" : "#546e80",
            [x + col * width * 0.27, y, z + 3.06],
            [width * 0.14, 0.85, 0.04],
          );
      }
    }
  }
  for (let tier = 0; tier < 4; tier++)
    box(
      parts,
      "#bdb7a8",
      [-12, 14 + tier * 6, -57],
      [7 - tier * 1.4, 10, 7 - tier * 1.4],
    );
  parts.push([
    new T.CylinderGeometry(0.07, 0.32, 8, 6),
    "#c9ccca",
    [-12, 40, -57],
  ]);
  for (const side of [-1, 1]) {
    for (const z of [-12, 7, 18]) {
      const x = side * 5;
      box(parts, "#485660", [x, 0.9, z], [0.09, 4.3, 0.09]);
      box(parts, "#485660", [x - side * 0.4, 3, z], [0.8, 0.08, 0.08]);
      box(parts, "#f6e6ae", [x - side * 0.75, 2.92, z], [0.35, 0.15, 0.25]);
    }
  }
  return assemble(parts);
}

function carGeometry(cab: boolean) {
  const parts: Part[] = [];
  box(parts, cab ? "#f3c243" : "#648c9f", [0, 0.55, 0], [2.8, 0.55, 1.25]);
  box(parts, cab ? "#f3c243" : "#648c9f", [-0.15, 1.0, 0], [1.5, 0.55, 1.1]);
  box(parts, "#b3d5df", [0.62, 1.05, 0], [0.035, 0.4, 0.98]);
  box(parts, "#6b8f9f", [-0.92, 1.05, 0], [0.035, 0.4, 0.98]);
  for (const side of [-1, 1]) {
    box(parts, "#8ab0c0", [-0.15, 1.04, side * 0.56], [1.27, 0.35, 0.035]);
    box(parts, "#4e5c65", [-0.15, 1.04, side * 0.58], [0.08, 0.45, 0.035]);
    for (const x of [-0.85, 0.85]) {
      parts.push([
        new T.CylinderGeometry(0.28, 0.28, 0.17, 8),
        "#303c48",
        [x, 0.28, side * 0.64],
        [1, 1, 1],
        [Math.PI / 2, 0, 0],
      ]);
    }
    box(parts, "#fff0c6", [1.42, 0.64, side * 0.42], [0.03, 0.15, 0.22]);
    box(parts, "#af5c4c", [-1.42, 0.64, side * 0.42], [0.03, 0.15, 0.22]);
  }
  if (cab) {
    box(parts, "#faf0c2", [-0.1, 1.36, 0], [0.5, 0.18, 0.32]);
    for (let i = 0; i < 5; i++) {
      for (const side of [-1, 1])
        box(
          parts,
          i % 2 ? "#ede6cb" : "#394349",
          [-0.7 + i * 0.25, 0.57, side * 0.635],
          [0.24, 0.1, 0.025],
        );
    }
  }
  return assemble(parts);
}

function Traffic({ cab }: { cab: boolean }) {
  const quality = useWorldQuality();
  const count = quality === "low" ? 4 : 8;
  const geometry = useMemo(() => carGeometry(cab), [cab]);
  const ref = useRef<T.InstancedMesh>(null);
  const dummy = useMemo(() => new T.Object3D(), []);
  const elapsed = useRef(0);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    ref.current?.instanceMatrix.setUsage(T.DynamicDrawUsage);
    if (!cab && ref.current) {
      const color = new T.Color();
      for (let i = 0; i < count; i++)
        ref.current.setColorAt(
          i,
          color.set(["#ffffff", "#b6cad8", "#c4b2ad", "#a1b8a4"][i % 4]),
        );
      if (ref.current.instanceColor)
        ref.current.instanceColor.needsUpdate = true;
    }
  }, [cab, count]);
  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    elapsed.current += Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const direction = i % 4 < 2 ? 1 : -1;
      const street = i % 2 ? -40 : -14;
      const lane = street + direction * 1.8;
      const offset = (i * 112) / count + (cab ? 7.5 : 0);
      // Equal lane speeds and staggered starts keep cars separated.
      const x = (((elapsed.current * 3.8 + offset) % 112) - 56) * direction;
      dummy.position.set(x, -1.29, lane);
      dummy.rotation.set(0, direction === 1 ? 0 : Math.PI, 0);
      dummy.scale.setScalar(0.85);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      key={count}
      ref={ref}
      name={cab ? "city-cabs" : "city-cars"}
      args={[geometry, undefined, count]}
      frustumCulled={false}
    >
      <meshStandardMaterial vertexColors roughness={0.85} flatShading />
    </instancedMesh>
  );
}

export function CityWorld() {
  const geometry = useMemo(cityGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group name="city-world">
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={1} flatShading />
      </mesh>
      <Traffic cab />
      <Traffic cab={false} />
    </group>
  );
}
