import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { treeGeometry } from "./worlds/WorldModels";
import { seededRandom, useWorldQuality } from "./worlds/quality";
import { FlappyClouds } from "./FlappyClouds";
import { setSoundMix } from "@/utils/soundSystem";
import { DEFAULT_WORLD_MUSIC, DEFAULT_PINK_NOISE } from "@/utils/sound/defaults";

const SKY_VERTEX = `varying vec3 direction; void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAGMENT = `varying vec3 direction; uniform float altitude;
uniform vec3 dayTop; uniform vec3 dayHorizon; uniform vec3 dayGround;
uniform vec3 spaceTop; uniform vec3 spaceHorizon;
void main() {
  float height = clamp(normalize(direction).y * 0.5 + 0.5, 0.0, 1.0);
  vec3 day = mix(dayGround, dayTop, smoothstep(0.0, 0.5, height));
  day = mix(day, dayHorizon, exp(-pow((height - 0.47) * 10.0, 2.0)) * 0.65);
  vec3 space = mix(spaceHorizon, spaceTop, smoothstep(0.0, 0.65, height));
  gl_FragColor = vec4(mix(day, space, altitude), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** The forest stays far below Bob, then recedes as the sky opens into space. */
export function FlappyAtmosphere({ score, active }: { score: number; active: React.MutableRefObject<boolean> }) {
  const quality = useWorldQuality();
  const forest = useRef<THREE.InstancedMesh>(null);
  const sky = useRef<THREE.ShaderMaterial>(null);
  const ground = useRef<THREE.Mesh>(null);
  const sun = useRef<THREE.Mesh>(null);
  const stars = useRef<THREE.Points>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const altitude = useRef(0);
  const scroll = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(treeGeometry, []);
  const uniforms = useMemo(() => ({
    altitude: { value: 0 },
    dayTop: { value: new THREE.Color("#8fd4ff") },
    dayHorizon: { value: new THREE.Color("#dff7ff") },
    dayGround: { value: new THREE.Color("#7abf7f") },
    spaceTop: { value: new THREE.Color("#010208") },
    spaceHorizon: { value: new THREE.Color("#4d5f87") },
  }), []);
  const colors = useMemo(() => ({
    ground: new THREE.Color("#345d36"), space: new THREE.Color("#07111e"),
    sunlight: new THREE.Color("#ffeac1"), starlight: new THREE.Color("#b7c9ff"),
  }), []);
  const trees = useMemo(() => {
    const random = seededRandom(482);
    const count = quality === "low" ? 10 : 20;
    return Array.from({ length: count }, (_, i) => ({
      x: i * 100 / count - 50, z: -50 - (i % 4) * 10,
      scale: 0.75 + random() * 0.6, rotation: random() * Math.PI * 2,
    }));
  }, [quality]);
  const starGeometry = useMemo(() => {
    const random = seededRandom(852);
    const positions = new Float32Array((quality === "low" ? 140 : 320) * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (random() - 0.5) * 140;
      positions[i + 1] = random() * 75 - 15;
      positions[i + 2] = -25 - random() * 45;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => starGeometry.dispose(), [starGeometry]);
  useEffect(() => () => {
    setSoundMix(DEFAULT_WORLD_MUSIC.id);
    setSoundMix(DEFAULT_PINK_NOISE.id);
  }, []);
  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const target = THREE.MathUtils.smoothstep(score, 0, 50);
    altitude.current = THREE.MathUtils.damp(altitude.current, target, 1.8, delta);
    if (Math.abs(altitude.current - target) < 0.001) altitude.current = target;
    const height = altitude.current;
    // Follow the same ascent as the sky; the overlap spans scores 25–50.
    const crossfade = THREE.MathUtils.smoothstep(height, 0.5, 1);
    setSoundMix(DEFAULT_WORLD_MUSIC.id, {
      gain: crossfade === 1 ? 0 : Math.cos(crossfade * Math.PI / 2),
      lowpassHz: 20000 * (280 / 20000) ** height,
    });
    setSoundMix(DEFAULT_PINK_NOISE.id, { gain: Math.sin(crossfade * Math.PI / 2) });
    if (sky.current) sky.current.uniforms.altitude.value = height;
    if (active.current) scroll.current = (scroll.current + delta * 0.45) % 100;
    if (forest.current) {
      trees.forEach((tree, i) => {
        const x = ((tree.x - scroll.current + 150) % 100) - 50;
        // Root the forest on the curved Earth horizon instead of a flat island.
        const cap = Math.sqrt(Math.max(0, 1 - (x / 85) ** 2 - ((tree.z + 70) / 70) ** 2));
        const surfaceY = -87 + cap * 60;
        dummy.position.set(x, surfaceY - height * 38, tree.z - height * 22);
        dummy.scale.setScalar(tree.scale * (1 - height * 0.35));
        dummy.rotation.set(Math.atan2((tree.z + 70) / (70 * 70), cap / 60), tree.rotation, -Math.atan2(x / (85 * 85), cap / 60));
        dummy.updateMatrix();
        forest.current!.setMatrixAt(i, dummy.matrix);
      });
      forest.current.instanceMatrix.needsUpdate = true;
      forest.current.visible = height < 0.98;
      (forest.current.material as THREE.MeshToonMaterial).color.setRGB(1 - height * 0.65, 1 - height * 0.5, 1);
    }
    if (ground.current) {
      ground.current.position.y = -87 - height * 38;
      ground.current.position.z = -70 - height * 22;
      (ground.current.material as THREE.MeshToonMaterial).color.lerpColors(colors.ground, colors.space, height);
    }
    if (stars.current) {
      const material = stars.current.material as THREE.PointsMaterial;
      material.opacity = THREE.MathUtils.smoothstep(height, 0.18, 0.65) * (0.82 + Math.sin(clock.elapsedTime * 0.6) * 0.08);
      stars.current.rotation.z = Math.sin(clock.elapsedTime * 0.02) * 0.03;
    }
    if (sun.current) sun.current.scale.setScalar(1 - height * 0.3);
    if (light.current) { light.current.intensity = 1.5 - height * 0.9; light.current.color.lerpColors(colors.sunlight, colors.starlight, height); }
  });
  return <group name="flappy-atmosphere">
    <mesh>
      <sphereGeometry args={[95, 20, 16]} />
      <shaderMaterial ref={sky} side={THREE.BackSide} uniforms={uniforms} vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} depthWrite={false} />
    </mesh>
    <mesh ref={ground} position={[0, -87, -70]} scale={[85, 60, 70]}>
      <sphereGeometry args={[1, 32, 12]} /><meshToonMaterial color="#345d36" />
    </mesh>
    <instancedMesh ref={forest} args={[geometry, undefined, trees.length]} frustumCulled={false} name="flappy-distant-forest">
      <meshToonMaterial vertexColors />
    </instancedMesh>
    <mesh ref={sun} position={[-22, 20, -65]}>
      <sphereGeometry args={[5, 20, 12]} /><meshBasicMaterial color="#ffe8b9" />
    </mesh>
    <points ref={stars} geometry={starGeometry} frustumCulled={false}>
      <pointsMaterial color="#eaf2ff" size={0.15} transparent opacity={0} depthWrite={false} />
    </points>
    <directionalLight ref={light} position={[-12, 18, 8]} color="#ffeac1" intensity={1.5} />
    <FlappyClouds score={score} altitude={altitude} active={active} />
  </group>;
}
