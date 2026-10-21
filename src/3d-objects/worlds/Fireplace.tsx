import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { ObjectAudio } from "./ObjectAudio";
import { CAMPFIRE_AUDIO } from "@/utils/sound/objectSounds";
import { useWorldEnvironment } from "./WorldEnvironment";

/** Faceted stones and bark, with separate inset cut ends; all baked into one mesh. */
function firepitGeometry() {
  const random = seededRandom(733);
  const parts: Part[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI * 2 / 10;
    parts.push([new T.DodecahedronGeometry(.2), ["#77746c", "#92897b", "#817c72"][i % 3],
      [Math.cos(angle) * .58, .14, Math.sin(angle) * .58],
      [1.15, .78 + random() * .16, .95], [random() * .4, angle, random() * .3]]);
  }
  // Rotate the complete crossed stack 45 degrees, including its cut ends and bark ribs.
  const log = (center: T.Vector3, yaw: number, length: number, radius: number) => {
    const rotation = new T.Euler(Math.PI / 2, yaw, 0, "YXZ");
    const quaternion = new T.Quaternion().setFromEuler(rotation);
    const transform = (p: T.Vector3) => p.applyQuaternion(quaternion).add(center).toArray() as [number, number, number];
    const bark = new T.CylinderGeometry(radius * .87, radius, length, 7, 3);
    const pos = bark.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setX(i, pos.getX(i) + Math.sin(y * 6) * .018);
      pos.setZ(i, pos.getZ(i) + Math.sin(y * 9 + 1) * .012);
    }
    bark.computeVertexNormals();
    parts.push([bark, "#654431", center.toArray() as [number, number, number], [1, 1, 1], [rotation.x, rotation.y, rotation.z]]);
    for (const end of [-1, 1]) {
      parts.push([new T.CylinderGeometry(radius * .79, radius * .79, .012, 7), "#b88a56",
        transform(new T.Vector3(0, end * (length / 2 + .009), 0)), [1, 1, 1], [rotation.x, rotation.y, rotation.z]]);
      parts.push([new T.CylinderGeometry(radius * .45, radius * .45, .014, 7), "#9d7047",
        transform(new T.Vector3(0, end * (length / 2 + .018), 0)), [1, 1, 1], [rotation.x, rotation.y, rotation.z]]);
    }
  };
  log(new T.Vector3(-.08, .17, 0), Math.PI / 4, .93, .14);
  log(new T.Vector3(.06, .3, 0), -Math.PI / 4, .87, .13);
  log(new T.Vector3(.16, .14, -.12), Math.PI / 4 + .25, .69, .075);
  return assemble(parts);
}

const flameVertex = `
  uniform float uTime;
  attribute vec4 aFlame;
  varying float vHeight;
  varying float vSide;
  void main() {
    vec3 p = position;
    float h = clamp(p.y + .5, 0.0, 1.0);
    vHeight = h;
    vSide = position.x;
    p.xz *= aFlame.z;
    p.y = h * aFlame.w + .24;
    p.x += aFlame.x + sin(uTime * 5.2 + h * 7.0 + aFlame.x * 13.0) * h * h * .12;
    p.z += aFlame.y + cos(uTime * 4.1 + h * 6.0) * h * h * .065;
    p.y *= .94 + sin(uTime * 6.0 + aFlame.x * 17.0) * .065;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const flameFragment = `
  uniform float uTime;
  uniform float uNight;
  varying float vHeight;
  varying float vSide;
  void main() {
    float band = vHeight + sin(vHeight * 17.0 - uTime * 7.0 + vSide * 12.0) * .06;
    vec3 color = mix(vec3(1.0, .48, .035), vec3(1.0, .16, .008), step(.4, band));
    color = mix(color, vec3(.86, .065, .003), step(.78, band));
    gl_FragColor = vec4(color, uNight);
    #include <colorspace_fragment>
  }
`;
const emberVertex = `
  uniform float uTime;
  attribute vec4 aSeed;
  varying vec2 vUv;
  varying float vLife;
  void main() {
    vUv = uv;
    float life = fract(uTime * (.22 + aSeed.w * .16) + aSeed.x);
    vLife = life;
    float angle = aSeed.y * 6.28318 + life * (1.5 + aSeed.z * 3.0);
    float radius = .12 + life * (.3 + aSeed.z * .45);
    vec3 center = vec3(cos(angle) * radius, .3 + life * (1.0 + aSeed.z * 1.1), sin(angle) * radius);
    vec4 world = modelMatrix * vec4(center, 1.0);
    vec3 toEye = normalize(cameraPosition - world.xyz);
    vec3 right = normalize(cross(vec3(0.0, 1.0, .0001), toEye));
    vec3 up = cross(toEye, right);
    float size = (.018 + aSeed.w * .025) * (1.0 - life * .65);
    world.xyz += (right * position.x + up * position.y) * size;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const emberFragment = `
  uniform float uNight;
  varying vec2 vUv;
  varying float vLife;
  void main() {
    vec2 p = abs(vUv - .5);
    if (p.x + p.y > .48) discard;
    float alpha = smoothstep(0.0, .12, vLife) * (1.0 - smoothstep(.65, 1.0, vLife));
    gl_FragColor = vec4(mix(vec3(1.0, .4, .015), vec3(.7, .075, .002), vLife), alpha * uNight);
    #include <colorspace_fragment>
  }
`;

function instancedGeometry(source: T.BufferGeometry, attribute: string, values: Float32Array) {
  const geometry = new T.InstancedBufferGeometry();
  geometry.index = source.index;
  for (const name of Object.keys(source.attributes)) geometry.setAttribute(name, source.getAttribute(name));
  geometry.setAttribute(attribute, new T.InstancedBufferAttribute(values, 4));
  geometry.instanceCount = values.length / 4;
  source.dispose();
  return geometry;
}

/** Shared flame and ember renderer for campfires and wall torches. */
export function FireFlames() {
  const environment = useWorldEnvironment();
  const quality = useWorldQuality();
  const effects = useRef<T.Group>(null);
  const flameMaterial = useRef<T.ShaderMaterial>(null);
  const emberMaterial = useRef<T.ShaderMaterial>(null);
  const flames = useMemo(() => instancedGeometry(new T.ConeGeometry(.5, 1, 7, 7), "aFlame",
    new Float32Array([-.13, -.02, .58, .75, .12, -.05, .46, .59, .01, .12, .4, .9])), []);
  const embers = useMemo(() => {
    const random = seededRandom(732);
    return instancedGeometry(new T.PlaneGeometry(1, 1), "aSeed", Float32Array.from({ length: (quality === "low" ? 18 : 36) * 4 }, random));
  }, [quality]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uNight: { value: 0 } }), []);
  useEffect(() => () => flames.dispose(), [flames]);
  useEffect(() => () => embers.dispose(), [embers]);
  useFrame(() => {
    const { elapsed, daylight } = environment.current;
    // R3F copies supplied uniform maps, so update the live materials.
    for (const material of [flameMaterial.current, emberMaterial.current]) {
      if (!material) continue;
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uNight.value = 1 - daylight;
    }
    if (effects.current) effects.current.visible = daylight < .999;
  });
  return <group ref={effects} visible={false}>
    <mesh geometry={flames} frustumCulled={false} name="fire-tongues">
      <shaderMaterial ref={flameMaterial} uniforms={uniforms} vertexShader={flameVertex} fragmentShader={flameFragment} transparent depthWrite={false} toneMapped={false} />
    </mesh>
    <mesh geometry={embers} frustumCulled={false} name="fire-embers">
      <shaderMaterial ref={emberMaterial} uniforms={uniforms} vertexShader={emberVertex} fragmentShader={emberFragment} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
}

export function Fireplace() {
  const environment = useWorldEnvironment();
  const pitMaterial = useRef<T.MeshToonMaterial | null>(null);
  const pit = useMemo(firepitGeometry, []);
  useEffect(() => () => pit.dispose(), [pit]);
  useFrame(() => {
    const { elapsed, daylight } = environment.current;
    if (pitMaterial.current) pitMaterial.current.emissiveIntensity = (1 - daylight) * (.16 + Math.sin(elapsed * 6) * .015);
  });
  return <group position={[0, -1.28, 2]} name="night-fireplace">
    <ObjectAudio config={CAMPFIRE_AUDIO} />
    <mesh geometry={pit} name="firepit-stones-and-crossed-logs"><WorldToonMaterial onUpdate={material => { pitMaterial.current = material; }} vertexColors emissive="#aa582c" emissiveIntensity={0} /></mesh>
    <FireFlames />
  </group>;
}
