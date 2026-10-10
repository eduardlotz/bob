import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function NebulaCloud({
  position,
  color,
  phase,
  intensity,
}: {
  position: [number, number, number];
  color: string;
  phase: number;
  intensity: number;
}) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: phase },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    }),
    [color, phase, intensity],
  );
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.uniforms.uTime.value = clock.elapsedTime * 0.025 + phase;
  });
  return (
    <mesh position={position} scale={[36, 24, 1]}>
      <planeGeometry />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            vec2 p = (vUv - 0.5) * 2.0;
            float edge = 1.0 - smoothstep(0.1, 1.0, length(p));
            float folds = sin(p.x * 5.0 + uTime + sin(p.y * 4.0 - uTime));
            float wisps = 0.55 + 0.2 * folds + 0.15 * sin(p.y * 9.0 + folds);
            gl_FragColor = vec4(uColor, edge * edge * wisps * 0.18 * uIntensity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

export function Nebula({ intensity = 1 }: { intensity?: number }) {
  return (
    <group>
      <NebulaCloud
        position={[-24, 12, -58]}
        color="#7d5cff"
        phase={0}
        intensity={intensity}
      />
      <NebulaCloud
        position={[18, 8, -64]}
        color="#62d6ff"
        phase={2}
        intensity={intensity}
      />
    </group>
  );
}
