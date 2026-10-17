import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, ModelInstances, type Part, type Placement, type Vec3 } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";
import { useWorldEnvironment } from "./WorldEnvironment";

type Canopy = { center: Vec3; size: Vec3; scale: number };
const treeCrowns: [Vec3, Vec3][] = [
  [[0, 3.6, 0], [1.7, 1.6, 1.5]],
  [[-1.05, 2.85, .3], [1.3, 1, 1.2]],
  [[1.1, 3.15, -.2], [1.25, 1.25, 1.3]],
  [[.2, 3.05, 1], [1.15, 1.1, 1.1]],
];
const bushCrowns: [Vec3, Vec3][] = [
  [[0, .5, 0], [.78, .63, .66]],
  [[-.58, .31, .14], [.55, .4, .52]],
  [[.56, .36, -.06], [.58, .46, .56]],
];

function trunkGeometry() {
  const parts: Part[] = [[new T.CylinderGeometry(.14, .3, 3.2, 7), "#79583d", [0, 1.6, 0]]];
  for (const side of [-1, 1]) {
    parts.push([new T.CylinderGeometry(.055, .14, 1.9, 6), "#856044", [side * .5, 2.55, 0], [1, 1, 1], [0, 0, side * -.6]]);
  }
  return assemble(parts);
}

/** Camera-facing, alpha-cut leaf silhouettes with canopy-surface normals for soft volume. */
function LeafCanopies({ canopies, seed, bush }: { canopies: Canopy[]; seed: number; bush: boolean }) {
  const quality = useWorldQuality();
  const environment = useWorldEnvironment();
  const material = useRef<T.ShaderMaterial>(null);
  const perCanopy = { low: 52, medium: 100, high: 150 }[quality];
  const geometry = useMemo(() => {
    const plane = new T.PlaneGeometry(1, 1);
    const geometry = new T.InstancedBufferGeometry();
    geometry.index = plane.index;
    geometry.setAttribute("position", plane.getAttribute("position"));
    geometry.setAttribute("uv", plane.getAttribute("uv"));
    const centers: number[] = [], normals: number[] = [], shapes: number[] = [];
    const random = seededRandom(seed);
    canopies.forEach(({ center, size, scale }) => {
      for (let i = 0; i < perCanopy; i++) {
        const y = random() * 2 - 1, angle = random() * Math.PI * 2;
        const r = Math.sqrt(1 - y * y), x = Math.cos(angle) * r, z = Math.sin(angle) * r;
        const shell = .65 + random() * .35;
        centers.push(center[0] + x * size[0] * shell, center[1] + y * size[1] * shell, center[2] + z * size[2] * shell);
        normals.push(x, y, z);
        const leafSize = (bush ? .48 : .65) * scale * (.8 + random() * .5) * (quality === "low" ? 1.35 : 1);
        shapes.push(leafSize, random() * Math.PI * 2, random(), random());
      }
    });
    geometry.setAttribute("aCenter", new T.InstancedBufferAttribute(new Float32Array(centers), 3));
    geometry.setAttribute("aNormal", new T.InstancedBufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute("aShape", new T.InstancedBufferAttribute(new Float32Array(shapes), 4));
    geometry.instanceCount = centers.length / 3;
    plane.dispose();
    return geometry;
  }, [canopies, seed, bush, perCanopy, quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(() => ({
    ...T.UniformsUtils.clone(T.UniformsLib.fog),
    uTime: { value: 0 }, uWind: { value: .35 }, uDaylight: { value: 1 }, uRain: { value: 0 },
    uShadow: { value: new T.Color("#284a31") }, uMid: { value: new T.Color("#557b42") }, uHighlight: { value: new T.Color("#8daa62") },
  }), []);
  useFrame(() => {
    if (!material.current) return;
    const state = environment.current, u = material.current.uniforms;
    u.uTime.value = state.elapsed; u.uWind.value = state.wind;
    u.uDaylight.value = state.daylight; u.uRain.value = state.rain;
  });
  return <mesh geometry={geometry} frustumCulled={false} name={bush ? "leafy-bushes" : "leafy-tree-canopies"}>
    <shaderMaterial ref={material} uniforms={uniforms} fog side={T.DoubleSide}
      vertexShader={`
        #include <fog_pars_vertex>
        attribute vec3 aCenter, aNormal;
        attribute vec4 aShape;
        uniform float uTime, uWind;
        varying vec2 vUv;
        varying float vLight, vTone;
        void main() {
          vec4 center = modelMatrix * vec4(aCenter,1.0);
          float gust = sin(center.x * .24 + center.z * .19 - uTime * 1.15);
          float flutter = sin(uTime * 2.8 + aShape.z * 6.28 + center.x);
          center.x += (gust * .14 + flutter * .025) * uWind * min(2.0, max(.15, aCenter.y * .18));
          center.z += gust * .055 * uWind;
          float angle = aShape.y + flutter * .12 * uWind;
          mat2 turn = mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
          vec3 toEye = normalize(cameraPosition - center.xyz);
          vec3 right = normalize(cross(vec3(0.0,1.0,.0001),toEye));
          vec3 up = cross(toEye,right);
          vec2 card = turn * position.xy * aShape.x * length(modelMatrix[0].xyz);
          center.xyz += right * card.x + up * card.y;
          vec4 mvPosition = viewMatrix * center;
          vUv = uv; vTone = aShape.w;
          vec3 normal = normalize(mat3(modelMatrix) * aNormal);
          vLight = clamp(dot(normal,normalize(vec3(-.4,.85,.35))) * .5 + .5, 0.0,1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`}
      fragmentShader={`
        #include <fog_pars_fragment>
        uniform vec3 uShadow, uMid, uHighlight;
        uniform float uDaylight, uRain;
        varying vec2 vUv;
        varying float vLight, vTone;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          // Tapered leaf instead of a square card or a solid geometric crown.
          float width = .76 * sqrt(max(0.0,1.0-p.y*p.y)) * (1.0-p.y*.28);
          if (abs(p.x) > width || abs(p.y) > .99) discard;
          float light = clamp(vLight + (vTone-.5)*.15,0.0,1.0);
          vec3 color = mix(uShadow,uMid,smoothstep(.0,.55,light));
          color = mix(color,uHighlight,smoothstep(.5,1.0,light));
          color *= mix(vec3(.2,.28,.43),vec3(1.0),uDaylight) * (1.0-uRain*.15);
          gl_FragColor = vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`}
    />
  </mesh>;
}

function useCanopies(placements: Placement[], crowns: [Vec3, Vec3][]) {
  return useMemo(() => {
    const matrix = new T.Matrix4(), quaternion = new T.Quaternion(), point = new T.Vector3();
    return placements.flatMap((p) => {
      quaternion.setFromEuler(new T.Euler(...(p.rotation ?? [0, 0, 0])));
      matrix.compose(new T.Vector3(...p.position), quaternion, new T.Vector3(...p.scale));
      return crowns.map(([center, size]): Canopy => {
        point.set(...center).applyMatrix4(matrix);
        return { center: point.toArray() as Vec3, size: size.map((v, i) => v * p.scale[i]) as Vec3, scale: p.scale[0] };
      });
    });
  }, [placements, crowns]);
}

/** Placements are supplied by the consuming world; these components own no world layout. */
export function StylizedTrees({ placements, seed = 41 }: { placements: Placement[]; seed?: number }) {
  const canopies = useCanopies(placements, treeCrowns);
  return <>
    <ModelInstances toon name="forest-tree-trunks" build={trunkGeometry} placements={placements} />
    <LeafCanopies canopies={canopies} seed={seed} bush={false} />
  </>;
}
export function StylizedBushes({ placements, seed = 622 }: { placements: Placement[]; seed?: number }) {
  const canopies = useCanopies(placements, bushCrowns);
  return <LeafCanopies canopies={canopies} seed={seed} bush />;
}
