import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Cloud, Sparkles, Clouds, Sky } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import { THEME_CONFIG } from "@/store/upgradesConfig";
import * as THREE from "three";

// Pre-create and reuse geometries (CRITICAL for performance)
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
    const outerRadius = 0.5;
    const innerRadius = 0.2;
    const step = (Math.PI * 2) / (spikes * 2);
    shape.moveTo(outerRadius, 0);
    for (let i = 1; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.cos(i * step) * radius, Math.sin(i * step) * radius);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  })(),

  sphere: new THREE.SphereGeometry(0.1, 8, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  cylinder: new THREE.CylinderGeometry(0.02, 0.02, 0.3),
  cloudSphere: new THREE.SphereGeometry(1, 8, 8),
};

// Pre-create and reuse materials
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
    opacity: 0.3,
    side: THREE.DoubleSide,
  }),
};

// Particle pool for object reuse
class ParticlePool {
  private pool: any[] = [];
  private maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  get() {
    return this.pool.length > 0 ? this.pool.pop() : null;
  }

  release(particle: any) {
    if (this.pool.length < this.maxSize) {
      // Reset particle properties
      particle.life = 0;
      particle.position = [0, 0, 0];
      particle.velocity = [0, 0, 0];
      this.pool.push(particle);
    }
  }

  clear() {
    this.pool.length = 0;
  }
}

// Global particle pool
const PARTICLE_POOL = new ParticlePool();

// Matrix pool for object reuse
const MATRIX_POOL = {
  matrix: new THREE.Matrix4(),
  euler: new THREE.Euler(),
  vector: new THREE.Vector3(),

  reset() {
    this.matrix.identity();
    this.euler.set(0, 0, 0);
    this.vector.set(0, 0, 0);
  },
};

// Constants for limits - BALANCED LIMITS FOR GOOD VISUAL QUALITY
const MAX_TAP_PARTICLES = 80; // Balanced for visual quality
const MAX_RAIN_DROPS = 60; // Balanced for visual quality
const MAX_CLOUD_PARTICLES = 30; // Balanced for visual quality
const TAP_PARTICLE_COUNT = 6; // Balanced for visual quality

export function StarEffect() {
  return (
    <Sparkles
      count={80} // Balanced for visual quality
      scale={[50, 30, 50]}
      size={1.5}
      speed={0.1}
      opacity={0.8}
      color="#FFFFFF"
      position={[0, 10, 0]}
    />
  );
}

export function RainEffect() {
  const { upgrades } = useGameStore();
  const rainUpgrade = upgrades.find((u) => u.id === "environment_rain");
  const rainEnabled = rainUpgrade?.unlocked && rainUpgrade?.selected;

  // Use refs instead of state to avoid React re-renders
  const rainDropsRef = useRef<
    Array<{
      id: number;
      position: [number, number, number];
      velocity: [number, number, number];
      life: number;
      maxLife: number;
    }>
  >([]);

  const dropIdCounter = useRef(0);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  const createRainDrops = React.useCallback(() => {
    if (!rainEnabled) return;

    const currentDrops = rainDropsRef.current;
    if (currentDrops.length >= MAX_RAIN_DROPS) return; // Limit check

    const newDrops = Array.from(
      { length: Math.min(3, MAX_RAIN_DROPS - currentDrops.length) },
      () => {
        const radius = 5.5;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;

        const x = Math.cos(angle) * distance;
        const y = 15;
        const z = Math.sin(angle) * distance;

        const vx = (Math.random() - 0.5) * 0.5;
        const vy = -(2 + Math.random() * 2);
        const vz = (Math.random() - 0.5) * 0.5;

        return {
          id: dropIdCounter.current++,
          position: [x, y, z] as [number, number, number],
          velocity: [vx, vy, vz] as [number, number, number],
          life: 3.0,
          maxLife: 3.0,
        };
      }
    );

    // Mutate array in place instead of creating new one
    rainDropsRef.current.push(...newDrops);
  }, [rainEnabled]);

  useFrame((state, delta) => {
    if (state.clock.getElapsedTime() % 0.2 < delta) {
      // Reduced frequency
      createRainDrops();
    }

    // Update particles in place (no setState)
    const drops = rainDropsRef.current;
    let aliveCount = 0;

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];

      // Update position
      drop.position[0] += drop.velocity[0] * delta * 60;
      drop.position[1] += drop.velocity[1] * delta * 60;
      drop.position[2] += drop.velocity[2] * delta * 60;

      // Update life
      drop.life -= delta;

      // Check if alive
      if (drop.life > 0 && drop.position[1] > -10) {
        // Keep this particle, update instanced mesh
        const lifeRatio = Math.max(0, drop.life / drop.maxLife);
        const scale = 0.1 + 0.2 * lifeRatio;

        MATRIX_POOL.matrix.makeScale(scale, scale * 3, scale);
        MATRIX_POOL.matrix.setPosition(
          drop.position[0],
          drop.position[1],
          drop.position[2]
        );

        if (instancedMeshRef.current) {
          instancedMeshRef.current.setMatrixAt(aliveCount, MATRIX_POOL.matrix);
          // Set opacity via material (simplified for now)
        }

        aliveCount++;
      }
    }

    // Remove dead particles by keeping only alive ones
    if (aliveCount < drops.length) {
      drops.splice(aliveCount);
    }

    // Update instanced mesh count
    if (instancedMeshRef.current) {
      instancedMeshRef.current.count = aliveCount;
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!rainEnabled) return null;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[SHARED_GEOMETRIES.cylinder, SHARED_MATERIALS.rain, MAX_RAIN_DROPS]}
    />
  );
}

export function CloudEffect() {
  const { upgrades } = useGameStore();
  const cloudUpgrade = upgrades.find((u) => u.id === "environment_clouds");
  const cloudEnabled = cloudUpgrade?.unlocked && cloudUpgrade?.selected;

  // Use refs instead of state
  const cloudParticlesRef = useRef<
    Array<{
      id: number;
      position: [number, number, number];
      velocity: [number, number, number];
      scale: number;
      opacity: number;
    }>
  >([]);

  const particleIdCounter = useRef(0);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  const createCloudParticles = React.useCallback(() => {
    if (!cloudEnabled) return;

    const currentParticles = cloudParticlesRef.current;
    if (currentParticles.length >= MAX_CLOUD_PARTICLES) return;

    const newParticles = Array.from(
      { length: Math.min(4, MAX_CLOUD_PARTICLES - currentParticles.length) },
      () => {
        const radius = 1 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = 1 + Math.random() * 4;
        const z = Math.sin(angle) * radius - 2;

        return {
          id: particleIdCounter.current++,
          position: [x, y, z] as [number, number, number],
          velocity: [
            (Math.random() - 0.5) * 0.05, // Much slower movement
            0,
            (Math.random() - 0.5) * 0.05,
          ] as [number, number, number],
          scale: 0.8 + Math.random() * 1.2, // Larger scale
          opacity: 0.2 + Math.random() * 0.3, // Higher opacity
        };
      }
    );

    // Mutate array in place
    cloudParticlesRef.current.push(...newParticles);
  }, [cloudEnabled]);

  useFrame((state, delta) => {
    if (state.clock.getElapsedTime() % 4 < delta) {
      createCloudParticles();
    }

    // Update particles in place
    const particles = cloudParticlesRef.current;
    let aliveCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      // Update position
      particle.position[0] += particle.velocity[0] * delta * 60;
      particle.position[1] += particle.velocity[1] * delta * 60;
      particle.position[2] += particle.velocity[2] * delta * 60;

      // Check if alive
      const distance = Math.sqrt(
        particle.position[0] ** 2 + particle.position[2] ** 2
      );

      if (distance < 8) {
        // Keep this particle, update instanced mesh
        MATRIX_POOL.matrix.makeScale(
          particle.scale,
          particle.scale,
          particle.scale
        );
        MATRIX_POOL.matrix.setPosition(
          particle.position[0],
          particle.position[1],
          particle.position[2]
        );

        if (instancedMeshRef.current) {
          instancedMeshRef.current.setMatrixAt(aliveCount, MATRIX_POOL.matrix);
        }

        aliveCount++;
      }
    }

    // Remove dead particles
    if (aliveCount < particles.length) {
      particles.splice(aliveCount);
    }

    // Update instanced mesh count
    if (instancedMeshRef.current) {
      instancedMeshRef.current.count = aliveCount;
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!cloudEnabled) return null;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[
        SHARED_GEOMETRIES.cloudSphere,
        SHARED_MATERIALS.cloud,
        MAX_CLOUD_PARTICLES,
      ]}
    />
  );
}

export function TapEffect() {
  const { upgrades } = useGameStore();

  const selectedTapEffect = upgrades.find(
    (u) => u.category === "tapEffects" && u.selected
  );

  const tapEffectType =
    selectedTapEffect?.effect.value === 1
      ? "confetti"
      : selectedTapEffect?.effect.value === 2
      ? "hearts"
      : selectedTapEffect?.effect.value === 3
      ? "stars"
      : "default";

  // Use refs instead of state
  const tapParticlesRef = useRef<
    Array<{
      id: number;
      position: [number, number, number];
      velocity: [number, number, number];
      life: number;
      maxLife: number;
      color: string;
      rotation: [number, number, number];
      rotationSpeed: [number, number, number];
      scale: number;
      particleType: "default" | "confetti" | "hearts" | "stars";
    }>
  >([]);

  const particleIdCounter = useRef(0);
  const lastTapTime = useRef(0);

  // Separate instanced meshes for each color
  const instancedMeshRefs = useRef<{
    [color: string]: THREE.InstancedMesh | null;
  }>({});

  // Track particle counts per color
  const colorCounts = useRef<{ [color: string]: number }>({});

  // Memoize color arrays
  const colorConfigs = useMemo(
    () => ({
      confetti: [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
      ],
      hearts: ["#FF69B4", "#FF1493", "#DC143C", "#FF007F"],
      stars: ["#FFD700", "#FFA500", "#FF8C00"],
      default: ["#ffffff", "#cccccc", "#999999"],
    }),
    []
  );

  const createTapParticles = React.useCallback(
    (x: number, y: number, z: number, count: number = TAP_PARTICLE_COUNT) => {
      const now = Date.now();
      // Throttle tap creation to prevent spam
      if (now - lastTapTime.current < 50) return; // 50ms throttle
      lastTapTime.current = now;

      const currentParticles = tapParticlesRef.current;
      // Remove oldest particles if we're at the limit
      if (currentParticles.length >= MAX_TAP_PARTICLES) {
        currentParticles.splice(0, MAX_TAP_PARTICLES - count);
      }

      const colors = colorConfigs[tapEffectType] || colorConfigs.default;
      const particleType = tapEffectType as
        | "default"
        | "confetti"
        | "hearts"
        | "stars";

      const newParticles = Array.from({ length: count }, () => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 0.2 + Math.random() * 0.3; // Better speed for visual quality
        const color = colors[Math.floor(Math.random() * colors.length)];

        const vx = Math.sin(phi) * Math.cos(theta) * speed;
        const vy = Math.cos(phi) * speed;
        const vz = Math.sin(phi) * Math.sin(theta) * speed;

        // Try to get from pool first
        let particle = PARTICLE_POOL.get();
        if (!particle) {
          particle = {
            id: particleIdCounter.current++,
            position: [x, y, z] as [number, number, number],
            velocity: [vx, vy, vz] as [number, number, number],
            life: 2.0, // Better lifetime for visual quality
            maxLife: 2.0,
            color,
            rotation: [0, 0, 0] as [number, number, number],
            rotationSpeed: [
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8,
            ] as [number, number, number],
            scale: (0.6 + Math.random() * 0.3) * 0.4, // Smaller scale
            particleType,
          };
        } else {
          // Reuse existing particle
          particle.id = particleIdCounter.current++;
          particle.position = [x, y, z];
          particle.velocity = [vx, vy, vz];
          particle.life = 2.0;
          particle.maxLife = 2.0;
          particle.color = color;
          particle.rotation = [0, 0, 0];
          particle.rotationSpeed = [
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
          ];
          particle.scale = (0.6 + Math.random() * 0.3) * 0.4;
          particle.particleType = particleType;
        }

        return particle;
      });

      // Mutate array in place
      currentParticles.push(...newParticles);
    },
    [tapEffectType, colorConfigs]
  );

  useFrame((state, delta) => {
    // Update particles in place
    const particles = tapParticlesRef.current;
    let aliveCount = 0;

    // Reset color counts
    colorCounts.current = {};

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      // Update position
      particle.position[0] += particle.velocity[0] * delta * 60;
      particle.position[1] += particle.velocity[1] * delta * 60;
      particle.position[2] += particle.velocity[2] * delta * 60;

      // Update rotation
      particle.rotation[0] += particle.rotationSpeed[0] * delta;
      particle.rotation[1] += particle.rotationSpeed[1] * delta;
      particle.rotation[2] += particle.rotationSpeed[2] * delta;

      // Update life
      particle.life -= delta;

      // Check if alive
      if (particle.life > 0) {
        // Keep this particle, update instanced mesh
        const lifeRatio = Math.max(0, particle.life / particle.maxLife);
        const scale = particle.scale * (0.5 + 0.5 * lifeRatio);

        MATRIX_POOL.euler.set(
          particle.rotation[0],
          particle.rotation[1],
          particle.rotation[2]
        );
        MATRIX_POOL.matrix.makeRotationFromEuler(MATRIX_POOL.euler);
        MATRIX_POOL.vector.set(scale, scale, scale);
        MATRIX_POOL.matrix.scale(MATRIX_POOL.vector);
        MATRIX_POOL.matrix.setPosition(
          particle.position[0],
          particle.position[1],
          particle.position[2]
        );

        // Get or create instanced mesh for this color
        const colorKey = particle.color;
        if (!colorCounts.current[colorKey]) {
          colorCounts.current[colorKey] = 0;
        }

        const instancedMesh = instancedMeshRefs.current[colorKey];
        if (instancedMesh) {
          instancedMesh.setMatrixAt(
            colorCounts.current[colorKey],
            MATRIX_POOL.matrix
          );
          colorCounts.current[colorKey]++;
        }

        aliveCount++;
      } else {
        // Return to pool and mark for removal
        PARTICLE_POOL.release(particle);
        // Move this particle to the end so it gets removed
        particles[i] = particles[particles.length - 1];
        particles.pop();
        i--; // Recheck this index since we moved a particle here
      }
    }

    // Particles are already removed inline above

    // Update all instanced mesh counts
    Object.keys(colorCounts.current).forEach((colorKey) => {
      const instancedMesh = instancedMeshRefs.current[colorKey];
      if (instancedMesh) {
        instancedMesh.count = colorCounts.current[colorKey];
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  useEffect(() => {
    (window as any).createTapParticles = createTapParticles;
    return () => {
      delete (window as any).createTapParticles;
      // Clean up pools when component unmounts
      PARTICLE_POOL.clear();
      MATRIX_POOL.reset();
      // Clear all particle arrays
      tapParticlesRef.current = [];
    };
  }, [createTapParticles]);

  // Get geometry and material based on effect type
  const { geometry, material } = useMemo(() => {
    switch (tapEffectType) {
      case "confetti":
        return {
          geometry: SHARED_GEOMETRIES.plane,
          material: SHARED_MATERIALS.confetti,
        };
      case "hearts":
        return {
          geometry: SHARED_GEOMETRIES.heart,
          material: SHARED_MATERIALS.heart,
        };
      case "stars":
        return {
          geometry: SHARED_GEOMETRIES.star,
          material: SHARED_MATERIALS.star,
        };
      default:
        return {
          geometry: SHARED_GEOMETRIES.sphere,
          material: SHARED_MATERIALS.sphere,
        };
    }
  }, [tapEffectType]);

  // Get all possible colors for this effect type
  const colors = useMemo(() => {
    return colorConfigs[tapEffectType] || colorConfigs.default;
  }, [tapEffectType, colorConfigs]);

  return (
    <group>
      {colors.map((color) => (
        <instancedMesh
          key={color}
          ref={(mesh) => {
            instancedMeshRefs.current[color] = mesh;
          }}
          args={[geometry, material, MAX_TAP_PARTICLES]}
        >
          <meshStandardMaterial color={color} transparent opacity={0.8} />
        </instancedMesh>
      ))}
    </group>
  );
}

export function FisheyeIntensityEffect() {
  return null;
}

export function ParticleEffects() {
  return (
    <group>
      <StarEffect />
      <RainEffect />
      <CloudEffect />
      <TapEffect />
      <FisheyeIntensityEffect />
    </group>
  );
}
