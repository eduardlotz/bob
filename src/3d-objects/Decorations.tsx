import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GradientTexture, Grid, Sparkles } from "@react-three/drei";
import { BackSide } from "three";
import * as THREE from "three";
import {
  useCoreStore,
  WorldEffectId,
  WorldModelId,
  WorldSceneConfig,
} from "@/store";
import {
  ForestModels,
  WinterModels,
  DesertCacti,
  MoonRocks,
  Dune,
  SnowmanDetails,
  RingedPlanet,
  MoonTerrain,
} from "./worlds/WorldModels";
import { CloudSky, type CloudClimate } from "./worlds/CloudSky";
import { CityWorld } from "./worlds/CityWorld";
import { FlyingUfos } from "./worlds/FlyingUfos";
import { DesertDetails } from "./worlds/DesertDetails";
import { Nebula } from "./worlds/Nebula";
import { WeatherParticles } from "./worlds/WeatherParticles";
import { seededRandom, useWorldQuality } from "./worlds/quality";
import { GrassShader } from "./GrassShader";
import { CloudEffect, ForestRainEffect, SnowEffect } from "./ParticleEffects";

const LARGE_FLOOR_SIZE = 80;
const FLOOR_Y = -1.36;
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

const isSpaceWorldScene = (scene: WorldSceneConfig) =>
  scene.effects.some((effectId) => SPACE_WORLD_EFFECT_IDS.has(effectId)) ||
  scene.models.some((modelId) => SPACE_WORLD_MODEL_IDS.has(modelId));

function WorldDome({
  scene,
  lowDetail,
}: {
  scene: WorldSceneConfig;
  lowDetail: boolean;
}) {
  const isMoonWorld = scene.effects.includes("moon_glow");
  const climate: CloudClimate | null = scene.models.includes("forest_meadow")
    ? "forest"
    : scene.models.includes("city_blocks")
      ? "city"
      : scene.effects.includes("desert_sand")
        ? "desert"
        : scene.models.includes("winter_pines")
          ? "winter"
          : null;
  return (
    <>
      {climate ? (
        <CloudSky
          climate={climate}
          colors={scene.gradientColors}
          stops={scene.gradientStops}
        />
      ) : (
        <mesh renderOrder={-10} frustumCulled={false}>
          <sphereGeometry args={[100, 24, 22]} />
          <meshBasicMaterial
            side={BackSide}
            depthTest={false}
            depthWrite={false}
          >
            <GradientTexture
              stops={scene.gradientStops}
              colors={scene.gradientColors}
              size={1024}
            />
          </meshBasicMaterial>
        </mesh>
      )}

      {scene.starfield && !isSpaceWorldScene(scene) && (
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

      {(isMoonWorld || isSpaceWorldScene(scene)) && <FlyingUfos />}
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

  if (scene.models.includes("city_blocks")) {
    return (
      <mesh position={[0, FLOOR_Y - 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[96, 64]} />
        <meshStandardMaterial color={scene.groundColor} />
      </mesh>
    );
  }

  if (scene.models.includes("forest_meadow")) {
    return (
      <mesh position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[98, 64]} />
        <meshBasicMaterial color="#3a6121" />
      </mesh>
    );
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

function MoonMeteors() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const quality = useWorldQuality();
  const meteorData = useMemo(() => {
    const random = seededRandom(83);
    return Array.from({ length: quality === "low" ? 4 : 8 }, (_, index) => ({
      offset: index * 0.8,
      speed: 1.8 + random() * 0.9,
      y: 4 + random() * 4,
      z: -12 - random() * 10,
      scale: 0.08 + random() * 0.08,
    }));
  }, [quality]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    meteorData.forEach((meteor, index) => {
      const travel =
        ((clock.elapsedTime * meteor.speed + meteor.offset) % 12) - 6;
      dummy.position.set(
        7 - travel * 2.4,
        meteor.y - travel * 0.7,
        meteor.z + travel * 2.1,
      );
      dummy.rotation.set(0.4, -0.6, 0.8);
      dummy.scale.setScalar(meteor.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={meteorData.length}
      ref={meshRef}
      args={[undefined, undefined, meteorData.length]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#d9e1f2"
        emissive="#ffffff"
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}

function WorldModel({
  modelId,
  scene,
  preview,
}: {
  modelId: WorldModelId;
  scene: WorldSceneConfig;
  preview: boolean;
}) {
  switch (modelId) {
    case "default_home":
      return null;

    case "city_blocks":
      return <CityWorld />;

    case "forest_grove":
      return <ForestModels />;

    case "forest_meadow":
      return (
        <GrassShader
          position={[0, -1.32, 0]}
          scale={[1.28, 0.48, 1.28]}
          preview={preview}
          densityMultiplier={1.45}
          rootOffset={0}
          fieldRadius={72}
        />
      );

    case "desert_dunes":
      return (
        <group>
          <Dune
            position={[-8.5, FLOOR_Y, -9]}
            scale={[4.2, 1.05, 2.8]}
            color={scene.accentColor}
          />
          <Dune
            position={[9.5, FLOOR_Y, -11]}
            scale={[5.2, 1.3, 3.1]}
            color="#e1b164"
          />
          <Dune
            position={[-2, FLOOR_Y, -22]}
            scale={[7, 1.5, 3.2]}
            color="#dba75f"
          />
          <DesertCacti />
          <DesertDetails />
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
      return <WinterModels />;

    case "winter_snowman":
      return (
        <group position={[7.2, -0.82, -6.8]}>
          <SnowmanDetails />
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
        <>
          <MoonTerrain
            groundColor={scene.groundColor}
            accentColor={scene.accentColor}
            glowIntensity={
              (scene as WorldSceneConfigEx).lighting?.moonGlowIntensity ?? 1
            }
          />
          <MoonRocks />
        </>
      );
    case "space_planet":
      return <RingedPlanet />;
    case "space_rings":
      return <RingedPlanet small />;
  }
}

function WorldEffect({
  effectId,
  glowIntensity = 1,
}: {
  effectId: WorldEffectId;
  glowIntensity?: number;
}) {
  const quality = useWorldQuality();
  const low = quality === "low";
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
      return <WeatherParticles kind="sand" />;

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
          count={low ? 280 : 680}
          color="#f8fbff"
          size={1.2}
          speed={0.04}
          opacity={0.72 * glowIntensity}
          scale={[118, 72, 118]}
          position={[0, 8, 0]}
        />
      );

    case "space_nebula":
      return <Nebula intensity={glowIntensity} />;

    case "space_dust":
      return (
        <Sparkles
          count={low ? 50 : 120}
          color="#b5d2ff"
          size={1.8}
          speed={0.02}
          opacity={0.32 * glowIntensity}
          scale={[92, 44, 92]}
          position={[0, 4, 0]}
        />
      );
  }
}

export function SceneDecorations() {
  const worlds = useCoreStore((state) => state.worlds);
  const previewMode = useCoreStore((state) => state.previewMode);
  const quality = useWorldQuality();
  const preview =
    previewMode === "world" && !!worlds.find((world) => world.preview);
  const activeWorld =
    previewMode === "world"
      ? (worlds.find((world) => world.preview) ??
        worlds.find((world) => world.enabled))
      : worlds.find((world) => world.enabled);

  if (!activeWorld) return null;

  const scene = normalizeWorldScene(activeWorld.scene);

  return (
    <group>
      <WorldDome scene={scene} lowDetail={quality === "low"} />
      <WorldFloor scene={scene} />

      {scene.models.map((modelId) => (
        <WorldModel
          key={modelId}
          modelId={modelId}
          scene={scene}
          preview={preview}
        />
      ))}

      {scene.effects.map((effectId) => (
        <WorldEffect
          key={effectId}
          effectId={effectId}
          glowIntensity={scene.lighting?.spaceGlowIntensity ?? 1}
        />
      ))}
    </group>
  );
}
