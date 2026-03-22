import React, { useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useCoreStore } from "@/store/core/store";
import * as THREE from "three";
import {
  Object3D,
  Color,
  InstancedMesh,
  DynamicDrawUsage,
  BufferGeometry,
  Material,
} from "three";

// TODO: check performance impact
// calculate all shapes geometries once and reuse
const SHARED_GEOMETRIES = {
  heart: (() => {
    const shape = new THREE.Shape();
    const x = 0,
      y = 0;
    shape.moveTo(x + 5 * 0.1, y + 5 * 0.1);
    shape.bezierCurveTo(x + 5 * 0.1, y + 5 * 0.1, x + 4 * 0.1, y, x, y);
    shape.bezierCurveTo(
      x - 6 * 0.1,
      y,
      x - 6 * 0.1,
      y + 7 * 0.1,
      x - 6 * 0.1,
      y + 7 * 0.1,
    );
    shape.bezierCurveTo(
      x - 6 * 0.1,
      y + 11 * 0.1,
      x - 3 * 0.1,
      y + 15.4 * 0.1,
      x + 5 * 0.1,
      y + 19 * 0.1,
    );
    shape.bezierCurveTo(
      x + 12 * 0.1,
      y + 15.4 * 0.1,
      x + 16 * 0.1,
      y + 11 * 0.1,
      x + 16 * 0.1,
      y + 6.4 * 0.1,
    );
    shape.bezierCurveTo(
      x + 16 * 0.1,
      y + 7 * 0.1,
      x + 16 * 0.1,
      y,
      x + 10 * 0.1,
      y,
    );
    shape.bezierCurveTo(
      x + 7 * 0.1,
      y,
      x + 5 * 0.1,
      y + 5 * 0.1,
      x + 5 * 0.1,
      y + 5 * 0.1,
    );
    return new THREE.ShapeGeometry(shape);
  })(),
  star: (() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.4;
    const step = (Math.PI * 2) / (spikes * 2);
    shape.moveTo(outerRadius, 0);
    for (let i = 1; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.cos(i * step) * radius, Math.sin(i * step) * radius);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  })(),
  sphere: new THREE.SphereGeometry(0.24, 2, 2),
  bubbleSphere: new THREE.SphereGeometry(1, 8, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  cylinder: new THREE.CylinderGeometry(0.02, 0.02, 0.3),
  cloudSphere: new THREE.SphereGeometry(1, 8, 8),
};

const SHARED_MATERIALS = {
  heart: new THREE.MeshToonMaterial({ transparent: false }),
  star: new THREE.MeshToonMaterial({ transparent: false }),
  sphere: new THREE.MeshToonMaterial({ transparent: false }),
  confetti: new THREE.MeshToonMaterial({
    transparent: false,
    // side: THREE.DoubleSide,
  }),
  smoke: new THREE.MeshBasicMaterial({
    color: "#b8bcc5",
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  }),
  bubbles: new THREE.MeshToonMaterial({
    color: "#deeff9",
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.FrontSide,
    vertexColors: true,
    emissive: "#9fdcff",
    emissiveIntensity: 0.2,
  }),
  bubbleInner: new THREE.MeshToonMaterial({
    color: "#b0d6ee",
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.FrontSide,
    vertexColors: true,
    emissive: "#8ecfff",
    emissiveIntensity: 0.8,
  }),
  bubbleHighlight: new THREE.MeshToonMaterial({
    color: "#b0d6ee",
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    emissive: "#d7f2ff",
    emissiveIntensity: 0.2,
  }),
  rain: new THREE.MeshToonMaterial({
    color: "#87CEEB",
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }),
  snow: new THREE.MeshToonMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }),
  cloud: new THREE.MeshToonMaterial({
    color: "#ffffff",
  }),
  cloudOutline: new THREE.MeshBasicMaterial({
    color: "#000000",
    side: THREE.BackSide,
  }),
};

// #region CONSTANTS
const MAX_TAP_PARTICLES = 150;
const TAP_PARTICLE_COUNT = 15;
const CLOUD_COUNT_MIN = 3;
const CLOUD_COUNT_MAX = 5;
const BUBBLES_COUNT_MIN = 6;
const BUBBLES_COUNT_MAX = 13;
const DEFAULT_FALLING_PARTICLE_LIMIT = 100;
// #endregion

// Sparkles from drei
export function StarsEffect() {
  const { weatherEffects } = useCoreStore();
  const starsUpgrade = weatherEffects.find((u) => u.id === "environment_stars");
  const starsEnabled = useMemo(
    () => starsUpgrade?.purchased && starsUpgrade?.enabled,
    [starsUpgrade],
  );

  if (!starsEnabled) return null;

  return (
    <Sparkles
      count={400}
      scale={[60, 30, 50]}
      size={2}
      speed={0.1}
      opacity={0.5}
      color="#FFFFFF"
      position={[0, 1, 0]}
    />
  );
}

type FallingParticle = {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  maxLife: number;
};

type FallingParticleConfig = {
  enabled: boolean;
  material: THREE.MeshToonMaterial;
  geometry: BufferGeometry;
  spawnInterval: number;
  spawnBatchSize: number;
  maxParticles: number;
  spawnRadius: number;
  spawnHeight: number;
  spawnHeightVariance: number;
  lifeRange: [number, number];
  velocityXRange: [number, number];
  velocityYRange: [number, number];
  velocityZRange: [number, number];
  scaleRange: [number, number];
  scaleMultiplierY: number;
  groundY: number;
};

function FallingParticleEffect({
  enabled,
  material,
  geometry,
  spawnInterval,
  spawnBatchSize,
  maxParticles,
  spawnRadius,
  spawnHeight,
  spawnHeightVariance,
  lifeRange,
  velocityXRange,
  velocityYRange,
  velocityZRange,
  scaleRange,
  scaleMultiplierY,
  groundY,
}: FallingParticleConfig) {
  const [particles, setParticles] = React.useState<FallingParticle[]>([]);
  const dropIdCounter = useRef(0);

  const createParticles = React.useCallback(() => {
    if (!enabled) return;

    setParticles((prev) => {
      if (prev.length >= maxParticles) return prev;

      const newParticles = Array.from({ length: spawnBatchSize }, () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnRadius;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        const vx =
          velocityXRange[0] +
          Math.random() * (velocityXRange[1] - velocityXRange[0]);
        const vy =
          velocityYRange[0] +
          Math.random() * (velocityYRange[1] - velocityYRange[0]);
        const vz =
          velocityZRange[0] +
          Math.random() * (velocityZRange[1] - velocityZRange[0]);
        const maxLife =
          lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);

        return {
          id: dropIdCounter.current++,
          position: [
            x,
            spawnHeight + Math.random() * spawnHeightVariance,
            z,
          ] as [number, number, number],
          velocity: [vx, vy, vz] as [number, number, number],
          life: maxLife,
          maxLife,
        };
      });

      return [...prev, ...newParticles].slice(-maxParticles);
    });
  }, [
    enabled,
    lifeRange,
    maxParticles,
    spawnBatchSize,
    spawnHeight,
    spawnHeightVariance,
    spawnRadius,
    velocityXRange,
    velocityYRange,
    velocityZRange,
  ]);

  useFrame((state, delta) => {
    if (enabled && state.clock.getElapsedTime() % spawnInterval < delta) {
      createParticles();
    }

    setParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          position: [
            particle.position[0] + particle.velocity[0] * delta * 60,
            particle.position[1] + particle.velocity[1] * delta * 60,
            particle.position[2] + particle.velocity[2] * delta * 60,
          ] as [number, number, number],
          life: particle.life - delta,
        }))
        .filter(
          (particle) => particle.life > 0 && particle.position[1] > groundY,
        ),
    );
  });

  if (!enabled && particles.length === 0) return null;

  return (
    <group>
      {particles.map((particle) => {
        const lifeRatio = Math.max(0, particle.life / particle.maxLife);
        const scale =
          scaleRange[0] + (scaleRange[1] - scaleRange[0]) * lifeRatio;

        return (
          <mesh
            key={particle.id}
            position={particle.position}
            scale={[scale, scale * scaleMultiplierY, scale]}
            geometry={geometry}
            material={material}
            material-opacity={lifeRatio}
          />
        );
      })}
    </group>
  );
}

export function RainEffect({ enabled = true }: { enabled?: boolean } = {}) {
  return (
    <FallingParticleEffect
      enabled={enabled}
      material={SHARED_MATERIALS.rain}
      geometry={SHARED_GEOMETRIES.cylinder}
      spawnInterval={0.1}
      spawnBatchSize={5}
      maxParticles={DEFAULT_FALLING_PARTICLE_LIMIT}
      spawnRadius={5.5}
      spawnHeight={15}
      spawnHeightVariance={0.6}
      lifeRange={[2.6, 3.4]}
      velocityXRange={[-0.25, 0.25]}
      velocityYRange={[-4.2, -2.3]}
      velocityZRange={[-0.25, 0.25]}
      scaleRange={[0.1, 0.24]}
      scaleMultiplierY={3}
      groundY={-4}
    />
  );
}

export function SnowEffect({ enabled = true }: { enabled?: boolean } = {}) {
  return (
    <FallingParticleEffect
      enabled={enabled}
      material={SHARED_MATERIALS.snow}
      geometry={SHARED_GEOMETRIES.sphere}
      spawnInterval={0.14}
      spawnBatchSize={4}
      maxParticles={120}
      spawnRadius={6.5}
      spawnHeight={16}
      spawnHeightVariance={1.5}
      lifeRange={[4.8, 6.8]}
      velocityXRange={[-0.24, 0.24]}
      velocityYRange={[-1.0, -0.45]}
      velocityZRange={[-0.24, 0.24]}
      scaleRange={[0.045, 0.085]}
      scaleMultiplierY={1.15}
      groundY={-3.8}
    />
  );
}

function useLoopingWeatherWindow(activeMs: number, inactiveMs: number) {
  const [enabled, setEnabled] = React.useState(true);

  useEffect(() => {
    let timeoutId: number | undefined;
    let cancelled = false;

    const schedule = (nextEnabled: boolean, delay: number) => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        setEnabled(nextEnabled);
        schedule(!nextEnabled, nextEnabled ? activeMs : inactiveMs);
      }, delay);
    };

    setEnabled(true);
    schedule(false, activeMs);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeMs, inactiveMs]);

  return enabled;
}

export function ForestRainEffect() {
  const raining = useLoopingWeatherWindow(9000, 6000);

  return <RainEffect enabled={raining} />;
}

const generateClouds = (count: number): CloudData[] => {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius =
      CONFIG.RADIUS.MIN +
      Math.random() * (CONFIG.RADIUS.MAX - CONFIG.RADIUS.MIN);

    const x = Math.cos(angle) * radius;
    const y =
      CONFIG.HEIGHT.MIN +
      Math.random() * (CONFIG.HEIGHT.MAX - CONFIG.HEIGHT.MIN);
    const z = Math.sin(angle) * radius;

    const bubbleCount =
      CONFIG.BUBBLE_COUNT.MIN +
      Math.floor(
        Math.random() * (CONFIG.BUBBLE_COUNT.MAX - CONFIG.BUBBLE_COUNT.MIN + 1),
      );

    const bubbles: CloudBubble[] = [];

    bubbles.push({
      offset: [0, 0, 0],
      scale: 1.2 + Math.random() * 0.8,
      opacity: 0.1 + Math.random() * 0.2,
    });

    for (let i = 0; i < bubbleCount - 1; i++) {
      const bubbleAngle =
        (i / (bubbleCount - 1)) * Math.PI * 2 + Math.random() * 0.5;
      const bubbleDist = 0.8 + Math.random() * 1.2;
      const bubbleHeight = (Math.random() - 0.5) * 0.8;

      bubbles.push({
        offset: [
          Math.cos(bubbleAngle) * bubbleDist,
          bubbleHeight,
          Math.sin(bubbleAngle) * bubbleDist,
        ],
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.1 + Math.random() * 0.05,
      });
    }

    return {
      id: crypto.randomUUID(),
      position: [x, y, z],
      bubbles,
    };
  });
};

const CONFIG = {
  CLOUD_COUNT: { MIN: 5, MAX: 10 },
  BUBBLE_COUNT: { MIN: 5, MAX: 12 },
  RADIUS: { MIN: 8, MAX: 16 },
  HEIGHT: { MIN: 2, MAX: 6 },
};

type CloudBubble = {
  offset: [number, number, number];
  scale: number;
  opacity: number;
};

type CloudData = {
  id: string;
  position: [number, number, number];
  bubbles: CloudBubble[];
};

export const CloudEffect = ({ preview }: { preview: boolean }) => {
  const fillRef = useRef<InstancedMesh>(null);
  const outlineRef = useRef<InstancedMesh>(null);
  const clouds = useMemo(() => {
    const count =
      CONFIG.CLOUD_COUNT.MIN +
      Math.floor(
        Math.random() * (CONFIG.CLOUD_COUNT.MAX - CONFIG.CLOUD_COUNT.MIN + 1),
      );

    return generateClouds(count);
  }, []);
  const cloudInstances = useMemo(
    () =>
      clouds.flatMap((cloud) =>
        cloud.bubbles.map((bubble) => ({
          position: [
            cloud.position[0] + bubble.offset[0],
            cloud.position[1] + bubble.offset[1],
            cloud.position[2] + bubble.offset[2],
          ] as [number, number, number],
          scale: bubble.scale,
        })),
      ),
    [clouds],
  );

  useLayoutEffect(() => {
    if (!fillRef.current || !outlineRef.current) return;

    const dummy = new Object3D();

    cloudInstances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.scale.setScalar(instance.scale);
      dummy.updateMatrix();
      fillRef.current!.setMatrixAt(index, dummy.matrix);

      dummy.scale.setScalar(instance.scale * 1.08);
      dummy.updateMatrix();
      outlineRef.current!.setMatrixAt(index, dummy.matrix);
    });

    fillRef.current.instanceMatrix.needsUpdate = true;
    outlineRef.current.instanceMatrix.needsUpdate = true;
  }, [cloudInstances]);

  const cloudMaterial = useMemo(() => {
    const material = SHARED_MATERIALS.cloud.clone();
    material.transparent = preview;
    material.opacity = preview ? 0.85 : 1;
    material.depthWrite = !preview;
    return material;
  }, [preview]);

  useEffect(() => {
    return () => {
      cloudMaterial.dispose();
    };
  }, [cloudMaterial]);

  return (
    <group>
      <instancedMesh
        ref={outlineRef}
        args={[
          SHARED_GEOMETRIES.cloudSphere,
          SHARED_MATERIALS.cloudOutline,
          cloudInstances.length,
        ]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={fillRef}
        args={[
          SHARED_GEOMETRIES.cloudSphere,
          cloudMaterial,
          cloudInstances.length,
        ]}
        frustumCulled={false}
      />
    </group>
  );
};

const MAX_COUNT = 200;
const GRAVITY = -10;
const DRAG = 0.95;
const PARTICLES_Y_OFFSET = 1;

// TODO: move colorConfigs to a separate file + fix color pick logic
const colorConfigs = {
  confetti: [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#FFB6C1",
    "#FFD93D",
    "#6BCF7F",
    "#4D96FF",
    "#FF9A8B",
    "#FF6B9D",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#FFB6C1",
    "#FFD93D",
    "#6BCF7F",
    "#4D96FF",
    "#FF9A8B",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
  ],
  hearts: [
    "#FF69B4",
    "#FF1493",
    "#DC143C",
    "#FF007F",
    "#FF69B4",
    "#FF1493",
    "#FF69B4",
    "#FF1493",
    "#DC143C",
    "#FF007F",
    "#FF69B4",
    "#FF1493",
    "#FF69B4",
    "#FF1493",
    "#DC143C",
    "#FF007F",
    "#FF69B4",
    "#FF1493",
  ],
  stars: [
    "#fff700",
    "#FFD700",
    "#FFD700",
    "#f2ff00",
    "#FFD700",
    "#f7ef1f",
    "#FFA500",
    "#f2ff00",
    "#FFD700",
    "#FFA500",
    "#FFD700",
    "#FFA500",
    "#ffc400",
    "#FFD700",
    "#FFA500",
    "#d9ff00",
  ],
  laser: ["#5cf7ff", "#16e0ff", "#4d96ff", "#7a5cff", "#ff4fd8", "#b6fff2"],
  emojis: ["#ffffff", "#ffe45e", "#ffd166", "#fff1b8"],
  default: ["#ffffff", "#cccccc", "#212121", "#000000", "#297AFF"],
};

type BasicParticle = {
  life: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
  scale: number;
  bucket: number;
  color: Color;
};

type BubbleParticle = BasicParticle & {
  wobbleOffset: number;
  wobbleSpeed: number;
  driftStrength: number;
  stretch: number;
  highlightOffset: [number, number, number];
};

type BasicConfig = {
  geo: BufferGeometry;
  mat: Material;
  colors: string[];
};

const createEmptyMatrix = () =>
  new Object3D().matrix.scale(new Object3D().scale.set(0, 0, 0));

const EMOJI_GLYPHS = ["👁️", "🔥", "🫵", "👀", "✨"] as const;

const createEmojiTexture = (emoji: string) => {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "96px Apple Color Emoji, Segoe UI Emoji, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(emoji, canvas.width / 2, canvas.height / 2 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

function BasicTapParticles({
  config,
  spawnVariant = "burst",
}: {
  config: BasicConfig;
  spawnVariant?: "burst" | "emoji" | "smoke" | "bubble";
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const particles = useMemo<BasicParticle[]>(
    () =>
      new Array(MAX_COUNT).fill(0).map(() => ({
        life: 0,
        maxLife: 0,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        rvx: 0,
        rvy: 0,
        rvz: 0,
        scale: 1,
        bucket: 0,
        color: new Color(),
      })),
    [],
  );

  const spawn = (x: number, y: number, z: number, count: number) => {
    if (!meshRef.current) return;

    const isEmoji = spawnVariant === "emoji";
    const isSmoke = spawnVariant === "smoke";
    const isBubble = spawnVariant === "bubble";
    const spawnTarget = isBubble ? Math.max(1, Math.ceil(count * 0.25)) : count;

    let spawned = 0;
    for (let i = 0; i < MAX_COUNT; i++) {
      if (spawned >= spawnTarget) break;
      if (particles[i].life > 0) continue;

      const p = particles[i];
      const lifeMin = isSmoke ? 1.7 : isBubble ? 2.8 : isEmoji ? 1.2 : 1;
      const lifeMax = isSmoke ? 2.6 : isBubble ? 4.2 : isEmoji ? 1.65 : 1.5;
      p.life = lifeMin + Math.random() * (lifeMax - lifeMin);
      p.maxLife = p.life;
      p.x = x;
      p.y = y + PARTICLES_Y_OFFSET - (isSmoke ? 0.08 : isBubble ? 0.04 : 0.15);
      p.z = z;

      const spread = isEmoji ? 1.7 : isSmoke ? 0.7 : isBubble ? 1.2 : 2;
      const force = isEmoji
        ? 7 + Math.random() * 6
        : isSmoke
          ? 2.2 + Math.random() * 2.8
          : isBubble
            ? 1.05 + Math.random() * 1.2
            : 8 + Math.random() * 10;

      p.vx = (Math.random() - 0.5) * force * spread;
      p.vy = isSmoke
        ? force * 1.15 + Math.random() * force * 0.3
        : isBubble
          ? force * 0.62 + Math.random() * force * 0.18
          : force * 0.8 + Math.random() * force * 0.2;
      p.vz = (Math.random() - 0.5) * force * spread;
      p.rvx = (Math.random() - 0.5) * (isSmoke ? 3 : isBubble ? 1.2 : 10);
      p.rvy = (Math.random() - 0.5) * (isSmoke ? 3.5 : isBubble ? 1.8 : 10);
      p.rvz = (Math.random() - 0.5) * (isSmoke ? 3 : isBubble ? 1.2 : 10);
      p.scale = isEmoji
        ? (0.8 + Math.random() * 0.4) * 0.8
        : isSmoke
          ? 0.48 + Math.random() * 0.34
          : isBubble
            ? 0.22 + Math.random() * 0.42
            : (0.8 + Math.random() * 0.4) * 0.5;

      const colorHex =
        config.colors[Math.floor(Math.random() * config.colors.length)];
      p.color.set(colorHex);
      meshRef.current.setColorAt(i, p.color);
      meshRef.current.instanceColor!.needsUpdate = true;
      spawned++;
    }
  };

  useEffect(() => {
    (window as any).createTapParticles = spawn;
    return () => {
      delete (window as any).createTapParticles;
    };
  }, [config, spawnVariant]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    if (!meshRef.current.instanceColor) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(MAX_COUNT * 3),
        3,
      );
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const d = Math.min(delta, 0.1);
    const gravity =
      spawnVariant === "smoke"
        ? -1.2
        : spawnVariant === "bubble"
          ? -0.35
          : GRAVITY;
    const drag =
      spawnVariant === "smoke"
        ? 0.994
        : spawnVariant === "bubble"
          ? 0.996
          : DRAG;

    for (let i = 0; i < MAX_COUNT; i++) {
      const p = particles[i];

      if (p.life > 0) {
        p.life -= d;
        p.vy += gravity * d;
        p.x += p.vx * d;
        p.y += p.vy * d;
        p.z += p.vz * d;
        p.vx *= drag;
        p.vy *= drag;
        p.vz *= drag;
        p.rx += p.rvx * d;
        p.ry += p.rvy * d;
        p.rz += p.rvz * d;

        if (spawnVariant === "smoke") {
          p.vx += Math.sin((p.y + p.z) * 0.12) * d * 0.04;
          p.vz += Math.cos((p.x + p.y) * 0.12) * d * 0.04;
        } else if (spawnVariant === "bubble") {
          p.vx += Math.sin((p.y + p.z) * 0.09) * d * 0.028;
          p.vz += Math.cos((p.x + p.y) * 0.09) * d * 0.028;
        }

        const lifeRatio = Math.max(0, p.life / Math.max(p.maxLife, 0.001));
        const currentScale =
          spawnVariant === "smoke"
            ? p.scale * (0.9 + (1 - lifeRatio) * 1.35)
            : spawnVariant === "bubble"
              ? p.scale * (0.95 + (1 - lifeRatio) * 0.65)
              : p.scale * Math.max(0, p.life / 1.5);
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        meshRef.current.setMatrixAt(i, createEmptyMatrix());
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[config.geo, config.mat, MAX_COUNT]}
      frustumCulled={false}
    />
  );
}

const MAX_BUBBLE_COUNT = 96;
const BUBBLE_PARTICLE_RATIO = 0.18;
const MAX_BUBBLES_PER_TAP = 4;

function BubbleTapParticles() {
  const shellRef = useRef<InstancedMesh>(null);
  const innerRef = useRef<InstancedMesh>(null);
  const highlightRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const emptyMatrix = useMemo(() => createEmptyMatrix(), []);

  const particles = useMemo<BubbleParticle[]>(
    () =>
      new Array(MAX_BUBBLE_COUNT).fill(0).map(() => ({
        life: 0,
        maxLife: 0,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        rvx: 0,
        rvy: 0,
        rvz: 0,
        scale: 1,
        bucket: 0,
        color: new Color(),
        wobbleOffset: 0,
        wobbleSpeed: 0,
        driftStrength: 0,
        stretch: 1,
        highlightOffset: [0, 0, 0],
      })),
    [],
  );

  const configureMeshColors = React.useCallback(
    (mesh: InstancedMesh | null) => {
      if (!mesh) return;

      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      if (!mesh.instanceColor) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(MAX_BUBBLE_COUNT * 3),
          3,
        );
      }
    },
    [],
  );

  const spawn = React.useCallback(
    (x: number, y: number, z: number, count: number) => {
      const shellMesh = shellRef.current;
      const innerMesh = innerRef.current;
      if (!shellMesh || !innerMesh) return;

      const spawnTarget = Math.min(
        MAX_BUBBLES_PER_TAP,
        Math.max(1, Math.ceil(count * BUBBLE_PARTICLE_RATIO)),
      );

      let spawned = 0;
      for (let i = 0; i < MAX_BUBBLE_COUNT; i++) {
        if (spawned >= spawnTarget) break;
        if (particles[i].life > 0) continue;

        const p = particles[i];
        const angle = Math.random() * Math.PI * 2;
        const lateralForce = 0.14 + Math.random() * 0.18;
        const shellColor =
          BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];

        p.life = 2.4 + Math.random() * 1.3;
        p.maxLife = p.life;
        p.x = x + (Math.random() - 0.5) * 1.2;
        p.y = y + PARTICLES_Y_OFFSET - 0.06 + Math.random() * 0.08;
        p.z = z + (Math.random() - 0.5) * 0.14;
        p.vx = Math.cos(angle) * lateralForce;
        p.vy = 0.9 + Math.random() * 0.45;
        p.vz = Math.sin(angle) * lateralForce;
        p.rx = Math.random() * Math.PI * 2;
        p.ry = Math.random() * Math.PI * 2;
        p.rz = Math.random() * Math.PI * 2;
        p.rvx = (Math.random() - 0.5) * 0.4;
        p.rvy = (Math.random() - 0.5) * 0.65;
        p.rvz = (Math.random() - 0.5) * 0.4;
        p.scale = 0.24 + Math.random() * 0.22;
        p.wobbleOffset = Math.random() * Math.PI * 2;
        p.wobbleSpeed = 1 + Math.random() * 1.2;
        p.driftStrength = 0.05 + Math.random() * 0.05;
        p.stretch = 0.92 + Math.random() * 0.18;
        p.highlightOffset = [
          -0.28 + Math.random() * 0.05,
          0.22 + Math.random() * 0.04,
          0.34 + Math.random() * 0.05,
        ];
        p.color.set(shellColor);

        shellMesh.setColorAt(i, p.color);
        innerMesh.setColorAt(i, p.color);
        spawned++;
      }

      if (shellMesh.instanceColor) {
        shellMesh.instanceColor.needsUpdate = true;
      }
      if (innerMesh.instanceColor) {
        innerMesh.instanceColor.needsUpdate = true;
      }
    },
    [particles],
  );

  useEffect(() => {
    (window as any).createTapParticles = spawn;
    return () => {
      delete (window as any).createTapParticles;
    };
  }, [spawn]);

  useLayoutEffect(() => {
    configureMeshColors(shellRef.current);
    configureMeshColors(innerRef.current);
    if (highlightRef.current) {
      highlightRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }
  }, [configureMeshColors]);

  useFrame((state, delta) => {
    const shellMesh = shellRef.current;
    const innerMesh = innerRef.current;
    const highlightMesh = highlightRef.current;

    if (!shellMesh || !innerMesh || !highlightMesh) return;

    const d = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < MAX_BUBBLE_COUNT; i++) {
      const p = particles[i];

      if (p.life > 0) {
        p.life -= d;

        const wobble = Math.sin(time * p.wobbleSpeed + p.wobbleOffset);
        const sway = Math.cos(
          time * (p.wobbleSpeed * 0.82) + p.wobbleOffset * 0.7,
        );

        p.vx += wobble * p.driftStrength * d;
        p.vz += sway * p.driftStrength * d;
        p.vy = Math.min(p.vy + 0.2 * d, 1.55);

        p.x += p.vx * d;
        p.y += p.vy * d;
        p.z += p.vz * d;

        p.vx *= 0.988;
        p.vy *= 0.999;
        p.vz *= 0.988;

        p.rx += p.rvx * d;
        p.ry += p.rvy * d;
        p.rz += p.rvz * d;

        const lifeRatio = Math.max(0, p.life / Math.max(p.maxLife, 0.001));
        const age = 1 - lifeRatio;
        const entrance = Math.min(1, age / 0.16);
        const fadeOut = lifeRatio < 0.2 ? lifeRatio / 0.2 : 1;
        const currentScale = p.scale * entrance * fadeOut * (1 + age * 0.08);

        const shellScaleX = currentScale * (1 + wobble * 0.06);
        const shellScaleY = currentScale * p.stretch * (1 - wobble * 0.035);
        const shellScaleZ = currentScale * (1 + sway * 0.05);

        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.set(shellScaleX, shellScaleY, shellScaleZ);
        dummy.updateMatrix();
        shellMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.set(
          shellScaleX * 0.88,
          shellScaleY * 0.88,
          shellScaleZ * 0.88,
        );
        dummy.updateMatrix();
        innerMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(
          p.x + currentScale * (p.highlightOffset[0] + wobble * 0.04),
          p.y + currentScale * (p.highlightOffset[1] + Math.abs(sway) * 0.05),
          p.z + currentScale * p.highlightOffset[2],
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(
          currentScale * 0.2,
          currentScale * 0.28,
          currentScale * 0.18,
        );
        dummy.updateMatrix();
        highlightMesh.setMatrixAt(i, dummy.matrix);
      } else {
        shellMesh.setMatrixAt(i, emptyMatrix);
        innerMesh.setMatrixAt(i, emptyMatrix);
        highlightMesh.setMatrixAt(i, emptyMatrix);
      }
    }

    shellMesh.instanceMatrix.needsUpdate = true;
    innerMesh.instanceMatrix.needsUpdate = true;
    highlightMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={shellRef}
        args={[
          SHARED_GEOMETRIES.bubbleSphere,
          SHARED_MATERIALS.bubbles,
          MAX_BUBBLE_COUNT,
        ]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={innerRef}
        args={[
          SHARED_GEOMETRIES.bubbleSphere,
          SHARED_MATERIALS.bubbleInner,
          MAX_BUBBLE_COUNT,
        ]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={highlightRef}
        args={[
          SHARED_GEOMETRIES.bubbleSphere,
          SHARED_MATERIALS.bubbleHighlight,
          MAX_BUBBLE_COUNT,
        ]}
        frustumCulled={false}
      />
    </group>
  );
}

function EmojiTapParticles() {
  const meshRefs = useRef<InstancedMesh[]>([]);
  const dummy = useMemo(() => new Object3D(), []);
  const emptyMatrix = useMemo(() => createEmptyMatrix(), []);
  const emojiMaterials = useMemo(
    () =>
      EMOJI_GLYPHS.map((emoji) => {
        const texture = createEmojiTexture(emoji);
        return new THREE.MeshBasicMaterial({
          map: texture ?? null,
          transparent: true,
          alphaTest: 0.1,
          toneMapped: false,
        });
      }),
    [],
  );

  const particles = useMemo<BasicParticle[]>(
    () =>
      new Array(MAX_COUNT).fill(0).map(() => ({
        life: 0,
        maxLife: 0,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        rvx: 0,
        rvy: 0,
        rvz: 0,
        scale: 1,
        bucket: 0,
        color: new Color(),
      })),
    [],
  );

  const spawn = (x: number, y: number, z: number, count: number) => {
    let spawned = 0;

    for (let i = 0; i < MAX_COUNT; i++) {
      if (spawned >= count) break;
      if (particles[i].life > 0) continue;

      const p = particles[i];
      p.life = 1.2 + Math.random() * 0.45;
      p.maxLife = p.life;
      p.x = x;
      p.y = y + PARTICLES_Y_OFFSET - 0.1;
      p.z = z;
      const radiusForce = 12 + Math.random() * 10;
      const heightForce = 13 + Math.random() * 7;
      p.vx = (Math.random() - 0.5) * radiusForce * 1.9;
      p.vy = heightForce + Math.random() * 3.5;
      p.vz = (Math.random() - 0.5) * radiusForce * 1.9;
      p.rvx = (Math.random() - 0.5) * 6;
      p.rvy = (Math.random() - 0.5) * 8;
      p.rvz = (Math.random() - 0.5) * 6;
      p.scale = 1.15 + Math.random() * 0.35;
      p.bucket = Math.floor(Math.random() * EMOJI_GLYPHS.length);
      spawned++;
    }
  };

  useEffect(() => {
    (window as any).createTapParticles = spawn;
    return () => {
      delete (window as any).createTapParticles;
    };
  }, []);

  useLayoutEffect(() => {
    meshRefs.current.forEach((mesh) => {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    });
  }, []);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);

    particles.forEach((p) => {
      if (p.life > 0) {
        p.life -= d;
        p.vy += GRAVITY * d * 0.7;
        p.x += p.vx * d;
        p.y += p.vy * d;
        p.z += p.vz * d;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.vz *= DRAG;
        p.rx += p.rvx * d;
        p.ry += p.rvy * d;
        p.rz += p.rvz * d;
      }
    });

    meshRefs.current.forEach((mesh, bucketIndex) => {
      particles.forEach((p, particleIndex) => {
        if (p.life > 0 && p.bucket === bucketIndex) {
          const currentScale = p.scale * Math.max(0, p.life / 1.6);
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(p.rx, p.ry, p.rz);
          dummy.scale.set(currentScale, currentScale, currentScale);
          dummy.updateMatrix();
          mesh.setMatrixAt(particleIndex, dummy.matrix);
        } else {
          mesh.setMatrixAt(particleIndex, emptyMatrix);
        }
      });

      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      {emojiMaterials.map((material, index) => (
        <instancedMesh
          key={EMOJI_GLYPHS[index]}
          ref={(mesh) => {
            if (mesh) meshRefs.current[index] = mesh;
          }}
          args={[SHARED_GEOMETRIES.plane, material, MAX_COUNT]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

type LaserBeam = {
  life: number;
  origin: [number, number, number];
  dx: number;
  dy: number;
  dz: number;
  speed: number;
  length: number;
  width: number;
};

function LaserTapParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const emptyMatrix = useMemo(() => createEmptyMatrix(), []);
  const laserMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff2a2a",
        emissive: "#ff0000",
        emissiveIntensity: 2.2,
        transparent: true,
      }),
    [],
  );
  const beams = useMemo<LaserBeam[]>(
    () =>
      new Array(48).fill(0).map(() => ({
        life: 0,
        origin: [0, 0, 0],
        dx: 0,
        dy: 0,
        dz: 1,
        speed: 0,
        length: 0,
        width: 0,
      })),
    [],
  );

  const spawn = (x: number, y: number, z: number, count: number) => {
    let spawned = 0;

    for (let i = 0; i < beams.length; i++) {
      if (spawned >= Math.max(8, count)) break;
      if (beams[i].life > 0) continue;

      const beam = beams[i];
      beam.life = 0.2 + Math.random() * 0.18;
      beam.origin = [x, y + 1, z + 0.1];
      const theta = Math.random() * Math.PI * 2;
      const yComponent = Math.random() * 0.95;
      const radial = Math.sqrt(Math.max(0.001, 1 - yComponent * yComponent));
      dir.set(Math.cos(theta) * radial, yComponent, Math.sin(theta) * radial);
      if (dir.y < 0.08) {
        dir.y = 0.08 + Math.random() * 0.18;
        dir.normalize();
      }
      beam.dx = dir.x;
      beam.dy = dir.y;
      beam.dz = dir.z;
      beam.speed = 10 + Math.random() * 6;
      beam.length = 1.4 + Math.random() * 1.6;
      beam.width = 0.018 + Math.random() * 0.01;
      spawned++;
    }
  };

  useEffect(() => {
    (window as any).createTapParticles = spawn;
    return () => {
      delete (window as any).createTapParticles;
    };
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    beams.forEach((beam, index) => {
      if (!meshRef.current) return;

      if (beam.life > 0) {
        beam.life -= delta;
        const age = Math.max(0, 0.45 - beam.life);
        const distance = age * beam.speed;
        const currentLength = beam.length * Math.max(0.2, beam.life / 0.38);

        pos
          .set(...beam.origin)
          .addScaledVector(dir.set(beam.dx, beam.dy, beam.dz), distance);
        dummy.position.copy(pos);
        dummy.quaternion.setFromUnitVectors(up, dir);
        dummy.scale.set(beam.width, currentLength, beam.width);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(index, dummy.matrix);
      } else {
        meshRef.current.setMatrixAt(index, emptyMatrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        new THREE.CylinderGeometry(1, 1, 1, 8),
        laserMaterial,
        beams.length,
      ]}
      frustumCulled={false}
    />
  );
}

function SmokeTapParticles() {
  return (
    <BasicTapParticles
      spawnVariant="smoke"
      config={{
        geo: SHARED_GEOMETRIES.cloudSphere,
        mat: SHARED_MATERIALS.smoke,
        colors: ["#d6d9df", "#bcc1ca", "#9ea4af", "#f0f2f5"],
      }}
    />
  );
}

const BUBBLE_COLORS = ["#d8f1ff", "#c7ebff", "#b5e3ff", "#a8dbff"] as const;

export function TapEffects({ id }: { id?: string }) {
  const { tapEffects, previewMode } = useCoreStore();

  const selectedTapEffect = id
    ? tapEffects.find((u) => u.id === id)
    : previewMode === "tapEffect"
      ? tapEffects.find((u) => u.preview)
      : tapEffects.find((u) => u.enabled);

  const effectValue = selectedTapEffect?.effectId ?? 0;

  if (selectedTapEffect?.effectId === undefined) {
    return null;
  }

  if (effectValue === 4) {
    return <LaserTapParticles />;
  }

  if (effectValue === 5) {
    return <EmojiTapParticles />;
  }

  if (effectValue === 6) {
    return <SmokeTapParticles />;
  }

  if (effectValue === 7) {
    return <BubbleTapParticles />;
  }

  const config: BasicConfig =
    effectValue === 1
      ? {
          geo: SHARED_GEOMETRIES.plane,
          mat: SHARED_MATERIALS.confetti,
          colors: colorConfigs.confetti,
        }
      : effectValue === 2
        ? {
            geo: SHARED_GEOMETRIES.heart,
            mat: SHARED_MATERIALS.heart,
            colors: colorConfigs.hearts,
          }
        : effectValue === 3
          ? {
              geo: SHARED_GEOMETRIES.star,
              mat: SHARED_MATERIALS.star,
              colors: colorConfigs.stars,
            }
          : {
              geo: SHARED_GEOMETRIES.sphere,
              mat: SHARED_MATERIALS.sphere,
              colors: colorConfigs.default,
            };

  return <BasicTapParticles config={config} />;
}
