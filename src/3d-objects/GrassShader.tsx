import React, { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useCoreStore } from "@/store";
import { match } from "ts-pattern";

const BLADE_COUNT_MIN = 2000;
const BLADE_COUNT_AVG = 5000;
const BLADE_COUNT_MAX = 10000;
const BLADE_WIDTH = 0.2;
const BLADE_HEIGHT = 1.25;
const FIELD_SIZE = 20;
const COLOR_ROOT = "#2e4420";
const WIND_STRENGTH = 0.1;
const GRASS_COLOR_BASE = "#486536";
const GRASS_COLOR_TOP = "#5d8c5f";

const GrassInstancedMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorBase: new THREE.Color(GRASS_COLOR_BASE),
    uColorTop: new THREE.Color(GRASS_COLOR_TOP),
    uPreview: false,
  },
  `
  varying vec2 vUv;
  uniform float uTime;
  
  void main() {
    vUv = uv;
    
    // get instance position from the instanceMatrix
    vec3 basePosition = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    
    // make the top (uv.y == 1) narrower than the bottom
    float taper = 1.0 - (uv.y * 0.8); 
    vec3 pos = position;
    pos.x *= taper; 

    // wind effect: move the top more than the base
    float wind = sin(uTime * 1.5 + basePosition.x * 0.5 + basePosition.z * 0.5) * ${WIND_STRENGTH.toFixed(
      2
    )};
    pos.x += wind * uv.y * uv.y; // Exponential sway
    
    // instance transformation
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  `
  varying vec2 vUv;
  uniform vec3 uColorBase;
  uniform vec3 uColorTop;
  uniform bool uPreview;

  void main() {
    // Vertical gradient from base to top
    vec3 color = mix(uColorBase, uColorTop, vUv.y);
    
    // darker at the bottom
    color *= (0.4 + 0.6 * vUv.y);

    float alpha = uPreview ? 0.4 : 1.0;
    gl_FragColor = vec4(color, alpha);
  }
  `
);

extend({ GrassInstancedMaterial });

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  preview: boolean;
}

export const GrassShader = ({ position, rotation, scale, preview }: Props) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const materialRef = useRef<any>();

  const { graphicPreferences } = useCoreStore();

  const allowedBladeCount = useMemo(
    () =>
      match(graphicPreferences.qualityMode)
        .with("high", () => BLADE_COUNT_MAX)
        .with("low", () => BLADE_COUNT_MIN)
        .otherwise(() => BLADE_COUNT_AVG),
    [graphicPreferences]
  );

  // Initialize random positions for the blades
  const { matrices } = useMemo(() => {
    const tempObject = new THREE.Object3D();
    const matrices = new Float32Array(allowedBladeCount * 16);

    for (let i = 0; i < allowedBladeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * (FIELD_SIZE / 2);

      tempObject.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      tempObject.rotation.y = Math.random() * Math.PI;
      tempObject.updateMatrix();
      tempObject.matrix.toArray(matrices, i * 16);
    }
    return { matrices };
  }, []);

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
        <meshBasicMaterial color={COLOR_ROOT} opacity={preview ? 0.2 : 1} />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, allowedBladeCount]}
      >
        <instancedBufferAttribute
          attach="instanceMatrix"
          count={allowedBladeCount}
          array={matrices}
          itemSize={16}
        />
        <planeGeometry args={[BLADE_WIDTH, BLADE_HEIGHT, 1, 4]} />
        <grassInstancedMaterial
          ref={materialRef}
          uPreview={preview}
          transparent={preview}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
};
