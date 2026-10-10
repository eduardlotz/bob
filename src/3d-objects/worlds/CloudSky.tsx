import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";

export type CloudClimate = "forest" | "city" | "desert" | "winter";
const climates = {
  forest: { color: "#f2f7ee", shade: "#b4ced0", coverage: 0.2, count: 14 },
  city: { color: "#f4f3eb", shade: "#b8cad5", coverage: 0.25, count: 12 },
  desert: { color: "#ffe9c9", shade: "#dbbca0", coverage: 0.4, count: 6 },
  winter: { color: "#f4f9ff", shade: "#bbcce0", coverage: 0.13, count: 16 },
};

/** Tileable Voronoi cloud mask: nine nearby cells, evaluated only at creation. */
function cloudMask() {
  const size = 256,
    cells = 6;
  const random = seededRandom(604);
  const points = Array.from({ length: cells * cells }, () => [
    random(),
    random(),
    random(),
  ]);
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x / size) * cells,
        py = (y / size) * cells;
      const ix = Math.floor(px),
        iy = Math.floor(py);
      let distance = 2;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const [jx, jy, active] =
            points[
              ((iy + dy + cells) % cells) * cells + ((ix + dx + cells) % cells)
            ];
          if (active < 0.58) continue;
          distance = Math.min(
            distance,
            Math.hypot(ix + dx + jx - px, (iy + dy + jy - py) * 1.35) /
              (0.7 + active * 0.6),
          );
        }
      }
      data[y * size + x] = Math.round(
        255 * (1 - T.MathUtils.smoothstep(distance, 0.08, 1.15)),
      );
    }
  }
  const texture = new T.DataTexture(data, size, size, T.RedFormat);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function cloudGeometry(low: boolean) {
  const parts: Part[] = [];
  // A reusable five-lobe silhouette, with a flatter base and taller middle.
  for (const [x, y, z, sx, sy, sz] of [
    [-2, 0, 0, 1.7, 0.8, 1.2],
    [0, 0.3, 0, 2.1, 1.15, 1.45],
    [1.8, 0, 0.1, 1.55, 0.8, 1.15],
    [-0.6, 1, 0, 1.35, 1.15, 1.2],
    [0.8, 0.55, 0.2, 1.5, 1, 1.25],
  ])
    parts.push([
      new T.SphereGeometry(1, low ? 7 : 10, low ? 5 : 7),
      "#ffffff",
      [x, y, z],
      [sx, sy, sz],
    ]);
  const geometry = assemble(parts);
  const normals = geometry.getAttribute("normal");
  const colors = geometry.getAttribute("color");
  for (let i = 0; i < normals.count; i++) {
    const light =
      0.83 + T.MathUtils.smoothstep(normals.getY(i), -0.6, 0.7) * 0.17;
    colors.setXYZ(i, light, light, light);
  }
  return geometry;
}

/** One opaque sky draw and one opaque instanced cloud draw in every climate. */
export function CloudSky({
  climate,
  colors,
  stops,
}: {
  climate: CloudClimate;
  colors: [string, string, string];
  stops: [number, number, number];
}) {
  const quality = useWorldQuality();
  const low = quality === "low";
  const config = climates[climate];
  const mask = useMemo(cloudMask, []);
  const geometry = useMemo(() => cloudGeometry(low), [low]);
  const clouds = useRef<T.InstancedMesh>(null);
  const skyMaterial = useRef<T.ShaderMaterial>(null);
  const group = useRef<T.Group>(null);
  const count = low ? Math.ceil(config.count * 0.55) : config.count;
  const uniforms = useMemo(
    () => ({
      uMask: { value: mask },
      uTime: { value: 0 },
      uTop: { value: new T.Color() },
      uMiddle: { value: new T.Color() },
      uBottom: { value: new T.Color() },
      uStops: { value: new T.Vector3() },
      uCloud: { value: new T.Color() },
      uShade: { value: new T.Color() },
      uCoverage: { value: 0 },
    }),
    [mask],
  );
  // Keep uniform references stable when the shop switches between climates.
  useLayoutEffect(() => {
    const active = skyMaterial.current?.uniforms;
    if (!active) return;
    active.uTop.value.set(colors[0]);
    active.uMiddle.value.set(colors[1]);
    active.uBottom.value.set(colors[2]);
    active.uStops.value.set(...stops);
    active.uCloud.value.set(config.color);
    active.uShade.value.set(config.shade);
    active.uCoverage.value = config.coverage;
  }, [
    uniforms,
    colors[0],
    colors[1],
    colors[2],
    stops[0],
    stops[1],
    stops[2],
    config,
  ]);
  useEffect(() => () => mask.dispose(), [mask]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = clouds.current;
    if (!mesh) return;
    const random = seededRandom(91);
    const dummy = new T.Object3D();
    const tint = new T.Color(config.color);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + random() * 0.3;
      const radius = 45 + random() * 20;
      dummy.position.set(
        Math.sin(angle) * radius,
        20 + random() * 14,
        Math.cos(angle) * radius,
      );
      dummy.rotation.y = angle + random();
      const scale = 1.8 + random() * 1.1;
      dummy.scale.set(scale * (1 + random() * 0.35), scale * 0.7, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tint);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count, config, geometry]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (skyMaterial.current) skyMaterial.current.uniforms.uTime.value = t;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.012) * 0.08;
      group.current.position.x = Math.sin(t * 0.025) * 1.8;
    }
  });
  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[100, 24, 22]} />
        <shaderMaterial
          ref={skyMaterial}
          uniforms={uniforms}
          side={T.BackSide}
          depthTest={false}
          depthWrite={false}
          vertexShader={`varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`
          uniform sampler2D uMask;
          uniform float uTime, uCoverage;
          uniform vec3 uTop, uMiddle, uBottom, uCloud, uShade, uStops;
          varying vec2 vUv;
          void main() {
            float y = 1.0 - vUv.y;
            vec3 sky = mix(uTop, uMiddle, clamp((y-uStops.x)/(uStops.y-uStops.x),0.0,1.0));
            sky = mix(sky, uBottom, clamp((y-uStops.y)/(uStops.z-uStops.y),0.0,1.0));
            vec2 p = vUv * vec2(1.0, 2.0) + vec2(uTime * 0.001, 0.0);
            float mask = texture2D(uMask, p).r;
            float height = smoothstep(0.51, 0.62, vUv.y) * (1.0-smoothstep(0.9,1.0,vUv.y));
            float cover = smoothstep(uCoverage, uCoverage+0.65, mask) * height * 0.26;
            vec3 cloud = mix(uShade, uCloud, smoothstep(0.2, 0.8, mask));
            gl_FragColor = vec4(mix(sky, cloud, cover), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`}
        />
      </mesh>
      <group ref={group}>
        <instancedMesh
          key={`${climate}-${count}`}
          name="sky-clouds"
          ref={clouds}
          args={[geometry, undefined, count]}
        >
          <meshBasicMaterial vertexColors />
        </instancedMesh>
      </group>
    </>
  );
}
