import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { seededRandom, useWorldQuality } from "./quality";
import { grassGroundTexture, grassPatch } from "./grassField";
import { FIRE_LIGHT_POSITION, FIRE_LIGHT_TINT, firelightStrength, firelightGLSL } from "./firelight";
import { useWorldEnvironmentConfig, useWorldEnvironment } from "./WorldEnvironment";
import { ForestFlowers } from "./ForestFlowers";
import { createGrassBatches, updateGrassBatches, grassDistanceGLSL, grassDetailDistances, partitionGrassInstances, type GrassQuality } from "./grassLOD";

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

const grassVertexShader = `
        #include <fog_pars_vertex>
        attribute vec3 aRoot;
        attribute vec4 aShape;
        uniform float uTime, uWind;
        ${grassDistanceGLSL}
        varying float vHeight, vTone, vLight;
        varying vec3 vFirePosition;
        void main() {
          float h = uv.y;
          float fade = grassVisibility(aRoot.xz, aShape.z);
          // Use the shared eye position, so cube-face views have identical blades.
          vec2 toEye = uEye - aRoot.xz;
          toEye /= max(length(toEye), .0001);
          vec3 right = vec3(toEye.y, 0.0, -toEye.x);
          float angle = aShape.z * 6.283185;
          vec3 lean = vec3(cos(angle), 0.0, sin(angle));
          float curve = h * h;
          // Posture is independent of the density rank, keeping the same mix at distance.
          float posture = fract(sin(dot(aRoot.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float curved = step(.3, posture);
          float windShape = mix(h, curve, curved);
          float gust = sin(aRoot.x * .32 + aRoot.z * .2 - uTime * 1.1);
          float ripple = sin(aRoot.x * 1.5 - aRoot.z * .7 + uTime * 2.7 + angle);
          // Seventy percent arch in calm weather; straight blades lean as a whole in wind.
          vec3 offset = right * position.x * aShape.x * (1.0 - pow(h, 1.15));
          offset.y = h * (1.0 - .22 * h * curved) * aShape.y;
          offset += lean * curve * aShape.y * (.3 + aShape.z * .4) * curved;
          offset.x += (gust * .23 + ripple * .04) * uWind * windShape * aShape.y;
          offset.z += sin(aRoot.z * .28 + uTime * .85) * .12 * uWind * windShape * aShape.y;
          vec3 p = (modelMatrix * vec4(aRoot + offset * fade, 1.0)).xyz;
          vHeight = h; vTone = aShape.w; vLight = .88 + aShape.z * .16;
          vFirePosition = p;
          vec4 mvPosition = viewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`;
const grassFragmentShader = `
        #include <fog_pars_fragment>
        ${firelightGLSL}
        uniform vec3 uBase, uTip;
        uniform float uDaylight, uRain;
        varying float vHeight, vTone, vLight;
        void main() {
          vec3 color = mix(uBase, uTip, pow(vHeight, .75));
          color *= (.86 + vTone * .24) * vLight * mix(.65, 1.0, smoothstep(0.0,.4,vHeight));
          vec3 fireColor = color;
          color *= mix(vec3(.19,.27,.4), vec3(1.0), uDaylight) * (1.0 - uRain * .12);
          if (uFireStrength > 0.0) {
            // Light the facing parts in two toon bands, including the bent blade tips.
            vec3 bladeNormal = normalize(cross(dFdx(vFirePosition), dFdy(vFirePosition)));
            float facing = abs(dot(bladeNormal, normalize(uFirePosition - vFirePosition)));
            float fireBand = step(.25, facing) * .45 + step(.65, facing) * .55;
            color += fireColor * uFireTint * uFireStrength * fireReach() * fireBand;
          }
          gl_FragColor = vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`;

function GrassBlades({ extent, near, nearCount, farCount, height, size, exclusions, seed, quality }: {
  extent: number; near: number; nearCount: number; farCount: number; height: number;
  size?: [number, number]; exclusions: GrassExclusion[]; seed: number; quality: GrassQuality;
}) {
  const root = useRef<T.Group>(null);
  const meshes = useRef<(T.Mesh | null)[]>([]);
  const environment = useWorldEnvironment();
  const config = useWorldEnvironmentConfig();
  // Callers commonly pass inline arrays. Key generation by values, so tapping or
  // other parent renders cannot rebuild buffers or reset their LOD counts.
  const layoutKey = JSON.stringify([size, exclusions]);
  const source = useMemo(() => {
    const [fieldSize, clearings] = JSON.parse(layoutKey) as [[number, number] | null, GrassExclusion[]];
    const roots: number[] = [], shapes: number[] = [];
    const addBand = (inner: number, outer: number, count: number, bandSeed: number) => {
      const random = seededRandom(bandSeed);
      let cx = 0, cz = 0, yaw = 0;
      for (let attempts = 0, accepted = 0; accepted < count && attempts < count * 12; attempts++) {
        if (attempts % 5 === 0) {
          const angle = random() * Math.PI * 2;
          const radius = Math.sqrt(inner * inner + random() * (outer * outer - inner * inner));
          cx = Math.cos(angle) * radius; cz = Math.sin(angle) * radius;
          yaw = random() * Math.PI * 2;
        }
        const spread = (.06 + random() * .18) * Math.min(1, height / .4);
        const angle = yaw + attempts % 5 * 2.4;
        const x = cx + Math.cos(angle) * spread, z = cz + Math.sin(angle) * spread;
        if (Math.hypot(x, z) > extent) continue;
        if (fieldSize && (Math.abs(x) > fieldSize[0] / 2 || Math.abs(z) > fieldSize[1] / 2)) continue;
        if (clearings.some(e => "radius" in e
          ? Math.hypot(x - e.center[0], z - e.center[1]) < e.radius
          : Math.abs(x - e.center[0]) < e.size[0] / 2 && Math.abs(z - e.center[1]) < e.size[1] / 2)) continue;
        const patch = grassPatch(x, z);
        const edge = fieldSize ? 1 : 1 - T.MathUtils.smoothstep(Math.hypot(x, z), extent * .9, extent);
        roots.push(x, 0, z);
        shapes.push((.12 + random() * .1) * Math.min(1, height / .4) * (inner ? 1.8 : 1),
          height * (.65 + random() * .7) * (.85 + patch * .3) * edge, random(), patch);
        accepted++;
      }
    };
    addBand(0, near, nearCount, seed);
    if (farCount) addBand(near - 1, extent, farCount, seed + 1);
    return partitionGrassInstances(new Float32Array(roots), new Float32Array(shapes), 3, 4);
  }, [extent, near, nearCount, farCount, height, seed, layoutKey]);
  const geometry = useMemo(() => {
    const count = source.reduce((sum, chunk) => sum + chunk.count, 0);
    const batches = createGrassBatches(count);
    return batches.map((batch, i) => {
      const plane = new T.PlaneGeometry(1, 1, 1, [4, 2, 1][i]);
      plane.translate(0, .5, 0);
      const g = new T.InstancedBufferGeometry();
      g.setIndex(plane.index);
      g.setAttribute("position", plane.getAttribute("position"));
      g.setAttribute("uv", plane.getAttribute("uv"));
      g.setAttribute("aRoot", new T.InstancedBufferAttribute(batch.roots, 3).setUsage(T.DynamicDrawUsage));
      g.setAttribute("aShape", new T.InstancedBufferAttribute(batch.shapes, 4).setUsage(T.DynamicDrawUsage));
      g.instanceCount = 0;
      // Shader positions include the roots; default plane bounds are incorrect.
      g.boundingSphere = new T.Sphere(new T.Vector3(0, height, 0), extent + height * 3 + 1);
      return { batch, geometry: g };
    });
  }, [source, extent, height]);
  useEffect(() => () => geometry.forEach(item => item.geometry.dispose()), [geometry]);
  const uniforms = useMemo(() => ({
    ...T.UniformsUtils.clone(T.UniformsLib.fog),
    uEye: { value: new T.Vector2() }, uDetailDistances: { value: new T.Vector3() },
    uTime: { value: 0 }, uWind: { value: .35 }, uDaylight: { value: 1 }, uRain: { value: 0 },
    uFirePosition: { value: FIRE_LIGHT_POSITION }, uFireTint: { value: FIRE_LIGHT_TINT }, uFireStrength: { value: 0 },
    uBase: { value: new T.Color("#315925") }, uTip: { value: new T.Color("#86a95b") },
  }), []);
  const shader = useMemo(() => new T.ShaderMaterial({ uniforms, fog: true, side: T.DoubleSide,
    vertexShader: grassVertexShader, fragmentShader: grassFragmentShader }), [uniforms]);
  useEffect(() => () => shader.dispose(), [shader]);
  const eye = useMemo(() => new T.Vector3(), []);
  const lastEye = useRef({ x: Infinity, z: Infinity, quality, geometry });
  useFrame(({ camera }) => {
    const state = environment.current;
    const limits = grassDetailDistances[quality];
    uniforms.uDetailDistances.value.set(limits.detailed, limits.sparse, limits.end);
    uniforms.uTime.value = state.elapsed; uniforms.uWind.value = state.wind;
    uniforms.uDaylight.value = state.daylight; uniforms.uRain.value = state.rain;
    uniforms.uFireStrength.value = config?.nightLight === "fire" ? firelightStrength(state.elapsed, state.daylight) : 0;
    if (!root.current) return;
    root.current.updateWorldMatrix(true, false);
    camera.getWorldPosition(eye); root.current.worldToLocal(eye);
    uniforms.uEye.value.set(eye.x, eye.z);
    const last = lastEye.current;
    // Wind and auto taps only update uniforms. Upload instances on camera travel
    // or a real field/quality change, never on each cube face or counter payout.
    if (last.geometry === geometry && last.quality === quality && Math.hypot(last.x - eye.x, last.z - eye.z) < .1) return;
    updateGrassBatches(source, geometry.map(item => item.batch), eye.x, eye.z, quality);
    geometry.forEach((item, i) => {
      item.geometry.instanceCount = item.batch.count;
      if (meshes.current[i]) meshes.current[i]!.visible = item.batch.count > 0;
      for (const [name, stride] of [["aRoot", 3], ["aShape", 4]] as const) {
        const attribute = item.geometry.getAttribute(name) as T.InstancedBufferAttribute;
        attribute.clearUpdateRanges();
        if (item.batch.count) { attribute.addUpdateRange(0, item.batch.count * stride); attribute.needsUpdate = true; }
      }
    });
    lastEye.current = { x: eye.x, z: eye.z, quality, geometry };
  }, -1.5);
  return <group ref={root} name="grass-batches">
    {geometry.map((item, i) => <mesh key={i} ref={mesh => { meshes.current[i] = mesh; }}
      name={`grass-lod-${i}`} geometry={item.geometry} material={shader} dispose={null} />)}
  </group>;
}

/** Reusable dense grass: shape, mowing height, density, seed, and clearings are independent. */
export const GrassField = memo(function GrassField({ position, scale, radius = 36, size, height = .48, density = 1, seed = 128, exclusions = noExclusions, flowers = false }: GrassFieldProps) {
  const quality = useWorldQuality();
  const environment = useWorldEnvironment();
  const config = useWorldEnvironmentConfig();
  const ground = useRef<T.MeshBasicMaterial>(null);
  const groundFire = useMemo(() => ({
    uFirePosition: { value: FIRE_LIGHT_POSITION },
    uFireTint: { value: FIRE_LIGHT_TINT },
    uFireStrength: { value: 0 },
  }), []);
  const patchGround = useMemo(() => (shader: T.WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, groundFire);
    shader.vertexShader = 'varying vec3 vFirePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>',
      'vFirePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>');
    shader.fragmentShader = firelightGLSL + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight += texture2D(map, vMapUv).rgb * uFireTint * uFireStrength * fireReach();\n#include <opaque_fragment>');
  }, [groundFire]);
  const nightTint = useMemo(() => new T.Color(.19, .27, .4), []);
  const extent = size ? Math.hypot(...size) / 2 : radius;
  const near = Math.min(18, extent);
  const texture = useMemo(() => grassGroundTexture(extent), [extent]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    const state = environment.current;
    groundFire.uFireStrength.value = config?.nightLight === "fire" ? firelightStrength(state.elapsed, state.daylight) : 0;
    ground.current?.color.setRGB(1, 1, 1).lerp(nightTint, 1 - environment.current.daylight).multiplyScalar(1 - environment.current.rain * .12);
  });
  // Match area on small reusable patches; distant scenery uses wider, simpler blades.
  const budget = { low: 18000, medium: 52000, high: 85000 }[quality] * density;
  const nearCount = Math.round(budget * Math.min(1, (near * near) / 324));
  return <group position={position} scale={scale}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.015, 0]}>
      {size ? <planeGeometry args={size} /> : <circleGeometry args={[radius, 64]} />}
      <meshBasicMaterial ref={ground} map={texture} onBeforeCompile={patchGround} customProgramCacheKey={() => "grass-ground-fire-v1"} />
    </mesh>
    <GrassBlades extent={extent} near={near} nearCount={nearCount} farCount={extent > near ? Math.round(budget * .75) : 0}
      height={height} size={size} exclusions={exclusions} seed={seed} quality={quality} />
    {flowers && <ForestFlowers radius={radius} rootOffset={0} />}
  </group>;
});
