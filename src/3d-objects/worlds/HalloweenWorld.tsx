import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { assemble, ModelInstances, type Part, type Placement, type Vec3 } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";
import { useWorldEnvironment } from "./WorldEnvironment";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { NightGlowMaterial } from "./WorldNightGlow";
import { HalloweenCastle } from "./HalloweenCastle";
import { AutumnLeaves } from "./AutumnLeaves";

function branch(from: Vec3, to: Vec3, bottom: number, top: number): Part {
  const a = new T.Vector3(...from), b = new T.Vector3(...to), direction = b.clone().sub(a);
  const geometry = new T.CylinderGeometry(top, bottom, direction.length(), 5);
  geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()));
  return [geometry, "#554148", a.add(b).multiplyScalar(.5).toArray() as Vec3];
}
function hauntedTreeGeometry() {
  const parts: Part[] = [
    branch([0, 0, 0], [.2, 2.1, 0], .43, .27), branch([.2, 2.1, 0], [-.25, 3.6, .1], .28, .16),
    branch([-.25, 3.6, .1], [.15, 4.8, .12], .16, .04),
    branch([.08, 1.7, 0], [-1.2, 2.4, .1], .23, .13), branch([-1.2, 2.4, .1], [-1.6, 3.8, .12], .13, .035),
    branch([-1.2, 2.4, .1], [-2, 2.75, -.1], .1, .025),
    branch([0, 2.9, 0], [1.35, 3.2, -.2], .18, .1), branch([1.35, 3.2, -.2], [1.6, 4.3, -.1], .1, .025),
    branch([1.35, 3.2, -.2], [2.05, 3.7, -.2], .075, .02),
    branch([.2, 2, 0], [.3, 2.8, 1.3], .16, .07), branch([.3, 2.8, 1.3], [.1, 3.6, 1.6], .07, .025),
  ];
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    parts.push(branch([0, .3, 0], [Math.cos(angle) * .95, .04, Math.sin(angle) * .95], .21, .03));
  }
  return assemble(parts);
}

export function pumpkinGeometry() {
  const parts: Part[] = [];
  for (let rib = 0; rib < 8; rib++) {
    const angle = rib / 8 * Math.PI * 2;
    parts.push([new T.SphereGeometry(1, 7, 6), rib % 2 ? "#dc6b22" : "#ed8228", [Math.cos(angle) * .33, .57, Math.sin(angle) * .33], [.44, .55, .44]]);
  }
  parts.push([new T.CylinderGeometry(.07, .11, .28, 5), "#667443", [.035, 1.16, 0], [1, 1, 1], [0, 0, -.25]]);
  return assemble(parts);
}
export function pumpkinFaceGeometry() {
  const parts: Part[] = [];
  for (const side of [-1, 1]) {
    const eye = new T.Shape(); eye.moveTo(-.12, -.08); eye.lineTo(.12, -.08); eye.lineTo(0, .14); eye.closePath();
    parts.push([new T.ShapeGeometry(eye), "#ffb63f", [side * .25, .73, .72], [1, 1, 1], [0, side * .22, 0]]);
  }
  const mouth = new T.Shape();
  mouth.moveTo(-.4, .06); mouth.lineTo(-.2, .02); mouth.lineTo(-.15, -.06); mouth.lineTo(-.05, .02); mouth.lineTo(.06, -.06); mouth.lineTo(.14, .02); mouth.lineTo(.4, .06);
  mouth.lineTo(.29, -.13); mouth.lineTo(.12, -.2); mouth.lineTo(-.15, -.2); mouth.lineTo(-.3, -.12); mouth.closePath();
  parts.push([new T.ShapeGeometry(mouth), "#ffb63f", [0, .4, .77]]);
  const flat = assemble(parts);
  const geometry = new TessellateModifier(.08, 5).modify(flat);
  flat.dispose();
  const positions = geometry.getAttribute("position");
  // Follow the actual rib surfaces so glowing faces stay attached from side views.
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    let front = 0;
    for (let rib = 0; rib < 8; rib++) {
      const angle = rib / 8 * Math.PI * 2;
      const remaining = 1 - ((x - Math.cos(angle) * .33) / .44) ** 2 - ((y - .57) / .55) ** 2;
      if (remaining >= 0) front = Math.max(front, Math.sin(angle) * .33 + .44 * Math.sqrt(remaining));
    }
    positions.setZ(i, front + .018);
  }
  geometry.computeVertexNormals();
  return geometry;
}
function gravestoneGeometry() {
  const shape = new T.Shape();
  shape.moveTo(-.4, 0); shape.lineTo(.4, 0); shape.lineTo(.4, .9); shape.quadraticCurveTo(.4, 1.35, 0, 1.35); shape.quadraticCurveTo(-.4, 1.35, -.4, .9); shape.closePath();
  return assemble([
    [new T.ExtrudeGeometry(shape, { depth: .23, bevelEnabled: false, curveSegments: 5 }), "#8c889a"],
    [new T.BoxGeometry(.11, .53, .02), "#4b455c", [0, .8, .245]],
    [new T.BoxGeometry(.38, .1, .02), "#4b455c", [0, .88, .245]],
    [new T.BoxGeometry(1.05, .12, .58), "#686475", [0, .06, .08]],
  ]);
}

function Ghost({ position, phase }: { position: Vec3; phase: number }) {
  const environment = useWorldEnvironment();
  const ref = useRef<T.Group>(null);
  const body = useMemo(() => {
    const geometry = new T.SphereGeometry(1, 14, 12);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i), x = positions.getX(i), z = positions.getZ(i);
      if (y < 0) {
        const angle = Math.atan2(z, x);
        const radius = Math.hypot(x, z);
        const widening = radius > .001 ? (1 + -y * .12) / radius : 1;
        positions.setXYZ(i, x * widening, y * .6 + Math.sin(angle * 7) * .09 * -y, z * widening);
      }
    }
    geometry.computeVertexNormals(); return geometry;
  }, []);
  useEffect(() => () => body.dispose(), [body]);
  useFrame(() => {
    if (!ref.current) return;
    const time = environment.current.elapsed;
    ref.current.position.set(position[0] + Math.sin(time * .3 + phase) * .65, position[1] + Math.sin(time * .9 + phase) * .3, position[2]);
    ref.current.rotation.y = Math.atan2(-position[0], -position[2]) + Math.sin(time * .4 + phase) * .15;
  });
  return <group ref={ref} position={position} scale={.7} name="halloween-ghost">
    <mesh geometry={body} scale={[.7, .9, .55]}><WorldToonMaterial color="#ece5f5" emissive="#b4a1d3" emissiveIntensity={.22} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .23, .24, .51]} scale={[.08, .14, .035]}><sphereGeometry args={[1, 7, 5]} /><WorldToonMaterial color="#332b49" /></mesh>)}
    <mesh position={[0, -.02, .55]} scale={[.06, .09, .025]}><sphereGeometry args={[1, 7, 5]} /><WorldToonMaterial color="#332b49" /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .67, -.04, 0]} rotation={[0, 0, side * -.6]} scale={[.18, .4, .17]}><sphereGeometry args={[1, 7, 5]} /><WorldToonMaterial color="#ece5f5" /></mesh>)}
  </group>;
}

function GroundMist() {
  const environment = useWorldEnvironment();
  const uniforms = useMemo(() => ({ drift: { value: 0 } }), []);
  useFrame(() => { uniforms.drift.value = Math.sin(environment.current.elapsed * .12) * .1; });
  // Three soft quads: no ray marching, noise sampling, or extra render targets.
  return <group name="halloween-ground-fog">{[
    [-2, -.93, 1.4, 14, .8], [3, -.7, -6, 24, 1.2], [-2, -.45, -13, 32, 1.9],
  ].map(([x, y, z, width, height], i) => <mesh key={i} position={[x, y, z]} scale={[width, height, 1]}>
    <planeGeometry args={[1, 1]} />
    <shaderMaterial uniforms={uniforms} transparent depthWrite={false} side={T.DoubleSide}
      vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }"
      fragmentShader="varying vec2 vUv; uniform float drift; void main(){vec2 p=(vUv-.5)*2.; p.x+=drift; float alpha=1.-smoothstep(.15,1.,dot(p,p)); gl_FragColor=vec4(.46,.4,.54,alpha*.11);}" />
  </mesh>)}</group>;
}

export function HalloweenWorld() {
  const quality = useWorldQuality();
  const placements = useMemo(() => {
    const random = seededRandom(1031);
    const trees: Placement[] = [], pumpkins: Placement[] = [], graves: Placement[] = [];
    for (let i = 0; i < (quality === "low" ? 16 : 26); i++) {
      const angle = i * Math.PI * 2 / (quality === "low" ? 16 : 26);
      const radius = 11 + random() * 10;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius - 4;
      if ((Math.abs(x) < 4.5 && z > -3) || (Math.abs(x) < 9 && z < -8)) continue;
      const size = 1 + random() * .7;
      trees.push({ position: [x, -1.36, z], rotation: [0, random() * 6, (random() - .5) * .12], scale: [size, size, size] });
    }
    const centers: Vec3[] = [[-5, 0, -4], [5.8, 0, -4.3], [-7, 0, 1.2], [7.8, 0, 2], [-10, 0, -10], [10, 0, -8], [-2, 0, -10]];
    centers.forEach(([x, , z], cluster) => {
      for (let j = 0; j < (quality === "low" ? 2 : 3); j++) {
        const size = j === 0 ? 1.1 + random() * .35 : .45 + random() * .4;
        const px = x + j * .8, pz = z + (j % 2) * 1.2;
        pumpkins.push({ position: [px, -1.36, pz], scale: [size, size, size], rotation: [0, Math.atan2(-px, -pz) + (random() - .5) * .5, 0] });
      }
      if (cluster < 4) graves.push({ position: [x * 1.3, -1.36, z - 2.1], scale: [1.25, 1.25, 1.25], rotation: [0, Math.atan2(-x, -z), (cluster % 2 ? 1 : -1) * .12] });
    });
    // Low foreground decorations remain readable in the narrower phone framing.
    for (const x of [-3.2, 3.2]) pumpkins.push({ position: [x, -1.36, -.8], scale: [.85, .85, .85], rotation: [0, Math.atan2(-x, 6.8), 0] });
    return { trees, pumpkins, graves };
  }, [quality]);
  const faceGeometry = useMemo(pumpkinFaceGeometry, []);
  const faceTransforms = useMemo(() => placements.pumpkins.map(p => {
    const object = new T.Object3D(); object.position.set(...p.position); object.scale.set(...p.scale); object.rotation.set(...(p.rotation ?? [0, 0, 0])); object.updateMatrix(); return object.matrix.clone();
  }), [placements]);
  const faces = useMemo(() => {
    const parts = faceTransforms.map(matrix => faceGeometry.clone().applyMatrix4(matrix));
    // assemble handles the source geometry lifecycle and consistent vertex colors.
    return assemble(parts.map(g => [g, "#ffbb42"] as Part));
  }, [faceTransforms, faceGeometry]);
  useEffect(() => () => { faceGeometry.dispose(); }, [faceGeometry]);
  useEffect(() => () => faces.dispose(), [faces]);
  return <group name="halloween-pumpkin-grove">
    <HalloweenCastle />
    <AutumnLeaves trees={placements.trees} />
    <ModelInstances build={hauntedTreeGeometry} placements={placements.trees} name="halloween-crooked-trees" toon />
    <ModelInstances build={pumpkinGeometry} placements={placements.pumpkins} name="halloween-pumpkins" toon />
    <mesh geometry={faces} name="halloween-pumpkin-faces"><NightGlowMaterial color="#ffb83c" side={T.DoubleSide} /></mesh>
    <ModelInstances build={gravestoneGeometry} placements={placements.graves} name="halloween-gravestones" toon />
    <Ghost position={[-6, .65, -7]} phase={0} /><Ghost position={[4.5, 2, -8]} phase={2.1} />
    {quality !== "low" && <Ghost position={[-11, 1.8, 1]} phase={4.2} />}
    <GroundMist />
  </group>;
}
