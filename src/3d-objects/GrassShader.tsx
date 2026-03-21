import React, { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useCoreStore } from "@/store";
import { match } from "ts-pattern";

const BLADE_COUNT_MIN = 2000;
const BLADE_COUNT_AVG = 6000;
const BLADE_COUNT_MAX = 10000;

const BLADE_WIDTH = 0.3;
const BLADE_HEIGHT = 1.5;
const FIELD_SIZE = 20;

const COLOR_ROOT = "#3a6121";
const WIND_STRENGTH = 0.1;

const GRASS_COLOR_BASE = "#468320";
const GRASS_COLOR_TOP = "#53a029";

const GrassInstancedMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorBase: new THREE.Color(GRASS_COLOR_BASE),
    uColorTop: new THREE.Color(GRASS_COLOR_TOP),
    uPreview: false,

    // noise controls
    uDistributionScale: 0.5,
    uHeightScale: 0.8,
    uMinHeight: 0.6,
    uMaxHeight: 1.4,
  },
  /* vertex */
  `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uDistributionScale;
  uniform float uHeightScale;
  uniform float uMinHeight;
  uniform float uMaxHeight;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vUv = uv;

    vec3 instancePos =
      (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    /* distribution noise: density / thickness */
    float distribution =
      noise(instancePos.xz * uDistributionScale);
    distribution = smoothstep(0.3, 0.7, distribution);

    /* height noise: blade length */
    float heightNoise =
      noise(instancePos.xz * uHeightScale);
    float bladeHeight =
      mix(uMinHeight, uMaxHeight, heightNoise);

    vec3 pos = position;

    /* scale height */
    pos.y *= bladeHeight;

    /* taper: denser patches look fuller */
    float taper = mix(0.6, 1.0, distribution);
    pos.x *= taper * (1.0 - uv.y);

    /* wind with noise-based phase offset */
    float windPhase =
      uTime * 1.5 +
      instancePos.x * 0.4 +
      instancePos.z * 0.4 +
      heightNoise * 6.2831853;

    float wind =
      sin(windPhase) * ${WIND_STRENGTH.toFixed(2)};

    pos.x += wind * uv.y * uv.y;

    vec4 mvPosition =
      modelViewMatrix * instanceMatrix * vec4(pos, 1.0);

    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  /* fragment */
  `
  varying vec2 vUv;

  uniform vec3 uColorBase;
  uniform vec3 uColorTop;
  uniform bool uPreview;

  void main() {
    vec3 color =
      mix(uColorBase, uColorTop, vUv.y);

    color *= (0.4 + 0.6 * vUv.y);

    gl_FragColor = vec4(color, 1.0);
  }
  `
);

extend({ GrassInstancedMaterial });

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  preview: boolean;
  densityMultiplier?: number;
}

export const GrassShader = ({
  position,
  rotation,
  scale,
  preview,
  densityMultiplier = 1,
}: Props) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const materialRef = useRef<any>(null);

  const { graphicPreferences } = useCoreStore();

  const allowedBladeCount = useMemo(
    () =>
      Math.round(
        match(graphicPreferences.qualityMode)
          .with("high", () => BLADE_COUNT_MAX)
          .with("low", () => BLADE_COUNT_MIN)
          .otherwise(() => BLADE_COUNT_AVG) * densityMultiplier,
      ),
    [densityMultiplier, graphicPreferences]
  );

  const { matrices } = useMemo(() => {
    const temp = new THREE.Object3D();
    const data = new Float32Array(allowedBladeCount * 16);

    for (let i = 0; i < allowedBladeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * (FIELD_SIZE / 2);

      temp.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      temp.rotation.y = Math.random() * Math.PI;
      temp.updateMatrix();
      temp.matrix.toArray(data, i * 16);
    }

    return { matrices: data };
  }, [allowedBladeCount]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -BLADE_HEIGHT + 0.6, 0]}
      >
        <circleGeometry args={[FIELD_SIZE / 2, 64]} />
        <meshBasicMaterial
          color={COLOR_ROOT}
          opacity={1}
        />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, allowedBladeCount]}
      >
        <instancedBufferAttribute
          attach="instanceMatrix"
          array={matrices}
          itemSize={16}
        />
        <planeGeometry args={[BLADE_WIDTH, BLADE_HEIGHT, 1, 4]} />
        {/* @ts-ignore */}
        <grassInstancedMaterial
          ref={materialRef}
          uPreview={preview}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
};
