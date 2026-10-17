import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { seededRandom, useWorldQuality } from "./quality";
import { grassGroundTexture } from "./grassField";
import { useWorldEnvironment } from "./WorldEnvironment";
import { ForestFlowers } from "./ForestFlowers";

export type GrassExclusion = { center: [number, number]; radius: number } | { center: [number, number]; size: [number, number] };
export interface GrassFieldProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  radius?: number;
  /** Rectangular coverage for pitches and gardens. Overrides radius. */
  size?: [number, number];
  height?: number;
  density?: number;
  seed?: number;
  exclusions?: GrassExclusion[];
  flowers?: boolean;
}
const noExclusions: GrassExclusion[] = [];

function GrassBand({ inner, outer, count, height, size, exclusions, seed }: {
  inner: number; outer: number; count: number; height: number; size?: [number, number]; exclusions: GrassExclusion[]; seed: number;
}) {
  const environment = useWorldEnvironment();
  const material = useRef<T.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const plane = new T.PlaneGeometry(1, 1, 1, inner === 0 ? 3 : 1);
    plane.translate(0, .5, 0);
    const g = new T.InstancedBufferGeometry();
    g.index = plane.index;
    g.setAttribute("position", plane.getAttribute("position"));
    g.setAttribute("uv", plane.getAttribute("uv"));
    const random = seededRandom(seed);
    const roots: number[] = [];
    const shapes: number[] = [];
    for (let attempts = 0; roots.length / 3 < count && attempts < count * 8; attempts++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(inner * inner + random() * (outer * outer - inner * inner));
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      if (size && (Math.abs(x) > size[0] / 2 || Math.abs(z) > size[1] / 2)) continue;
      if (exclusions.some((e) => "radius" in e
        ? Math.hypot(x - e.center[0], z - e.center[1]) < e.radius
        : Math.abs(x - e.center[0]) < e.size[0] / 2 && Math.abs(z - e.center[1]) < e.size[1] / 2)) continue;
      roots.push(x, 0, z);
      const patch = .5 + .25 * Math.sin(x * .5 + Math.sin(z * .3)) + .25 * Math.cos(z * .8);
      shapes.push((.08 + random() * .06) * Math.min(1, height / .4) * (inner ? 2.6 : 1), height * (.6 + random() * .8) * (.85 + patch * .3), random(), patch);
    }
    g.setAttribute("aRoot", new T.InstancedBufferAttribute(new Float32Array(roots), 3));
    g.setAttribute("aShape", new T.InstancedBufferAttribute(new Float32Array(shapes), 4));
    g.instanceCount = roots.length / 3;
    g.boundingSphere = new T.Sphere(new T.Vector3(), outer + height + 2);
    plane.dispose();
    return g;
  }, [inner, outer, count, height, size, exclusions, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(() => ({
    ...T.UniformsUtils.clone(T.UniformsLib.fog),
    uTime: { value: 0 }, uWind: { value: .35 }, uDaylight: { value: 1 }, uRain: { value: 0 },
    uBase: { value: new T.Color("#315925") }, uTip: { value: new T.Color("#86a95b") },
  }), []);
  useFrame(() => {
    if (!material.current) return;
    const u = material.current.uniforms, state = environment.current;
    u.uTime.value = state.elapsed; u.uWind.value = state.wind;
    u.uDaylight.value = state.daylight; u.uRain.value = state.rain;
  });
  return <mesh geometry={geometry} name={`meadow-grass-${inner ? "far" : "near"}`}>
    <shaderMaterial ref={material} uniforms={uniforms} fog side={T.DoubleSide}
      vertexShader={`
        #include <fog_pars_vertex>
        attribute vec3 aRoot;
        attribute vec4 aShape;
        uniform float uTime, uWind;
        varying float vHeight, vTone, vLight;
        void main() {
          float h = uv.y;
          vec4 root = modelMatrix * vec4(aRoot, 1.0);
          // Cube-face cameras share a position, but have different view axes.
          // A cylindrical billboard built from that shared position has no face seams.
          vec2 toEye = cameraPosition.xz - root.xz;
          toEye /= max(length(toEye), .0001);
          vec3 right = vec3(toEye.y, 0.0, -toEye.x);
          float sx = length(modelMatrix[0].xyz), sy = length(modelMatrix[1].xyz);
          vec3 p = root.xyz + right * position.x * aShape.x * (1.0 - pow(h, 1.25) * .98) * sx;
          p.y += position.y * aShape.y * sy;
          float gust = sin(root.x * .24 + root.z * .19 - uTime * 1.15);
          float flutter = sin(root.x * 1.8 - root.z * .7 + uTime * 3.0 + aShape.z * 6.28);
          float bend = (.12 + gust * .2 + flutter * .035) * uWind * h * h * aShape.y * 1.5;
          p.x += bend * sx;
          p.z += (.06 + gust * .09) * uWind * h * h * sx * aShape.y * 1.5;
          p += right * (aShape.z - .5) * h * h * .18 * sx * aShape.y;
          vHeight = h; vTone = aShape.w; vLight = .88 + aShape.z * .16;
          vec4 mvPosition = viewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`}
      fragmentShader={`
        #include <fog_pars_fragment>
        uniform vec3 uBase, uTip;
        uniform float uDaylight, uRain;
        varying float vHeight, vTone, vLight;
        void main() {
          vec3 color = mix(uBase, uTip, pow(vHeight, .75));
          color *= (.86 + vTone * .24) * vLight * mix(.65, 1.0, smoothstep(0.0,.4,vHeight));
          color *= mix(vec3(.19,.27,.4), vec3(1.0), uDaylight) * (1.0 - uRain * .12);
          gl_FragColor = vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`}
    />
  </mesh>;
}

/** Reusable dense grass: shape, mowing height, density, seed, and clearings are independent. */
export function GrassField({ position, scale, radius = 36, size, height = .48, density = 1, seed = 128, exclusions = noExclusions, flowers = false }: GrassFieldProps) {
  const quality = useWorldQuality();
  const environment = useWorldEnvironment();
  const ground = useRef<T.MeshBasicMaterial>(null);
  const nightTint = useMemo(() => new T.Color(.19, .27, .4), []);
  const extent = size ? Math.hypot(...size) / 2 : radius;
  const near = Math.min(18, extent);
  const texture = useMemo(() => grassGroundTexture(extent), [extent]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    ground.current?.color.setRGB(1, 1, 1).lerp(nightTint, 1 - environment.current.daylight).multiplyScalar(1 - environment.current.rain * .12);
  });
  // Match area on small reusable patches; distant scenery uses wider, simpler blades.
  const budget = { low: 18000, medium: 52000, high: 85000 }[quality] * density;
  const nearCount = Math.round(budget * Math.min(1, (near * near) / 324));
  return <group position={position} scale={scale}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.015, 0]}>
      {size ? <planeGeometry args={size} /> : <circleGeometry args={[radius, 64]} />}
      <meshBasicMaterial ref={ground} map={texture} />
    </mesh>
    <GrassBand inner={0} outer={near} count={nearCount} height={height} size={size} exclusions={exclusions} seed={seed} />
    {extent > near && <GrassBand inner={near - 1} outer={extent} count={Math.round(budget * .75)} height={height * 1.15} size={size} exclusions={exclusions} seed={seed + 1} />}
    {flowers && <ForestFlowers radius={radius} rootOffset={0} />}
  </group>;
}
