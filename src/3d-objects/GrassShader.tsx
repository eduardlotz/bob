import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { seededRandom, useWorldQuality } from "./worlds/quality";

const GrassInstancedMaterial = shaderMaterial(
  {
    uTime: 0,
    uFieldRadius: 10,
    uColorBase: new THREE.Color("#315925"),
    uColorTop: new THREE.Color("#86b947"),
  },
  `
  uniform float uTime;
  uniform float uFieldRadius;
  varying float vHeight;
  varying float vVariation;
  varying float vLight;
  void main() {
    float h = uv.y;
    vec3 root = instanceMatrix[3].xyz;
    float seed = fract(sin(dot(root.xz, vec2(127.1,311.7))) * 43758.5453);
    vec3 p = position;
    p.y += 0.575;
    float edgeFade = 1.0 - smoothstep(uFieldRadius * 0.78, uFieldRadius, length(root.xz));
    p.y *= edgeFade;
    p.x *= 1.0 - h * 0.94;
    p.z += h * h * (0.12 + seed * 0.28);
    vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
    // Shared world-space gusts keep neighboring blades moving together.
    float gust = sin(root.x * 0.32 + root.z * 0.2 - uTime * 1.1);
    float ripple = sin(root.x * 1.5 - root.z * 0.7 + uTime * 2.7 + seed * 2.0);
    world.x += (0.12 + gust * 0.18 + ripple * 0.035) * h * h;
    world.z += sin(root.z * 0.28 + uTime * 0.85) * 0.09 * h * h;
    vHeight = h;
    vVariation = seed;
    vLight = 0.88 + 0.12 * abs(sin(seed * 6.283));
    gl_Position = projectionMatrix * viewMatrix * world;
  }`,
  `
  uniform vec3 uColorBase;
  uniform vec3 uColorTop;
  varying float vHeight;
  varying float vVariation;
  varying float vLight;
  void main() {
    vec3 color = mix(uColorBase, uColorTop, pow(vHeight, 0.8));
    color *= mix(0.84, 1.12, vVariation) * vLight;
    color *= mix(0.65, 1.0, smoothstep(0.0, 0.55, vHeight));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`,
);
extend({ GrassInstancedMaterial });

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  preview: boolean;
  densityMultiplier?: number;
  /** Preserve the football field's existing ground height. */
  rootOffset?: number;
  fieldRadius?: number;
}

function BladeBand({
  count,
  innerRadius,
  outerRadius,
  segments,
  widthScale,
  rootOffset,
  fieldRadius,
  seed,
}: {
  count: number;
  innerRadius: number;
  outerRadius: number;
  segments: number;
  widthScale: number;
  rootOffset: number;
  fieldRadius: number;
  seed: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial & { uTime: number }>(null);
  const matrices = useMemo(() => {
    const random = seededRandom(seed);
    const dummy = new THREE.Object3D();
    const data = new Float32Array(count * 16);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(
        innerRadius ** 2 + random() * (outerRadius ** 2 - innerRadius ** 2),
      );
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const patch = 0.5 + 0.5 * Math.sin(x * 0.8) * Math.cos(z * 0.65);
      dummy.position.set(x, rootOffset, z);
      dummy.rotation.y = random() * Math.PI * 2;
      dummy.scale.set(
        (0.65 + random() * 0.7) * widthScale,
        0.42 + random() * 0.55 + patch * 0.3,
        1,
      );
      dummy.updateMatrix();
      dummy.matrix.toArray(data, i * 16);
    }
    return data;
  }, [count, innerRadius, outerRadius, widthScale, rootOffset, seed]);
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceMatrix.array.set(matrices);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0.5, 0),
      outerRadius + 2,
    );
  }, [matrices, outerRadius]);
  useFrame((state) => {
    if (materialRef.current)
      materialRef.current.uTime = state.clock.elapsedTime;
  });
  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[undefined, undefined, count]}
      name={`grass-${segments}-segments`}
    >
      <planeGeometry args={[0.16, 1.15, 1, segments]} />
      {/* @ts-expect-error custom shader material */}
      <grassInstancedMaterial
        ref={materialRef}
        uFieldRadius={fieldRadius}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export const GrassShader = ({
  position,
  rotation,
  scale,
  densityMultiplier = 1,
  rootOffset = -0.9,
  fieldRadius = 10,
}: Props) => {
  const quality = useWorldQuality();
  const count = Math.round(
    { low: 1800, medium: 4800, high: 7200 }[quality] * densityMultiplier,
  );
  const extended = fieldRadius > 12;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, rootOffset - 0.01, 0]}
      >
        <circleGeometry args={[fieldRadius + (extended ? 3 : 0), 64]} />
        <meshBasicMaterial color="#3a6121" />
      </mesh>
      <BladeBand
        count={Math.round(count * (extended ? 0.72 : 1))}
        innerRadius={0}
        outerRadius={extended ? 12 : fieldRadius}
        segments={4}
        widthScale={1}
        rootOffset={rootOffset}
        fieldRadius={fieldRadius}
        seed={128}
      />
      {extended && (
        <>
          <BladeBand
            count={Math.round(count * 0.5)}
            innerRadius={10}
            outerRadius={30}
            segments={2}
            widthScale={2.2}
            rootOffset={rootOffset}
            fieldRadius={fieldRadius}
            seed={129}
          />
          <BladeBand
            count={Math.round(count * 0.7)}
            innerRadius={26}
            outerRadius={fieldRadius}
            segments={1}
            widthScale={4}
            rootOffset={rootOffset}
            fieldRadius={fieldRadius}
            seed={130}
          />
        </>
      )}
    </group>
  );
};
