import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { useCoreStore } from "@/store/core/store";
import { assemble, type Part, type Vec3 } from "../worlds/InstancedModels";
import { WorldToonMaterial } from "../worlds/WorldToonMaterial";
import type { BobBodyFit } from "@/components/bob/wearableFit";
import { getBobFaceScale, isBoxForm } from "@/types/blobForms";
import { getEggRadiusAtY } from "@/types/eggShape";

export type PlayfulWardrobeKind = "cigar" | "bigSmile" | "sleepingHat";

const smileTemplates = new Map<boolean, T.BufferGeometry>();
const ignoreSmileRaycast: T.Mesh["raycast"] = () => {};

export function playfulWardrobeGeometry(kind: PlayfulWardrobeKind, curved = true, body?: BobBodyFit, moustacheEquipped = false) {
  const smileTemplate = kind === "bigSmile" ? smileTemplates.get(curved) : undefined;
  if (smileTemplate) {
    const geometry = smileTemplate.clone();
    if (body) fitSmileGeometry(geometry, body, moustacheEquipped);
    return geometry;
  }
  const parts: Part[] = [];
  if (kind === "cigar") {
    // All details are authored on the same X axis, then tilted together.
    const turn: Vec3 = [0, 0, -Math.PI / 2];
    parts.push(
      [new T.CylinderGeometry(.085, .073, .78, 20), "#784629", [.39, 0, 0], [1, 1, 1], turn],
      [new T.CylinderGeometry(.081, .081, .12, 20), "#c29655", [.3, 0, 0], [1, 1, 1], turn],
      [new T.CylinderGeometry(.0855, .0855, .045, 20), "#554038", [.765, 0, 0], [1, 1, 1], turn],
    );
    for (let i = 0; i < 7; i++) {
      const x = .07 + i * .1;
      parts.push([new T.TorusGeometry(.0735 + x / .78 * .012, .0025, 4, 20), "#945d39", [x, 0, 0], [1, 1, 1], [0, Math.PI / 2, 0]]);
    }
  } else if (kind === "bigSmile") {
    const upper = new T.QuadraticBezierCurve(new T.Vector2(-.62, .13), new T.Vector2(0, -.03), new T.Vector2(.62, .13));
    const lower = new T.CubicBezierCurve(new T.Vector2(.62, .13), new T.Vector2(.52, -.48), new T.Vector2(-.52, -.48), new T.Vector2(-.62, .13));
    const shape = new T.Shape();
    shape.moveTo(-.62, .13);
    shape.curves.push(upper, lower);
    const extrusion = new T.ExtrudeGeometry(shape, { depth: .075, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 16 });
    // The cap needs interior vertices before surface fitting: long, flat
    // triangles otherwise slice through Bob between their fitted corners.
    const grin = new TessellateModifier(.09, 8).modify(extrusion);
    extrusion.dispose();
    const vertices = grin.getAttribute("position");
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      vertices.setZ(i, vertices.getZ(i) - (curved ? x * x * .5 : 0));
    }
    grin.computeVertexNormals();
    parts.push([grin, "#ffffff"]);
    // Thin tooth seams sit on the curved front, with a dark lip around the grin.
    // Do not repeat the closing point or spline past the two mouth corners.
    const contour = [...upper.getPoints(48), ...lower.getPoints(72).slice(1, -1)]
      .map(p => new T.Vector3(p.x, p.y, .13 - (curved ? p.x * p.x * .5 : 0)));
    const outline = new T.CurvePath<T.Vector3>();
    contour.forEach((p, i) => outline.add(new T.LineCurve3(p, contour[(i + 1) % contour.length])));
    parts.push([new T.TubeGeometry(outline, 160, .014, 6, true), "#4b2621"]);
    for (const x of [-.4, -.2, 0, .2, .4]) {
      let from = 0, to = 1;
      for (let i = 0; i < 24; i++) {
        const middle = (from + to) / 2;
        if (lower.getPoint(middle).x > x) from = middle; else to = middle;
      }
      // Leave an inset for the lip and the seam's own thickness at both ends.
      const top = upper.getPoint((x + .62) / 1.24).y - .023;
      const bottom = lower.getPoint((from + to) / 2).y + .023;
      parts.push([new T.BoxGeometry(.01, top - bottom, .008, 1, 8, 1), "#817765", [x, (top + bottom) / 2, .13 - (curved ? x * x * .5 : 0)]]);
    }
  } else {
    // One continuous tube supplies shared ring positions and smooth normals.
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0), new T.Vector3(0, .2, 0),
      new T.Vector3(.06, .45, 0), new T.Vector3(.2, .7, 0),
      new T.Vector3(.42, .89, 0), new T.Vector3(.66, .91, 0),
      new T.Vector3(.84, .78, 0), new T.Vector3(.91, .57, 0),
    ]);
    const segments = 64, sides = 48;
    const tube = new T.TubeGeometry(curve, segments, 1, sides, false);
    const positions = tube.getAttribute("position");
    for (let ring = 0; ring <= segments; ring++) {
      const center = curve.getPointAt(ring / segments);
      const radius = .86 * Math.pow(1 - ring / segments, .85);
      for (let side = 0; side <= sides; side++) {
        const angle = side / sides * Math.PI * 2;
        const point = center.clone()
          .addScaledVector(tube.normals[ring], -Math.cos(angle) * radius)
          .addScaledVector(tube.binormals[ring], Math.sin(angle) * radius);
        positions.setXYZ(ring * (sides + 1) + side, point.x, point.y, point.z);
      }
    }
    tube.computeVertexNormals();
    const cap = tube.toNonIndexed();
    tube.dispose();
    const colors = new Float32Array(cap.getAttribute("position").count * 3);
    const color = new T.Color("#4c70a3");
    for (let triangle = 0; triangle < cap.getAttribute("position").count; triangle += 3) {
      for (let i = 0; i < 3; i++) color.toArray(colors, (triangle + i) * 3);
    }
    cap.setAttribute("color", new T.BufferAttribute(colors, 3));
    cap.deleteAttribute("uv");
    const details = assemble([
      [new T.CylinderGeometry(.87, .87, .15, 48), "#4c70a3", [0, .005, 0]],
      [new T.TorusGeometry(.855, .035, 8, 48), "#4c70a3", [0, .07, 0], [1, 1, 1], [Math.PI / 2, 0, 0]],
      [new T.SphereGeometry(.17, 16, 12), "#4c70a3", [.91, .55, 0]],
    ]);
    // One geometry and one draw for the cloth, cuff and pom-pom.
    const combined = new T.BufferGeometry();
    for (const attr of ["position", "normal", "color"]) {
      const values = new Float32Array(cap.getAttribute(attr).array.length + details.getAttribute(attr).array.length);
      values.set(cap.getAttribute(attr).array); values.set(details.getAttribute(attr).array, cap.getAttribute(attr).array.length);
      combined.setAttribute(attr, new T.BufferAttribute(values, 3));
    }
    cap.dispose(); details.dispose();
    return combined;
  }
  const geometry = assemble(parts);
  if (kind === "cigar") geometry.rotateZ(-.02).rotateY(-1.3).translate(.2, 0, -.05);
  if (kind === "bigSmile") {
    // Re-equipping or resizing only clones/fits the template, never rebuilds
    // the extrusion, tessellation, lip and tooth seams.
    smileTemplates.set(curved, geometry.clone());
    if (body) fitSmileGeometry(geometry, body, moustacheEquipped);
  }
  return geometry;
}

/** Fit the whole grin to the actual front surface, including rounded box corners. */
function fitSmileGeometry(geometry: T.BufferGeometry, body: BobBodyFit, moustacheEquipped: boolean) {
  const [x, y, z] = body.halfSize;
  const faceScale = getBobFaceScale(body.formType, body.parameters);
  const compact = Math.min(1, x, y, faceScale);
  const bottom = -y + .08 * compact;
  const top = Math.max(bottom + .1 * compact, body.eyePosition[1] - Math.max(.36 * faceScale, moustacheEquipped ? .59 * compact : 0));
  const height = Math.min((moustacheEquipped ? .65 : .85) * compact, (top - bottom) / .56);
  const baseline = top - .155 * height;
  const positions = geometry.getAttribute("position");
  let width = Math.min(faceScale, x * 1.1);
  const radii = new Map<number, number>();
  const ringRadius = (atY: number) => {
    let radius = radii.get(atY);
    if (radius === undefined) {
      radius = body.formType === "egg"
        ? getEggRadiusAtY(atY, body.parameters) : Math.sqrt(Math.max(0, x * x - atY * atY));
      radii.set(atY, radius);
    }
    return radius;
  };
  if (!isBoxForm(body.formType)) {
    for (let i = 0; i < positions.count; i++) {
      const authoredX = Math.abs(positions.getX(i));
      if (authoredX > .001) width = Math.min(width, ringRadius(baseline + positions.getY(i) * height) * .9 / authoredX);
    }
  }
  for (let i = 0; i < positions.count; i++) {
    const px = positions.getX(i) * width;
    const py = baseline + positions.getY(i) * height;
    let surface: number;
    if (isBoxForm(body.formType)) {
      const r = body.cornerRadius;
      const dx = Math.max(0, Math.abs(px) - (x - r));
      const dy = Math.max(0, Math.abs(py) - (y - r));
      surface = z - r + Math.sqrt(Math.max(0, r * r - dx * dx - dy * dy));
    } else {
      const radius = ringRadius(py);
      surface = Math.sqrt(Math.max(0, radius * radius - px * px));
    }
    positions.setXYZ(i, px, py, surface + .035 * compact + positions.getZ(i) * .2 * compact);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function CigarSmoke() {
  const mesh = useRef<T.InstancedMesh>(null);
  const material = useRef<T.MeshBasicMaterial>(null);
  const effects = useCoreStore(s => s.graphicPreferences.effectsEnabled && !s.graphicPreferences.reducedTapMotion);
  const dummy = useMemo(() => new T.Object3D(), []);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    if (effects) elapsed.current += Math.min(delta, .05);
    for (let i = 0; i < 6; i++) {
      const age = (elapsed.current * .55 + i / 6) % 1;
      dummy.position.set(.805 + Math.sin(age * 7 + i) * .045 * age, .02 + age * .62, Math.sin(age * 4) * .025);
      dummy.scale.setScalar(effects ? Math.sin(age * Math.PI) * (.025 + age * .045) : 0);
      dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, 6]} frustumCulled={false}>
    <icosahedronGeometry args={[1, 1]} /><meshBasicMaterial ref={material} color="#d5d0c8" transparent opacity={.24} depthWrite={false} />
  </instancedMesh>;
}

export function PlayfulWardrobe({ kind, position, scale, formType, body, moustacheEquipped = false }: {
  kind: PlayfulWardrobeKind; position: Vec3; scale: Vec3; formType: string; body?: BobBodyFit; moustacheEquipped?: boolean;
}) {
  const curved = formType === "sphere" || formType === "egg";
  const geometry = useMemo(() => playfulWardrobeGeometry(kind, body && kind === "bigSmile" ? false : curved, body, moustacheEquipped), [kind, curved, body, moustacheEquipped]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={position} scale={scale} name={kind}>
    <mesh geometry={geometry} raycast={kind === "bigSmile" ? ignoreSmileRaycast : T.Mesh.prototype.raycast}
      castShadow={kind !== "bigSmile"} receiveShadow={kind !== "bigSmile"}>
      <WorldToonMaterial vertexColors side={T.DoubleSide} />
    </mesh>
    {kind === "cigar" && <group position={[.2, 0, -.05]} rotation={[0, -1.3, -.02]}>
        <mesh position={[.794, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[.075, .075, .016, 20]} /><meshBasicMaterial color="#ff6b2b" toneMapped={false} />
        </mesh>
        <CigarSmoke />
    </group>}
  </group>;
}
