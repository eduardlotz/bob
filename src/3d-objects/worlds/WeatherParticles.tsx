import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom, useWorldQuality } from "./quality";

type Kind = "rain" | "snow" | "sand";
const vertexShader = `
  uniform float uTime;
  uniform float uKind;
  attribute vec4 aSeed;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    vUv = uv;
    float snow = step(0.5, uKind) * (1.0 - step(1.5, uKind));
    float sand = step(1.5, uKind);
    float speed = mix(8.0 + aSeed.w * 5.0, 0.65 + aSeed.w * 0.7, snow);
    float height = 18.0;
    float y = mod(aSeed.y * height - uTime * speed, height);
    vec3 center = vec3((aSeed.x - 0.5) * 30.0, y - 1.36, (aSeed.z - 0.5) * 30.0 - 4.0);
    float wind = sin(uTime * 0.6 + center.z * 0.16);
    center.x += (18.0 - y) * 0.12 + wind * 0.35;
    center.x += snow * sin(uTime * 1.2 + aSeed.x * 30.0) * 0.7;
    center.z += snow * cos(uTime * 0.8 + aSeed.z * 30.0) * 0.5;
    if (sand > 0.5) {
      center.x = mod(aSeed.x * 42.0 + uTime * (0.7 + aSeed.w), 42.0) - 21.0;
      center.y = -1.05 + aSeed.y * 2.0 + sin(uTime + aSeed.z * 20.0) * 0.14;
    }
    vec4 mv = modelViewMatrix * vec4(center, 1.0);
    float size = mix(0.024, 0.07 + aSeed.w * 0.055, snow);
    size = mix(size, 0.06 + aSeed.w * 0.06, sand);
    vec2 p = position.xy * size;
    if (uKind < 0.5) {
      p.y *= 14.0 + aSeed.w * 8.0;
      p.x -= p.y * 0.15;
    }
    mv.xy += p;
    vFade = smoothstep(0.0, 1.0, y) * (1.0 - smoothstep(16.0, 18.0, y));
    if (sand > 0.5) vFade = 1.0 - smoothstep(15.0, 21.0, abs(center.x));
    gl_Position = projectionMatrix * mv;
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uKind;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    float edge = 1.0 - smoothstep(0.18, 0.5, length(vUv - 0.5));
    if (uKind < 0.5) edge = (1.0 - abs(vUv.x - 0.5) * 2.0) * sin(vUv.y * 3.14159);
    float alpha = edge * uOpacity * vFade;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** One draw call; only time and fade uniforms change each frame. */
export function WeatherParticles({
  kind,
  enabled = true,
}: {
  kind: Kind;
  enabled?: boolean;
}) {
  const quality = useWorldQuality();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const count = {
    rain: [160, 420, 680],
    snow: [180, 440, 720],
    sand: [50, 110, 180],
  }[kind][{ low: 0, medium: 1, high: 2 }[quality]];
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = plane.index;
    geometry.setAttribute("position", plane.getAttribute("position"));
    geometry.setAttribute("uv", plane.getAttribute("uv"));
    const random = seededRandom(67);
    const seeds = Float32Array.from({ length: count * 4 }, random);
    geometry.setAttribute(
      "aSeed",
      new THREE.InstancedBufferAttribute(seeds, 4),
    );
    geometry.instanceCount = count;
    plane.dispose();
    return geometry;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uKind: { value: { rain: 0, snow: 1, sand: 2 }[kind] },
      uColor: {
        value: new THREE.Color(
          { rain: "#c4e7f5", snow: "#f6fbff", sand: "#efd4a1" }[kind],
        ),
      },
      uOpacity: { value: 0 },
    }),
    [kind],
  );
  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    time.current += Math.min(delta, 0.05);
    material.uniforms.uTime.value = time.current;
    const target = enabled ? (kind === "sand" ? 0.24 : 0.8) : 0;
    material.uniforms.uOpacity.value = THREE.MathUtils.damp(
      material.uniforms.uOpacity.value,
      target,
      2,
      delta,
    );
  });
  return (
    <mesh geometry={geometry} frustumCulled={false} name={`weather-${kind}`}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
