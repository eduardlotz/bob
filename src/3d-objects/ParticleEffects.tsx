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
  cloud: new THREE.MeshToonMaterial({ color: "#ffffff", transparent: true }),
};

// Constants for limits
const MAX_TAP_PARTICLES = 150;
const MAX_RAIN_DROPS = 100;
const MAX_CLOUD_PARTICLES = 50;
const TAP_PARTICLE_COUNT = 15;

// Star Effect - Permanent background stars
export function StarEffect() {
  return (
    <Sparkles
      count={200}
      scale={[50, 30, 50]}
      size={1.5}
      speed={0.1}
      opacity={0.8}
      color="#FFFFFF"
      position={[0, 10, 0]}
    />
  );
}

// Rain Effect using rectangular plane emitter with falling droplets
export function RainEffect() {
  const { upgrades } = useGameStore();
  const rainUpgrade = upgrades.find((u) => u.id === "environment_rain");
  const rainEnabled = rainUpgrade?.unlocked && rainUpgrade?.selected;

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

  // Create rain drops from rectangular plane emitter
  const createRainDrops = React.useCallback(() => {
    if (!rainEnabled) return;

    setRainDrops((prev) => {
      if (prev.length >= MAX_RAIN_DROPS) return prev; // Limit check

      const newDrops = Array.from({ length: 5 }, () => {
        // Random position on rectangular plane (emitter) - constrained to sphere radius
        const radius = 5.5; // Slightly smaller than the sphere radius (6)
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;

        const x = Math.cos(angle) * distance;
        const y = 15; // Start from top
        const z = Math.sin(angle) * distance;

        // Falling velocity (mostly downward with slight randomness)
        const vx = (Math.random() - 0.5) * 0.5;
        const vy = -(2 + Math.random() * 2); // Fall downward
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

  // Update rain drops in animation frame
  useFrame((state, delta) => {
    // Create new drops periodically
    if (state.clock.getElapsedTime() % 0.1 < delta) {
      createRainDrops();
    }

    setRainDrops(
      (prev) =>
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
          .filter((drop) => drop.life > 0 && drop.position[1] > -10) // Remove when below ground or expired
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
            scale={[scale, scale * 3, scale]} // Elongated drop shape
            geometry={SHARED_GEOMETRIES.cylinder}
            material={SHARED_MATERIALS.rain}
            material-opacity={lifeRatio}
          />
        );
      })}
    </group>
  );
}

// Cloud Effect using instanced spheres for better performance
export function CloudEffect() {
  const { upgrades } = useGameStore();
  const cloudUpgrade = upgrades.find((u) => u.id === "environment_clouds");
  const cloudEnabled = cloudUpgrade?.unlocked && cloudUpgrade?.selected;

  const [cloudParticles, setCloudParticles] = React.useState<
    Array<{
      id: number;
      position: [number, number, number];
      velocity: [number, number, number];
      scale: number;
      opacity: number;
    }>
  >([]);

  const particleIdCounter = useRef(0);

  // Create cloud particles
  const createCloudParticles = React.useCallback(() => {
    if (!cloudEnabled) return;

    setCloudParticles((prev) => {
      if (prev.length >= MAX_CLOUD_PARTICLES) return prev; // Limit check

      const newParticles = Array.from({ length: 8 }, () => {
        // Spawn from center (where blob head is) with small radius
        const radius = 1 + Math.random() * 3; // Small radius around center
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = 1 + Math.random() * 4; // Height range behind the counter
        const z = Math.sin(angle) * radius - 2; // Slightly behind the counter

        return {
          id: particleIdCounter.current++,
          position: [x, y, z] as [number, number, number],
          velocity: [
            (Math.random() - 0.5) * 0.15, // Even slower horizontal movement
            0, // No vertical movement - clouds stay at same height
            (Math.random() - 0.5) * 0.15,
          ] as [number, number, number],
          scale: 0.6 + Math.random() * 0.8, // Even smaller scale
          opacity: 0.15 + Math.random() * 0.25, // Lower opacity
        };
      });

      return [...prev, ...newParticles];
    });
  }, [cloudEnabled]);

  // Update cloud particles
  useFrame((state, delta) => {
    // Create new particles periodically (slower)
    if (state.clock.getElapsedTime() % 4 < delta) {
      createCloudParticles();
    }

    setCloudParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          position: [
            particle.position[0] + particle.velocity[0] * delta * 60,
            particle.position[1] + particle.velocity[1] * delta * 60,
            particle.position[2] + particle.velocity[2] * delta * 60,
          ] as [number, number, number],
        }))
        .filter((particle) => {
          // Remove particles that go too far from center
          const distance = Math.sqrt(
            particle.position[0] ** 2 + particle.position[2] ** 2
          );
          return distance < 8; // Much smaller area
        })
    );
  });

  if (!cloudEnabled) return null;

  return (
    <group>
      {cloudParticles.map((particle) => (
        <mesh
          key={particle.id}
          position={particle.position}
          scale={[particle.scale, particle.scale, particle.scale]}
          geometry={SHARED_GEOMETRIES.cloudSphere}
          material={SHARED_MATERIALS.cloud}
          material-opacity={particle.opacity}
        />
      ))}
    </group>
  );
}

// Tap Effect using upgrade-based effects
export function TapEffect() {
  const { upgrades } = useGameStore();

  // Find the selected tap effect
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

  const [tapParticles, setTapParticles] = React.useState<
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
        "#FFD700",
        "#FFA500",
        "#FF8C00",
        "#FFD700",
        "#FFA500",
        "#FF8C00",
        "#FFD700",
        "#FFA500",
        "#FF8C00",
        "#FFD700",
        "#FFA500",
        "#FF8C00",
        "#FFD700",
        "#FFA500",
        "#FF8C00",
        "#FFD700",
        "#FFA500",
        "#FF8C00",
      ],
      default: [
        "#ffffff",
        "#cccccc",
        "#999999",
        "#666666",
        "#333333",
        "#000000",
        "#ffffff",
        "#cccccc",
        "#999999",
        "#666666",
        "#333333",
        "#000000",
        "#ffffff",
        "#cccccc",
        "#999999",
        "#666666",
        "#333333",
        "#000000",
      ],
    }),
    []
  );

  // Function to create tap particles
  const createTapParticles = React.useCallback(
    (x: number, y: number, z: number, count: number = TAP_PARTICLE_COUNT) => {
      // Always create particles for any valid effect type

      let colors: string[];
      let particleType: "default" | "confetti" | "hearts" | "stars";

      if (tapEffectType === "confetti") {
        // Confetti colors
        colors = colorConfigs.confetti;
        particleType = "confetti";
      } else if (tapEffectType === "hearts") {
        // Heart colors (pink, red, magenta)
        colors = colorConfigs.hearts;
        particleType = "hearts";
      } else if (tapEffectType === "stars") {
        // Star colors (gold, yellow, orange)
        colors = colorConfigs.stars;
        particleType = "stars";
      } else {
        // Default colors (white, grey, black)
        colors = colorConfigs.default;
        particleType = "default";
      }

      setTapParticles((prev) => {
        // Remove oldest particles if we're at the limit
        const currentParticles =
          prev.length >= MAX_TAP_PARTICLES
            ? prev.slice(-(MAX_TAP_PARTICLES - count))
            : prev;

        const newParticles = Array.from({ length: count }, (_, i) => {
          // Random direction in 3D space (all directions)
          const theta = Math.random() * Math.PI * 2; // Random angle around Y axis
          const phi = Math.acos(Math.random() * 2 - 1); // Random angle from Y axis
          const speed = 0.2 + Math.random() * 0.4;
          // Ensure each particle gets a different random color
          const colorIndex = Math.floor(Math.random() * colors.length);
          const color = colors[colorIndex];

          // Calculate velocity in all directions
          const vx = Math.sin(phi) * Math.cos(theta) * speed;
          const vy = Math.cos(phi) * speed;
          const vz = Math.sin(phi) * Math.sin(theta) * speed;

          // Random rotation speeds for each axis
          const rotationSpeedX = (Math.random() - 0.5) * 10;
          const rotationSpeedY = (Math.random() - 0.5) * 10;
          const rotationSpeedZ = (Math.random() - 0.5) * 10;

          return {
            id: particleIdCounter.current++,
            position: [x, y, z] as [number, number, number],
            velocity: [vx, vy, vz] as [number, number, number],
            life: 2.0,
            maxLife: 2.0,
            color,
            rotation: [0, 0, 0] as [number, number, number],
            rotationSpeed: [rotationSpeedX, rotationSpeedY, rotationSpeedZ] as [
              number,
              number,
              number
            ],
            scale: (0.8 + Math.random() * 0.4) * 0.5, // Decreased by 0.5
            particleType,
          };
        });

        return [...currentParticles, ...newParticles];
      });
    },
    [tapEffectType, colorConfigs]
  );

  // Update particles in animation frame
  useFrame((state, delta) => {
    setTapParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          position: [
            particle.position[0] + particle.velocity[0] * delta * 60,
            particle.position[1] + particle.velocity[1] * delta * 60,
            particle.position[2] + particle.velocity[2] * delta * 60,
          ] as [number, number, number],
          rotation: [
            particle.rotation[0] + particle.rotationSpeed[0] * delta,
            particle.rotation[1] + particle.rotationSpeed[1] * delta,
            particle.rotation[2] + particle.rotationSpeed[2] * delta,
          ] as [number, number, number],
          life: particle.life - delta,
        }))
        .filter((particle) => particle.life > 0)
    );
  });

  // Expose the create function globally for other components to use
  useEffect(() => {
    (window as any).createTapParticles = createTapParticles;
    return () => {
      delete (window as any).createTapParticles;
    };
  }, [createTapParticles]);

  // Always render the effect component, but particles are created based on theme
  return (
    <group>
      {tapParticles.map((particle) => {
        const lifeRatio = Math.max(0, particle.life / particle.maxLife);
        const scale = particle.scale * (0.3 + 0.7 * lifeRatio);

        return (
          <group
            key={particle.id}
            position={particle.position}
            rotation={particle.rotation}
            scale={[scale, scale, scale]}
          >
            {particle.particleType === "confetti" ? (
              // 2D confetti piece - a simple plane
              <mesh
                geometry={SHARED_GEOMETRIES.plane}
                material={SHARED_MATERIALS.confetti}
                material-color={particle.color}
                material-opacity={lifeRatio}
              />
            ) : particle.particleType === "hearts" ? (
              // Heart shape using custom geometry
              <mesh
                geometry={SHARED_GEOMETRIES.heart}
                material={SHARED_MATERIALS.heart}
                material-color={particle.color}
                material-opacity={lifeRatio}
              />
            ) : particle.particleType === "stars" ? (
              // Star shape using custom geometry
              <mesh
                geometry={SHARED_GEOMETRIES.star}
                material={SHARED_MATERIALS.star}
                material-color={particle.color}
                material-opacity={lifeRatio}
              />
            ) : (
              // Default particles - small spheres
              <mesh
                geometry={SHARED_GEOMETRIES.sphere}
                material={SHARED_MATERIALS.sphere}
                material-color={particle.color}
                material-opacity={lifeRatio}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

// Fisheye Intensity Effect - this will be handled by the Scene component
export function FisheyeIntensityEffect() {
  const { decorations } = useGameStore();
  const fisheyeDecoration = decorations.find(
    (d) => d.id === "fisheye_intensity"
  );
  const fisheyeEnabled =
    fisheyeDecoration?.purchased && fisheyeDecoration?.enabled;

  // This effect will be handled by the Scene component's fisheye lens
  // We just return null here as the effect is applied at the camera level
  return null;
}

// Main Particle Effects Container
export function ParticleEffects() {
  return (
    <group>
      <StarEffect /> {/* Permanent background stars */}
      <RainEffect />
      <CloudEffect />
      <TapEffect />
      <FisheyeIntensityEffect />
    </group>
  );
}
