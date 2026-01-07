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
  Texture,
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
      y + 7 * 0.1
    );
    shape.bezierCurveTo(
      x - 6 * 0.1,
      y + 11 * 0.1,
      x - 3 * 0.1,
      y + 15.4 * 0.1,
      x + 5 * 0.1,
      y + 19 * 0.1
    );
    shape.bezierCurveTo(
      x + 12 * 0.1,
      y + 15.4 * 0.1,
      x + 16 * 0.1,
      y + 11 * 0.1,
      x + 16 * 0.1,
      y + 6.4 * 0.1
    );
    shape.bezierCurveTo(
      x + 16 * 0.1,
      y + 7 * 0.1,
      x + 16 * 0.1,
      y,
      x + 10 * 0.1,
      y
    );
    shape.bezierCurveTo(
      x + 7 * 0.1,
      y,
      x + 5 * 0.1,
      y + 5 * 0.1,
      x + 5 * 0.1,
      y + 5 * 0.1
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
  plane: new THREE.PlaneGeometry(1, 1),
  cylinder: new THREE.CylinderGeometry(0.02, 0.02, 0.3),
  cloudSphere: new THREE.SphereGeometry(1, 8, 8),
};

const SHARED_MATERIALS = {
  heart: new THREE.MeshStandardMaterial({ transparent: true }),
  star: new THREE.MeshStandardMaterial({ transparent: true }),
  sphere: new THREE.MeshStandardMaterial({ transparent: true }),
  confetti: new THREE.MeshStandardMaterial({
    transparent: true,
    side: THREE.DoubleSide,
  }),
  rain: new THREE.MeshStandardMaterial({ color: "#87CEEB", transparent: true }),
  cloud: new THREE.MeshStandardMaterial({
    color: "#ffffff",
    transparent: true,
  }),
};

// #region CONSTANTS
const MAX_TAP_PARTICLES = 150;
const MAX_RAIN_DROPS = 100;
const TAP_PARTICLE_COUNT = 15;
const CLOUD_COUNT_MIN = 3;
const CLOUD_COUNT_MAX = 5;
const BUBBLES_COUNT_MIN = 6;
const BUBBLES_COUNT_MAX = 13;
// #endregion

// Sparkles from drei
export function StarsEffect() {
  const { weatherEffects } = useCoreStore();
  const starsUpgrade = weatherEffects.find((u) => u.id === "environment_stars");
  const starsEnabled = useMemo(
    () => starsUpgrade?.purchased && starsUpgrade?.enabled,
    [starsUpgrade]
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

// rectangular plane emitter with falling droplets
export function RainEffect() {
  const { weatherEffects } = useCoreStore();
  const rainUpgrade = weatherEffects.find((u) => u.id === "environment_rain");
  const rainEnabled = rainUpgrade?.purchased && rainUpgrade?.enabled;

  const [rainDrops, setRainDrops] = React.useState<
    Array<{
      id: number;
      position: [number, number, number];
      velocity: [number, number, number];
      life: number;
      maxLife: number;
    }>
  >([]);

  const dropIdCounter = useRef(0);

  // Create rain drops from circular emitter
  const createRainDrops = React.useCallback(() => {
    if (!rainEnabled) return;

    setRainDrops((prev) => {
      if (prev.length >= MAX_RAIN_DROPS) return prev; // limit check for performance

      const newDrops = Array.from({ length: 5 }, () => {
        // calculate a random position on a circle
        const radius = 5.5;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = Math.cos(angle) * distance;
        const y = 15; // Start from top
        const z = Math.sin(angle) * distance;

        // calculate falling velocity with slight randomness for natural effect
        const vx = (Math.random() - 0.5) * 0.5;
        const vy = -(2 + Math.random() * 2);
        const vz = (Math.random() - 0.5) * 0.5;

        return {
          id: dropIdCounter.current++,
          position: [x, y, z] as [number, number, number],
          velocity: [vx, vy, vz] as [number, number, number],
          life: 3.0, // 3 seconds lifetime
          maxLife: 3.0,
        };
      });

      return [...prev, ...newDrops];
    });
  }, [rainEnabled]);

  useFrame((state, delta) => {
    // create new drops infinitely
    if (state.clock.getElapsedTime() % 0.1 < delta) {
      createRainDrops();
    }

    // move raindrops down and remove when below ground or expired
    setRainDrops((prev) =>
      prev
        .map((drop) => ({
          ...drop,
          position: [
            drop.position[0] + drop.velocity[0] * delta * 60,
            drop.position[1] + drop.velocity[1] * delta * 60,
            drop.position[2] + drop.velocity[2] * delta * 60,
          ] as [number, number, number],
          life: drop.life - delta,
        }))
        .filter((drop) => drop.life > 0 && drop.position[1] > -4)
    );
  });

  if (!rainEnabled) return null;

  return (
    <group>
      {rainDrops.map((drop) => {
        const lifeRatio = Math.max(0, drop.life / drop.maxLife);
        const scale = 0.1 + 0.2 * lifeRatio;

        return (
          <mesh
            key={drop.id}
            position={drop.position}
            scale={[scale, scale * 3, scale]}
            geometry={SHARED_GEOMETRIES.cylinder}
            material={SHARED_MATERIALS.rain}
            material-opacity={lifeRatio}
          />
        );
      })}
    </group>
  );
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
        Math.random() * (CONFIG.BUBBLE_COUNT.MAX - CONFIG.BUBBLE_COUNT.MIN + 1)
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
  const clouds = useMemo(() => {
    const count =
      CONFIG.CLOUD_COUNT.MIN +
      Math.floor(
        Math.random() * (CONFIG.CLOUD_COUNT.MAX - CONFIG.CLOUD_COUNT.MIN + 1)
      );

    return generateClouds(count);
  }, []);

  return (
    <group>
      {clouds.map((cloud) => (
        <group key={cloud.id} position={cloud.position}>
          {cloud.bubbles.map((bubble, index) => (
            <mesh
              key={`${cloud.id}-bubble-${index}`}
              position={bubble.offset}
              scale={[bubble.scale, bubble.scale, bubble.scale]}
              geometry={SHARED_GEOMETRIES.cloudSphere}
              material={SHARED_MATERIALS.cloud}
            >
              <primitive
                object={SHARED_MATERIALS.cloud}
                opacity={bubble.opacity * (preview ? 0.5 : 1)}
                transparent
                attach="material"
              />
            </mesh>
          ))}
        </group>
      ))}
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
  default: ["#ffffff", "#cccccc", "#212121", "#000000", "#297AFF"],
};

export function TapEffects() {
  const { tapEffects, previewMode } = useCoreStore();

  const selectedTapEffect =
    previewMode === "tapEffect"
      ? tapEffects.find((u) => u.preview)
      : tapEffects.find((u) => u.enabled);

  const effectValue = selectedTapEffect?.effectId ?? 0;

  let activeConfig: {
    geo: BufferGeometry;
    mat: Material;
    colors: string[];
    texture?: Texture; // Optional texture for emojis
  } = {
    geo: SHARED_GEOMETRIES.sphere,
    mat: SHARED_MATERIALS.sphere,
    colors: colorConfigs.default,
  };

  if (effectValue === 1) {
    // Confetti
    activeConfig = {
      geo: SHARED_GEOMETRIES.plane,
      mat: SHARED_MATERIALS.confetti,
      colors: colorConfigs.confetti,
    };
  } else if (effectValue === 2) {
    // Hearts
    activeConfig = {
      geo: SHARED_GEOMETRIES.heart,
      mat: SHARED_MATERIALS.heart,
      colors: colorConfigs.hearts,
    };
  } else if (effectValue === 3) {
    // Stars
    activeConfig = {
      geo: SHARED_GEOMETRIES.star,
      mat: SHARED_MATERIALS.star,
      colors: colorConfigs.stars,
    };
  }

  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const particles = useMemo(() => {
    return new Array(MAX_COUNT).fill(0).map(() => ({
      life: 0,
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
      color: new Color(),
    }));
  }, []);

  const spawn = (x: number, y: number, z: number, count: number) => {
    if (!meshRef.current) return;

    let spawned = 0;
    for (let i = 0; i < MAX_COUNT; i++) {
      if (spawned >= count) break;

      if (particles[i].life <= 0) {
        const p = particles[i];
        p.life = 1.0 + Math.random() * 0.5;
        p.x = x;
        p.y = y;
        p.z = z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        // const speed = 0.2 + Math.random() * 0.4;
        // p.vx = Math.sin(phi) * Math.cos(theta) * speed * 20;
        // p.vy = Math.cos(phi) * speed * 20;
        // p.vz = Math.sin(phi) * Math.sin(theta) * speed * 20;

        // TODO: fix using correct maps and stuff
        if (effectValue <= 1) {
          // Spread factor: (0.2 is narrow, 2 is wide)
          const spread = 2;

          // Explosive force
          const force = 12 + Math.random() * 10;

          p.y = y + PARTICLES_Y_OFFSET;

          // p.vx = (Math.random() - 0.5) * force * spread;
          p.vy = force * 0.8 + Math.random() * force * 0.2;
          p.vz = (Math.random() - 0.5) * force * spread;

          p.vx = Math.sin(phi) * Math.cos(theta) * force * spread;
          // p.vy = Math.cos(phi) * speed * 20;
          // p.vz = Math.sin(phi) * Math.sin(theta) * speed * 20;

          // Apply extra rotation for confetti
          p.rvx = (Math.random() - 0.5) * 30;
          p.rvy = (Math.random() - 0.5) * 30;
          p.rvz = (Math.random() - 0.5) * 30;
        } else {
          // more narrow spred
          const spread = 2;

          // less explosive force
          const force = 8 + Math.random() * 10;

          p.y = y + PARTICLES_Y_OFFSET - 0.15;

          p.vx = (Math.random() - 0.5) * force * spread;
          p.vy = force * 0.8 + Math.random() * force * 0.2;
          p.vz = (Math.random() - 0.5) * force * spread;

          // less rotation
          p.rvx = (Math.random() - 0.5) * 10;
          p.rvy = (Math.random() - 0.5) * 10;
          p.rvz = (Math.random() - 0.5) * 10;
        }

        p.scale = (0.8 + Math.random() * 0.4) * 0.5;

        const colorHex =
          activeConfig.colors[
            Math.floor(Math.random() * activeConfig.colors.length)
          ];
        p.color.set(colorHex);

        meshRef.current.setColorAt(i, p.color);
        meshRef.current.instanceColor!.needsUpdate = true;

        spawned++;
      }
    }
  };

  useEffect(() => {
    (window as any).createTapParticles = spawn;
    return () => {
      delete (window as any).createTapParticles;
    };
  }, [activeConfig]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      // prepare GPU for position updates
      meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);

      // init color Buffer
      // fixes potential crashes when calling setColorAt
      if (!meshRef.current.instanceColor) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(MAX_COUNT * 3),
          3
        );
      }
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const d = Math.min(delta, 0.1);
    let activeParticles = 0;

    for (let i = 0; i < MAX_COUNT; i++) {
      const p = particles[i];

      if (p.life > 0) {
        p.life -= d;
        p.vy += GRAVITY * d;
        p.x += p.vx * d;
        p.y += p.vy * d;
        p.z += p.vz * d;

        p.vx *= DRAG;
        p.vy *= DRAG;
        p.vz *= DRAG;

        p.rx += p.rvx * d;
        p.ry += p.rvy * d;
        p.rz += p.rvz * d;

        const lifeRatio = p.life / 1.5;
        const currentScale = p.scale * Math.max(0, lifeRatio);

        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(i, dummy.matrix);
        activeParticles++;
      } else {
        meshRef.current.setMatrixAt(
          i,
          new Object3D().matrix.scale(new Object3D().scale.set(0, 0, 0))
        );
      }
    }

    if (activeParticles > 0 || meshRef.current.count > 0) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (selectedTapEffect?.effectId === undefined) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[activeConfig.geo, activeConfig.mat, MAX_COUNT]}
      frustumCulled={false}
    />
  );
}
