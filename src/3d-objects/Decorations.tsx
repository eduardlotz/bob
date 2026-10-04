import { useLayoutEffect, useMemo, useRef } from "react";
import { extend, useFrame } from "@react-three/fiber";
import {
  GradientTexture,
  Grid,
  Sparkles,
  shaderMaterial,
  useGLTF,
} from "@react-three/drei";
import { BackSide, DoubleSide, InstancedMesh, Object3D, Vector3 } from "three";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import {
  useAppStore,
  useCoreStore,
  WorldEffectId,
  WorldModelId,
  WorldSceneConfig,
} from "@/store";
import { GrassShader } from "./GrassShader";
import { CloudEffect, ForestRainEffect, SnowEffect } from "./ParticleEffects";

const TREE_PATH = "/gltf/tree.gltf";
const LARGE_FLOOR_SIZE = 80;
const FLOOR_Y = -1.36;
const HOME_HEAD_ANCHOR = new Vector3(0, 0, 0);
const HOME_COUNTER_ANCHOR = new Vector3(0, -1, -3);
const MOON_RADIUS = 16;
const MOON_SEGMENTS_HIGH = 56;
const MOON_SEGMENTS_LOW = 28;
const MOON_CENTER = new Vector3(
  HOME_HEAD_ANCHOR.x,
  FLOOR_Y - MOON_RADIUS - 0.08,
  THREE.MathUtils.lerp(HOME_HEAD_ANCHOR.z, HOME_COUNTER_ANCHOR.z, 0.24),
);
const MOON_SURFACE_ROTATION: [number, number, number] = [0.48, -0.22, 0.84];
const MOON_UFO_CYCLE_SECONDS = 30;
const MOON_UFO_FLIGHT_SECONDS = 7.5;
const SPACE_WORLD_EFFECT_IDS = new Set([
  "world_space",
  "space_void",
  "space_stars",
  "space_nebula",
  "space_dust",
  "space_meteors",
]);
const SPACE_WORLD_MODEL_IDS = new Set([
  "space_planet",
  "space_moon",
  "space_rings",
]);
const DEFAULT_WORLD_SCENE: WorldSceneConfig = {
  skyColors: ["#c8f3ff", "#84c5ff"],
  gradientStops: [0, 0.5, 1],
  gradientColors: ["#ffffff", "#c5bdd5", "#85799f"],
  groundColor: "#345d36",
  accentColor: "#86cf72",
  models: [],
  effects: [],
  starfield: false,
};

type WorldSceneLighting = {
  ambientIntensity?: number;
  directionalIntensity?: number;
  moonGlowIntensity?: number;
  spaceGlowIntensity?: number;
};

type WorldSceneConfigEx = WorldSceneConfig & {
  lighting?: WorldSceneLighting;
};

const MoonSurfaceMaterial = shaderMaterial(
  {
    uBaseColor: new THREE.Color("#f1df9b"),
    uCraterColor: new THREE.Color("#baa46a"),
    uGlowColor: new THREE.Color("#fff0ba"),
    uGlowStrength: 1,
  },
  `
    varying vec3 vSphereNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying float vCraterMask;
    varying float vCraterRim;

    vec2 hash22(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453123);
    }

    float voronoi2d(vec2 x) {
      vec2 n = floor(x);
      vec2 f = fract(x);
      float md = 8.0;

      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash22(n + g);
          vec2 r = g + o - f;
          float d = dot(r, r);
          md = min(md, d);
        }
      }

      return sqrt(md);
    }

    float triplanarVoronoi(vec3 p, vec3 n) {
      vec3 blend = pow(abs(n), vec3(3.5));
      blend /= max(dot(blend, vec3(1.0)), 0.0001);

      float x = voronoi2d(p.yz);
      float y = voronoi2d(p.xz);
      float z = voronoi2d(p.xy);

      return x * blend.x + y * blend.y + z * blend.z;
    }

    void main() {
      vec3 sphereNormal = normalize(position);
      float craterField = triplanarVoronoi(sphereNormal * 11.2, sphereNormal);
      float craterMask = 1.0 - smoothstep(0.08, 0.24, craterField);
      float craterRim =
        smoothstep(0.18, 0.46, craterMask) *
        (1.0 - smoothstep(0.46, 0.86, craterMask));
      float displacement = craterMask * 1.4 - craterRim * 0.42;
      vec3 displacedPosition = position - sphereNormal * displacement;
      vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);

      vSphereNormal = sphereNormal;
      vCraterMask = craterMask;
      vCraterRim = craterRim;
      vWorldNormal = normalize(mat3(modelMatrix) * sphereNormal);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  `
    uniform vec3 uBaseColor;
    uniform vec3 uCraterColor;
    uniform vec3 uGlowColor;
    uniform float uGlowStrength;

    varying vec3 vSphereNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying float vCraterMask;
    varying float vCraterRim;

    float hash11(float p) {
      return fract(sin(p * 127.1) * 43758.5453123);
    }

    vec2 hash22(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = hash11(dot(i, vec2(1.0, 57.0)));
      float b = hash11(dot(i + vec2(1.0, 0.0), vec2(1.0, 57.0)));
      float c = hash11(dot(i + vec2(0.0, 1.0), vec2(1.0, 57.0)));
      float d = hash11(dot(i + vec2(1.0, 1.0), vec2(1.0, 57.0)));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;

      for (int i = 0; i < 3; i++) {
        value += amplitude * noise(p);
        p *= 1.94;
        amplitude *= 0.55;
      }

      return value;
    }

    float triplanarFbm(vec3 p, vec3 n) {
      vec3 blend = pow(abs(n), vec3(3.0));
      blend /= max(dot(blend, vec3(1.0)), 0.0001);

      float x = fbm(p.yz);
      float y = fbm(p.xz);
      float z = fbm(p.xy);

      return x * blend.x + y * blend.y + z * blend.z;
    }

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      vec3 lightDirection = normalize(vec3(0.18, 1.0, 0.14));

      float dust = triplanarFbm(vSphereNormal * 4.8 + vec3(3.1, 1.7, 2.3), vSphereNormal);
      float microNoise = noise(vSphereNormal.xy * 18.0 + vSphereNormal.zx * 9.5);
      float maria = smoothstep(
        0.42,
        0.82,
        triplanarFbm(vSphereNormal * 2.2 + vec3(1.4, 5.6, 2.8), vSphereNormal)
      );
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float halfLambert = diffuse * 0.5 + 0.5;
      float skyBounce = pow(max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0), 0.8);
      float limb = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.4);
      float bottomGlow = smoothstep(-0.92, -0.12, vSphereNormal.y) * uGlowStrength;
      float craterOcclusion = vCraterMask * 0.3 + microNoise * 0.06;

      vec3 regolithColor =
        mix(uBaseColor * 0.92, uGlowColor, dust * 0.08 + microNoise * 0.03);
      vec3 mariaColor = mix(uBaseColor * 0.68, uCraterColor, 0.66);
      vec3 craterColor = mix(uCraterColor * 0.72, uCraterColor, microNoise * 0.28);

      vec3 color = mix(regolithColor, mariaColor, maria * 0.44);
      color = mix(
        color,
        craterColor,
        clamp(vCraterMask * 0.94 + microNoise * 0.05, 0.0, 1.0)
      );
      color = mix(
        color,
        uGlowColor,
        vCraterRim * 0.2 + bottomGlow * 0.06 + limb * 0.04
      );

      float shading = 0.12 + halfLambert * 0.58 + skyBounce * 0.14;
      shading *= 1.0 - craterOcclusion;
      shading += vCraterRim * 0.16;

      vec3 litColor = color * shading;
      litColor += uGlowColor * (limb * 0.06 + bottomGlow * 0.08);

      gl_FragColor = vec4(litColor, 1.0);
    }
  `,
);

const MoonSurfaceLiteMaterial = shaderMaterial(
  {
    uBaseColor: new THREE.Color("#f1df9b"),
    uCraterColor: new THREE.Color("#baa46a"),
    uGlowColor: new THREE.Color("#fff0ba"),
    uGlowStrength: 1,
  },
  `
    varying vec3 vSphereNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying float vCraterMask;
    varying float vMariaMask;

    float bandNoise(vec3 p) {
      return sin(p.x) * sin(p.y) * sin(p.z);
    }

    void main() {
      vec3 sphereNormal = normalize(position);
      float craterBands = bandNoise(sphereNormal * vec3(18.0, 14.0, 16.0));
      float mariaBands = bandNoise(
        sphereNormal * vec3(5.0, 7.0, 6.0) + vec3(0.8, 1.6, 0.4)
      );
      float craterMask = smoothstep(0.36, 0.78, craterBands * 0.5 + 0.5);
      float mariaMask = smoothstep(0.5, 0.84, mariaBands * 0.5 + 0.5);
      vec3 displacedPosition = position - sphereNormal * craterMask * 0.22;
      vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);

      vSphereNormal = sphereNormal;
      vCraterMask = craterMask;
      vMariaMask = mariaMask;
      vWorldNormal = normalize(mat3(modelMatrix) * sphereNormal);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  `
    uniform vec3 uBaseColor;
    uniform vec3 uCraterColor;
    uniform vec3 uGlowColor;
    uniform float uGlowStrength;

    varying vec3 vSphereNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying float vCraterMask;
    varying float vMariaMask;

    float grain(vec3 p) {
      return fract(sin(dot(p, vec3(37.2, 17.1, 29.4))) * 43758.5453123);
    }

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      vec3 lightDirection = normalize(vec3(0.18, 1.0, 0.14));

      float diffuse = max(dot(normal, lightDirection), 0.0);
      float halfLambert = diffuse * 0.5 + 0.5;
      float skyBounce = max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0);
      float limb = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.1);
      float bottomGlow = smoothstep(-0.9, -0.1, vSphereNormal.y) * uGlowStrength;
      float microNoise = grain(vSphereNormal * 14.0) - 0.5;

      vec3 regolithColor = mix(
        uBaseColor * 0.9,
        uGlowColor,
        max(microNoise, 0.0) * 0.08
      );
      vec3 mariaColor = mix(uBaseColor * 0.7, uCraterColor, 0.58);
      vec3 craterColor = mix(uCraterColor * 0.82, uCraterColor, vCraterMask * 0.24);

      vec3 color = mix(regolithColor, mariaColor, vMariaMask * 0.34);
      color = mix(color, craterColor, vCraterMask * 0.72);

      float shading = 0.18 + halfLambert * 0.56 + skyBounce * 0.1;
      shading *= 1.0 - vCraterMask * 0.18;

      vec3 litColor = color * shading;
      litColor += uGlowColor * (limb * 0.07 + bottomGlow * 0.08);

      gl_FragColor = vec4(litColor, 1.0);
    }
  `,
);

extend({ MoonSurfaceMaterial, MoonSurfaceLiteMaterial });

type TreeGLTFResult = GLTF & {
  nodes: {
    ["tree-lime"]: THREE.Mesh;
  };
  materials: {
    color_main: THREE.MeshStandardMaterial;
  };
};

type Transform = {
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
};

const CENTER_PROTECTED_RADIUS = 5.8;
const FOREST_CENTER_PROTECTED_RADIUS = 7.25;
const FOREST_MENU_CAMERA_LANE_HALF_WIDTH = 4.25;
const FOREST_MENU_CAMERA_LANE_MIN_Z = -0.5;
const FOREST_MENU_CAMERA_LANE_MAX_Z = 12.5;

const isOutsideCenterLane = (x: number, z: number) =>
  Math.sqrt(x * x + Math.pow(z + 0.4, 2)) > CENTER_PROTECTED_RADIUS;

const isOutsideForestMenuCameraLane = (x: number, z: number) =>
  !(
    Math.abs(x) < FOREST_MENU_CAMERA_LANE_HALF_WIDTH &&
    z > FOREST_MENU_CAMERA_LANE_MIN_Z &&
    z < FOREST_MENU_CAMERA_LANE_MAX_Z
  );

const shiftOutsideCenter = (
  x: number,
  z: number,
  minRadius = CENTER_PROTECTED_RADIUS,
) => {
  const dist = Math.sqrt(x * x + z * z);
  if (dist >= minRadius) return [x, z] as const;

  const angle = Math.atan2(z, x);
  const adjustedRadius = minRadius + 0.75;
  return [
    Math.cos(angle) * adjustedRadius,
    Math.sin(angle) * adjustedRadius,
  ] as const;
};

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

const applyTransformsToInstancedMesh = (
  mesh: InstancedMesh | null,
  transforms: Transform[],
) => {
  if (!mesh) return;

  const dummy = new Object3D();

  transforms.forEach((transform, index) => {
    dummy.position.set(...transform.position);
    dummy.rotation.set(0, transform.rotationY, 0);
    dummy.scale.set(...transform.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
};

const normalizeWorldScene = (
  scene?: Partial<WorldSceneConfig> | null,
): WorldSceneConfigEx => {
  const gradientStops =
    Array.isArray(scene?.gradientStops) && scene.gradientStops.length === 3
      ? (scene.gradientStops as [number, number, number])
      : DEFAULT_WORLD_SCENE.gradientStops;
  const gradientColors =
    Array.isArray(scene?.gradientColors) && scene.gradientColors.length === 3
      ? (scene.gradientColors as [string, string, string])
      : DEFAULT_WORLD_SCENE.gradientColors;
  const skyColors =
    Array.isArray(scene?.skyColors) && scene.skyColors.length === 2
      ? (scene.skyColors as [string, string])
      : DEFAULT_WORLD_SCENE.skyColors;

  return {
    ...DEFAULT_WORLD_SCENE,
    ...scene,
    skyColors,
    gradientStops,
    gradientColors,
    models: Array.isArray(scene?.models) ? scene.models : [],
    effects: Array.isArray(scene?.effects) ? scene.effects : [],
    starfield: scene?.starfield ?? false,
  };
};

const getSceneLighting = (scene: WorldSceneConfigEx) => ({
  ambientIntensity: scene.lighting?.ambientIntensity ?? 2,
  directionalIntensity: scene.lighting?.directionalIntensity ?? 1.2,
  moonGlowIntensity: scene.lighting?.moonGlowIntensity ?? 1,
  spaceGlowIntensity: scene.lighting?.spaceGlowIntensity ?? 1,
});

const isSpaceWorldScene = (scene: WorldSceneConfig) =>
  scene.effects.some((effectId) => SPACE_WORLD_EFFECT_IDS.has(effectId)) ||
  scene.models.some((modelId) => SPACE_WORLD_MODEL_IDS.has(modelId));

function MoonWorldSphere({
  scene,
  lighting,
  lowDetail,
}: {
  scene: WorldSceneConfigEx;
  lighting: ReturnType<typeof getSceneLighting>;
  lowDetail: boolean;
}) {
  const materialProps = useMemo(
    () => ({
      uBaseColor: new THREE.Color(scene.groundColor),
      uCraterColor: new THREE.Color("#bca064"),
      uGlowColor: new THREE.Color(scene.accentColor),
      uGlowStrength: lighting.moonGlowIntensity,
    }),
    [lighting.moonGlowIntensity, scene.accentColor, scene.groundColor],
  );

  return (
    <group position={MOON_CENTER} rotation={MOON_SURFACE_ROTATION}>
      <mesh renderOrder={-5} frustumCulled={false}>
        <sphereGeometry
          args={[
            MOON_RADIUS,
            lowDetail ? MOON_SEGMENTS_LOW : MOON_SEGMENTS_HIGH,
            lowDetail ? MOON_SEGMENTS_LOW : MOON_SEGMENTS_HIGH,
          ]}
        />
        {lowDetail ? (
          <>
            {/* @ts-expect-error custom material */}
            <moonSurfaceLiteMaterial {...materialProps} />
          </>
        ) : (
          <>
            {/* @ts-expect-error custom material */}
            <moonSurfaceMaterial {...materialProps} />
          </>
        )}
      </mesh>

      {lowDetail && (
        <mesh renderOrder={-6} scale={1.018}>
          <sphereGeometry args={[MOON_RADIUS, 20, 20]} />
          <meshBasicMaterial
            color={scene.accentColor}
            transparent
            opacity={0.05 * lighting.moonGlowIntensity}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function MoonBackgroundUfo({
  accentColor,
}: {
  accentColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const beamMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const elapsed = clock.getElapsedTime();
    const phase = elapsed % MOON_UFO_CYCLE_SECONDS;
    const active = phase < MOON_UFO_FLIGHT_SECONDS;

    groupRef.current.visible = active;

    if (!active) {
      if (beamMaterialRef.current) {
        beamMaterialRef.current.opacity = 0;
      }
      return;
    }

    const progress = phase / MOON_UFO_FLIGHT_SECONDS;
    const x = THREE.MathUtils.lerp(-24, 18, progress);
    const y = THREE.MathUtils.lerp(10.2, 7.6, progress);
    const z = THREE.MathUtils.lerp(-30, -18, progress);
    const wobble = Math.sin(progress * Math.PI * 8) * 0.18;
    const bank = Math.sin(progress * Math.PI * 2) * 0.08;

    groupRef.current.position.set(x, y + wobble, z);
    groupRef.current.rotation.set(0.08 + wobble * 0.05, -0.42, bank);

    if (beamMaterialRef.current) {
      const fadeIn = THREE.MathUtils.smoothstep(progress, 0.02, 0.12);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(progress, 0.82, 1);
      beamMaterialRef.current.opacity = 0.14 * fadeIn * fadeOut;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh scale={[1.5, 0.34, 1]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial
          color="#9aa7bc"
          metalness={0.18}
          roughness={0.42}
        />
      </mesh>

      <mesh position={[0, 0.22, 0]} scale={[0.68, 0.26, 0.68]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial
          color="#dff4ff"
          emissive={accentColor}
          emissiveIntensity={0.42}
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.9, 1.9, 0.14]}>
        <torusGeometry args={[1, 0.14, 10, 40]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.24}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={[0, -1.55, 0]}
        scale={[1.6, 1, 1]}
      >
        <coneGeometry args={[0.9, 2.8, 18, 1, true]} />
        <meshBasicMaterial
          ref={beamMaterialRef}
          color={accentColor}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SpaceWorldEffects({
  scene,
  lighting,
}: {
  scene: WorldSceneConfigEx;
  lighting: ReturnType<typeof getSceneLighting>;
}) {
  return (
    <group>
      <Sparkles
        count={700}
        color="#f6fbff"
        size={1.2}
        speed={0.05}
        opacity={0.72 * lighting.spaceGlowIntensity}
        scale={[110, 76, 110]}
        position={[0, 8, 0]}
      />

      <Sparkles
        count={120}
        color="#7bb9ff"
        size={2.4}
        speed={0.02}
        opacity={0.26 * lighting.spaceGlowIntensity}
        scale={[84, 40, 84]}
        position={[0, 2, 0]}
      />

      <mesh position={[-18, 10, -34]} scale={[12, 8, 12]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#8c67ff"
          transparent
          opacity={0.08 * lighting.spaceGlowIntensity}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[22, 4, -42]} scale={[16, 10, 14]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#49d6ff"
          transparent
          opacity={0.06 * lighting.spaceGlowIntensity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function WorldDome({
  scene,
  lowDetail,
}: {
  scene: WorldSceneConfig;
  lowDetail: boolean;
}) {
  const isMoonWorld = scene.effects.includes("moon_glow");
  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[100, 24, 22]} />
        <meshBasicMaterial side={BackSide} depthTest={false} depthWrite={false}>
          <GradientTexture
            stops={scene.gradientStops}
            colors={scene.gradientColors}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>

      {scene.starfield && (
        <Sparkles
          count={isMoonWorld ? (lowDetail ? 110 : 180) : lowDetail ? 280 : 420}
          color="#f6fbff"
          size={isMoonWorld ? (lowDetail ? 1.7 : 2.2) : 2.8}
          speed={0.08}
          opacity={isMoonWorld ? (lowDetail ? 0.58 : 0.75) : 0.9}
          scale={[85, 55, 85]}
          position={[0, 6, 0]}
        />
      )}

      {isMoonWorld && <MoonBackgroundUfo accentColor={scene.accentColor} />}
    </>
  );
}

function WorldFloor({ scene }: { scene: WorldSceneConfig }) {
  const isDefaultGridWorld = scene.effects.includes("default_grid");
  const isMoonWorld = scene.effects.includes("moon_glow");
  const isSpaceWorld = isSpaceWorldScene(scene);

  if (isDefaultGridWorld) {
    return null;
  }

  if (isMoonWorld) {
    return null;
  }

  if (isSpaceWorld) {
    return null;
  }

  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5}>
        <circleGeometry args={[LARGE_FLOOR_SIZE * 0.42, 72]} />
        <meshStandardMaterial color={scene.groundColor} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[24, 72]} />
        <meshBasicMaterial
          color={scene.accentColor}
          transparent
          opacity={0.1}
        />
      </mesh>

      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[17, 26, 72]} />
        <meshBasicMaterial
          color={scene.accentColor}
          transparent
          opacity={0.28}
        />
      </mesh>
    </group>
  );
}

function InstancedForestTrees({ preview }: { preview: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const { nodes, materials } = useGLTF(TREE_PATH) as TreeGLTFResult;

  const transforms = useMemo(() => {
    const random = createSeededRandom(41);
    const transforms: Transform[] = [];

    while (transforms.length < 48) {
      const angle =
        (transforms.length / 48) * Math.PI * 2 + (random() - 0.5) * 0.34;
      const radius = 9.2 + random() * 14.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.9 - 3;
      if (!isOutsideCenterLane(x, z) || !isOutsideForestMenuCameraLane(x, z))
        continue;

      const scale = 0.7 + random() * 1.05;
      const [safeX, safeZ] = shiftOutsideCenter(
        x,
        z,
        FOREST_CENTER_PROTECTED_RADIUS,
      );
      transforms.push({
        position: [safeX, -1.1 + random() * 0.08, safeZ],
        rotationY: random() * Math.PI * 2,
        scale: [scale, scale, scale],
      });
    }

    return transforms;
  }, []);

  const material = useMemo(() => {
    const clone = materials.color_main.clone();
    clone.needsUpdate = true;
    return clone;
  }, [materials, preview]);

  useLayoutEffect(() => {
    applyTransformsToInstancedMesh(meshRef.current, transforms);
    const meshMaterial = meshRef.current?.material as
      | THREE.Material
      | undefined;
    if (meshMaterial) {
      meshMaterial.needsUpdate = true;
    }
  }, [transforms, preview]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[nodes["tree-lime"].geometry, material, transforms.length]}
      castShadow
      receiveShadow
    />
  );
}

function InstancedWinterPines() {
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);

  const transforms = useMemo(() => {
    const random = createSeededRandom(77);
    const transforms: Array<{
      position: [number, number, number];
      rotationY: number;
      scale: number;
    }> = [];

    while (transforms.length < 34) {
      const angle =
        (transforms.length / 34) * Math.PI * 2 + (random() - 0.5) * 0.38;
      const radius = 7.5 + random() * 11;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 3;
      if (!isOutsideCenterLane(x, z)) continue;

      const [safeX, safeZ] = shiftOutsideCenter(x, z);
      transforms.push({
        position: [safeX, -1.12 + random() * 0.05, safeZ],
        rotationY: random() * Math.PI * 2,
        scale: (0.72 + random() * 0.6) * 3,
      });
    }

    return transforms;
  }, []);

  useLayoutEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;

    const trunkTransforms: Transform[] = transforms.map((transform) => ({
      position: [
        transform.position[0],
        transform.position[1] + 0.28 * transform.scale,
        transform.position[2],
      ],
      rotationY: transform.rotationY,
      scale: [
        0.12 * transform.scale,
        0.72 * transform.scale,
        0.12 * transform.scale,
      ],
    }));

    const canopyTransforms: Transform[] = transforms.map((transform) => ({
      position: [
        transform.position[0],
        transform.position[1] + 1.05 * transform.scale,
        transform.position[2],
      ],
      rotationY: transform.rotationY,
      scale: [
        0.92 * transform.scale,
        1.42 * transform.scale,
        0.92 * transform.scale,
      ],
    }));

    applyTransformsToInstancedMesh(trunkRef.current, trunkTransforms);
    applyTransformsToInstancedMesh(canopyRef.current, canopyTransforms);
  }, [transforms]);

  return (
    <group>
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, transforms.length]}
      >
        <cylinderGeometry args={[1, 1, 1, 10]} />
        <meshStandardMaterial color="#715136" />
      </instancedMesh>

      <instancedMesh
        ref={canopyRef}
        args={[undefined, undefined, transforms.length]}
      >
        <coneGeometry args={[1, 1, 14]} />
        <meshStandardMaterial color="#dff5ff" />
      </instancedMesh>
    </group>
  );
}

function DesertDustEffect() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        radius: 6.8 + Math.random() * 12,
        height: -0.4 + Math.random() * 1.1,
        offset: Math.random() * Math.PI * 2,
        speed: 0.08 + Math.random() * 0.18,
        scale: 0.03 + Math.random() * 0.06,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    particles.forEach((particle, index) => {
      const mesh = groupRef.current?.children[index];
      if (!mesh) return;

      const time = clock.getElapsedTime() * particle.speed + particle.offset;
      mesh.position.set(
        Math.cos(time) * particle.radius,
        particle.height + Math.sin(time * 3) * 0.03,
        Math.sin(time) * particle.radius * 0.35 - 3.5,
      );
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((particle) => (
        <mesh key={particle.id} scale={particle.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#f5d9a5" transparent opacity={0.14} />
        </mesh>
      ))}
    </group>
  );
}

function MoonMeteors() {
  const groupRef = useRef<THREE.Group>(null);
  const meteorData = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: index,
        offset: index * 0.8,
        speed: 1.8 + Math.random() * 0.9,
        y: 4 + Math.random() * 4,
        z: -12 - Math.random() * 10,
        scale: 0.08 + Math.random() * 0.08,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, index) => {
      const meteor = meteorData[index];
      const travel =
        ((clock.getElapsedTime() * meteor.speed + meteor.offset) % 12) - 6;
      child.position.set(
        7 - travel * 2.4,
        meteor.y - travel * 0.7,
        meteor.z + travel * 2.1,
      );
    });
  });

  return (
    <group ref={groupRef}>
      {meteorData.map((meteor) => (
        <mesh key={meteor.id} rotation={[0.4, -0.6, 0.8]} scale={meteor.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#d9e1f2"
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function WorldModel({
  modelId,
  scene,
  preview,
  lowDetailMoon,
}: {
  modelId: WorldModelId;
  scene: WorldSceneConfig;
  preview: boolean;
  lowDetailMoon: boolean;
}) {
  switch (modelId) {
    case "default_home":
      return null;

    case "forest_grove":
      return <InstancedForestTrees preview={preview} />;

    case "forest_meadow":
      return (
        <GrassShader
          position={[0, -1.32, 0]}
          scale={[1.28, 0.48, 1.28]}
          preview={preview}
          densityMultiplier={1.45}
        />
      );

    case "desert_dunes":
      return (
        <group>
          <mesh position={[-8.5, -1.15, -9]} scale={[2.6, 0.55, 1.9]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color={scene.accentColor} />
          </mesh>
          <mesh position={[9.5, -1.22, -11]} scale={[3.2, 0.7, 2.1]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#e1b164" />
          </mesh>
        </group>
      );

    case "desert_pyramids":
      return (
        <group>
          {[
            [-12, -0.05, -20, 8.4],
            [-7.8, -0.1, -16, 6],
            [10.4, -0.15, -22, 10.2],
          ].map(([x, y, z, scale], index) => (
            <mesh key={index} position={[x, y, z]} scale={scale}>
              <coneGeometry args={[1.2, 1.6, 4]} />
              <meshStandardMaterial color="#d9b26e" />
            </mesh>
          ))}
        </group>
      );

    case "winter_pines":
      return <InstancedWinterPines />;

    case "winter_snowman":
      return (
        <group position={[7.2, -0.82, -6.8]}>
          <mesh position={[0, -0.3, 0]} scale={[0.42, 0.42, 0.42]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.18, 0]} scale={[0.28, 0.28, 0.28]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh
            position={[0.08, 0.16, 0.24]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.04, 0.12, 0.04]}
          >
            <coneGeometry args={[1, 1, 10]} />
            <meshStandardMaterial color="#ff9f40" />
          </mesh>
        </group>
      );

    case "moon_craters":
      return (
        <MoonWorldSphere
          scene={scene as WorldSceneConfigEx}
          lighting={getSceneLighting(scene as WorldSceneConfigEx)}
          lowDetail={lowDetailMoon}
        />
      );

    case "space_planet":
      return (
        <group position={[-24, 10, -46]} rotation={[0.34, -0.28, 0.16]}>
          <mesh scale={[8.8, 8.8, 8.8]}>
            <sphereGeometry args={[1, 40, 40]} />
            <meshStandardMaterial
              color="#cbb48a"
              emissive="#6b5c47"
              emissiveIntensity={0.18}
            />
          </mesh>
          <mesh scale={[9.5, 9.5, 9.5]}>
            <sphereGeometry args={[1, 40, 40]} />
            <meshBasicMaterial
              color="#f1dcc0"
              transparent
              opacity={0.06}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[1.18, 0.14, -0.42]} scale={[12.5, 3.2, 12.5]}>
            <torusGeometry args={[1, 0.13, 16, 120]} />
            <meshBasicMaterial
              color="#d7c7aa"
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[1.18, 0.14, -0.42]} scale={[15.2, 3.9, 15.2]}>
            <torusGeometry args={[1, 0.05, 12, 120]} />
            <meshBasicMaterial
              color="#f5ead8"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>
        </group>
      );

    case "space_rings":
      return (
        <group position={[30, 7, -52]} rotation={[0.42, 0.5, -0.22]}>
          <mesh scale={[4.6, 4.6, 4.6]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#b89d73"
              emissive="#5a4730"
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh rotation={[1.3, 0.18, -0.58]} scale={[7.2, 2.1, 7.2]}>
            <torusGeometry args={[1, 0.1, 14, 100]} />
            <meshBasicMaterial
              color="#d8ccb8"
              transparent
              opacity={0.48}
              depthWrite={false}
            />
          </mesh>
        </group>
      );
  }
}

function WorldEffect({ effectId }: { effectId: WorldEffectId }) {
  switch (effectId) {
    case "default_grid":
      return (
        <Grid
          args={[8, 8]}
          sectionThickness={2}
          sectionColor="#e0dee6"
          sectionSize={1.2}
          cellThickness={0}
          fadeDistance={4}
          position={[0, FLOOR_Y - 0.69, -0.55]}
        />
      );

    case "forest_clouds":
      return <CloudEffect preview={false} />;

    case "forest_fireflies":
      return (
        <Sparkles
          count={28}
          color="#d8ff7a"
          size={3}
          speed={0.35}
          opacity={0.8}
          scale={[18, 4.5, 18]}
          position={[0, 0.6, 0]}
        />
      );

    case "forest_rain":
      return <ForestRainEffect />;

    case "desert_sand":
      return <DesertDustEffect />;

    case "winter_snow":
      return <SnowEffect />;

    case "winter_sparkles":
      return <SnowEffect />;

    case "moon_glow":
      return null;

    case "moon_meteors":
      return <MoonMeteors />;

    case "space_stars":
      return (
        <Sparkles
          count={680}
          color="#f8fbff"
          size={1.2}
          speed={0.04}
          opacity={0.72}
          scale={[118, 72, 118]}
          position={[0, 8, 0]}
        />
      );

    case "space_nebula":
      return (
        <group>
          <mesh position={[-24, 12, -38]} scale={[16, 10, 16]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial
              color="#7d5cff"
              transparent
              opacity={0.08}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[18, 8, -44]} scale={[18, 12, 18]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial
              color="#62d6ff"
              transparent
              opacity={0.06}
              depthWrite={false}
            />
          </mesh>
        </group>
      );

    case "space_dust":
      return (
        <Sparkles
          count={120}
          color="#b5d2ff"
          size={1.8}
          speed={0.02}
          opacity={0.32}
          scale={[92, 44, 92]}
          position={[0, 4, 0]}
        />
      );
  }
}

export function SceneDecorations() {
  const { worlds, previewMode, graphicPreferences } = useCoreStore();
  const isMobile = useAppStore((state) => state.isMobile);
  const preview =
    previewMode === "world" && !!worlds.find((world) => world.preview);
  const activeWorld =
    previewMode === "world"
      ? (worlds.find((world) => world.preview) ??
        worlds.find((world) => world.enabled))
      : worlds.find((world) => world.enabled);

  if (!activeWorld) return null;

  const scene = normalizeWorldScene(activeWorld.scene);
  const lighting = getSceneLighting(scene);
  const isSpaceWorld = isSpaceWorldScene(scene);
  const isMoonWorld = scene.effects.includes("moon_glow");
  const lowDetailMoon =
    isMoonWorld &&
    (isMobile || graphicPreferences.qualityMode === "low");

  return (
    <group>
      <WorldDome scene={scene} lowDetail={lowDetailMoon} />
      <WorldFloor scene={scene} />

      {scene.models.map((modelId) => (
        <WorldModel
          key={modelId}
          modelId={modelId}
          scene={scene}
          preview={preview}
          lowDetailMoon={lowDetailMoon}
        />
      ))}

      {scene.effects.map((effectId) => (
        <WorldEffect key={effectId} effectId={effectId} />
      ))}

      {isSpaceWorld && <SpaceWorldEffects scene={scene} lighting={lighting} />}
    </group>
  );
}

useGLTF.preload(TREE_PATH);
