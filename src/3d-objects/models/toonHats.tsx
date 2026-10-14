import { useEffect, useMemo, useRef } from "react";
import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";
import * as T from "three";
import { assemble, type Part, type Vec3 } from "../worlds/InstancedModels";
import { WorldToonMaterial } from "../worlds/WorldToonMaterial";

function wizardGeometry() {
  const crown = new T.CylinderGeometry(0.025, 0.72, 1.65, 12, 5);
  const vertices = crown.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const height = (vertices.getY(i) + 0.825) / 1.65;
    vertices.setX(i, vertices.getX(i) + height ** 3 * 0.38);
  }
  crown.computeVertexNormals();
  const parts: Part[] = [
    [new T.CylinderGeometry(1.12, 1.15, 0.085, 16), "#6743a4"],
    [crown, "#7551bd", [0, 0.84, 0]],
    [new T.CylinderGeometry(0.66, 0.73, 0.16, 12), "#47316f", [0, 0.12, 0]],
  ];
  // Small raised stars follow the tapered crown, facing out from its surface.
  for (const [y, yaw, size] of [[0.46, 0, 0.13], [0.9, -0.7, 0.11], [1.25, 0.5, 0.08], [0.58, 2.4, 0.12]]) {
    const shape = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5;
      const radius = size * (i % 2 ? 0.44 : 1);
      if (i === 0) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    shape.closePath();
    const radius = 0.74 * (1 - y / 1.72) + 0.035;
    parts.push([
      new T.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false }),
      "#ffd56b",
      [Math.sin(yaw) * radius + (y / 1.65) ** 3 * 0.38, y, Math.cos(yaw) * radius],
      [1, 1, 1], [0, yaw, 0],
    ]);
  }
  return assemble(parts);
}

function flatCapGeometry() {
  const color = "#936b49";
  const baseRadius = 0.72;
  const crownHalfWidth = 0.96;
  // Curl the puffed crown inward around the head above the inset brim.
  const crownAngle = Math.PI - Math.asin(baseRadius / crownHalfWidth);
  const bottom = Math.cos(crownAngle);
  const crown = new T.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, crownAngle);
  const vertices = crown.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const height = (vertices.getY(i) - bottom) / (1 - bottom);
    const z = vertices.getZ(i);
    vertices.setXYZ(
      i,
      vertices.getX(i) * crownHalfWidth,
      height * (0.59 - z * 0.1),
      z * (z < 0 ? 1.02 : 0.94) - height * 0.08,
    );
  }
  crown.computeVertexNormals();
  return assemble([
    [crown, color, [0, 0.015, 0]],
    [new T.SphereGeometry(1, 16, 5), color, [0, 0.075, 0.62], [0.64, 0.045, 0.34]],
    [new T.SphereGeometry(1, 12, 6), color, [0, 0.62, -0.08], [0.075, 0.035, 0.075]],
  ]);
}

function propellerHatGeometry() {
  const colors = ["#e86a54", "#f4c94e", "#598ac9", "#63a877", "#f4c94e", "#598ac9"];
  const parts: Part[] = colors.map((color, index) => [
    new T.SphereGeometry(1, 4, 6, index * Math.PI / 3, Math.PI / 3, 0, Math.PI / 2),
    color, [0, 0.06, 0], [0.87, 0.48, 0.91],
  ]);
  parts.push(
    [new T.CylinderGeometry(0.85, 0.84, 0.1, 24), "#426994", [0, 0.03, 0], [1, 1, 1.04]],
    [new T.SphereGeometry(1, 12, 4), "#426994", [0, 0.035, 0.72], [0.63, 0.05, 0.48]],
    [new T.SphereGeometry(0.09, 8, 4), "#f4c94e", [0, 0.54, 0]],
    [new T.CylinderGeometry(0.035, 0.035, 0.18, 8), "#b18c3b", [0, 0.65, 0]],
  );
  return assemble(parts);
}

function propellerGeometry() {
  return assemble([
    [new T.SphereGeometry(1, 12, 4), "#f8e7b0", [-0.4, 0, 0], [0.48, 0.04, 0.13], [0, 0, -0.12]],
    [new T.SphereGeometry(1, 12, 4), "#f8e7b0", [0.4, 0, 0], [0.48, 0.04, 0.13], [0, 0, -0.12]],
    [new T.SphereGeometry(0.09, 8, 4), "#e86a54", [0, 0.035, 0]],
  ]);
}

function crownGeometry() {
  // A hollow crown with eight chunky points; the inner wall stays visible.
  const positions: number[] = [];
  const addQuad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  const ring = (index: number, inner: boolean, top: boolean): Vec3 => {
    const angle = index * Math.PI / 8;
    const radius = (top ? 0.96 : 0.87) - (inner ? 0.09 : 0);
    return [Math.sin(angle) * radius, top ? (index % 2 ? 0.33 : 0.76) : 0.02, Math.cos(angle) * radius];
  };
  for (let i = 0; i < 16; i++) {
    const next = i + 1;
    addQuad(ring(i, false, false), ring(next, false, false), ring(next, false, true), ring(i, false, true));
    addQuad(ring(next, true, false), ring(i, true, false), ring(i, true, true), ring(next, true, true));
    addQuad(ring(i, false, true), ring(next, false, true), ring(next, true, true), ring(i, true, true));
    addQuad(ring(next, false, false), ring(i, false, false), ring(i, true, false), ring(next, true, false));
  }
  const crown = new T.BufferGeometry();
  crown.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  crown.computeVertexNormals();
  const parts: Part[] = [
    [crown, "#eebc49"],
    [new T.TorusGeometry(0.86, 0.055, 6, 24), "#ffda72", [0, 0.1, 0], [1, 1, 1], [Math.PI / 2, 0, 0]],
  ];
  [0, 1, 2, 3].forEach((index) => {
    const yaw = index * Math.PI / 2;
    parts.push([
      new T.OctahedronGeometry(0.14), "#df3449",
      [Math.sin(yaw) * 0.91, 0.28, Math.cos(yaw) * 0.91],
      [0.82, 1.1, 0.42], [0, yaw, 0],
    ]);
  });
  return assemble(parts);
}

const hatBuilders = {
  wizardHat: wizardGeometry,
  flatCap: flatCapGeometry,
  propellerHat: propellerHatGeometry,
  royalCrown: crownGeometry,
};

export function ToonHat({ kind, position, scale, preview, outlineColor = "#000000" }: {
  kind: keyof typeof hatBuilders;
  position: Vec3;
  scale: Vec3;
  preview: boolean;
  outlineColor?: string;
}) {
  const geometry = useMemo(hatBuilders[kind], [kind]);
  const rotorGeometry = useMemo(() => kind === "propellerHat" ? propellerGeometry() : null, [kind]);
  const rotor = useRef<T.Mesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => rotorGeometry?.dispose(), [rotorGeometry]);
  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.y = (rotor.current.rotation.y + delta * Math.PI * 2) % (Math.PI * 2);
  });
  const spring = useSpring({ from: { size: 0 }, size: 1, config: { tension: 300, friction: 15 } });
  return (
    <group position={position} scale={scale} name={kind}>
      <a.group scale={spring.size}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <WorldToonMaterial vertexColors transparent={preview} opacity={preview ? 0.5 : 1} depthWrite={!preview} />
          <Outlines thickness={0.005} color={outlineColor} screenspace transparent={preview} opacity={preview ? 0.5 : 1} />
        </mesh>
        {rotorGeometry && (
          <mesh ref={rotor} name="propellerRotor" geometry={rotorGeometry} position={[0, 0.75, 0]} castShadow>
            <WorldToonMaterial vertexColors transparent={preview} opacity={preview ? 0.5 : 1} depthWrite={!preview} />
            <Outlines thickness={0.005} color={outlineColor} screenspace transparent={preview} opacity={preview ? 0.5 : 1} />
          </mesh>
        )}
      </a.group>
    </group>
  );
}
