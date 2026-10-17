import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, type Part } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";
import { useWorldEnvironment } from "./WorldEnvironment";

function flowerGeometry(color: string, form: 0 | 1) {
  const parts: Part[] = [
    [new T.CylinderGeometry(0.022, 0.035, 0.85, 3), "#53823b", [0, 0.425, 0]],
  ];
  if (form === 0) {
    // Five flat diamond petals, all the same color, without a separate center.
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      parts.push([
        new T.CircleGeometry(0.16, 4), color,
        [Math.sin(angle) * 0.12, 0.85, Math.cos(angle) * 0.12],
        [0.8, 1, 1], [-Math.PI / 2, 0, angle],
      ]);
    }
  } else {
    // A small five-sided cup gives the second form a slightly raised silhouette.
    parts.push([new T.CylinderGeometry(0.2, 0.09, 0.16, 5, 1, true), color, [0, 0.88, 0]]);
    parts.push([new T.CircleGeometry(0.09, 5), color, [0, 0.8, 0], [1, 1, 1], [-Math.PI / 2, 0, 0]]);
  }
  return assemble(parts);
}

function FlowerBand({ palette, form, count, radius, rootOffset }: {
  palette: 0 | 1; form: 0 | 1; count: number; radius: number; rootOffset: number;
}) {
  const mesh = useRef<T.InstancedMesh>(null);
  const environment = useWorldEnvironment();
  const geometry = useMemo(() => flowerGeometry(palette === 0 ? "#e74736" : "#f4cc38", form), [palette, form]);
  const material = useMemo(() => new T.ShaderMaterial({
    vertexColors: true,
    side: T.DoubleSide,
    fog: true,
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { uTime: { value: 0 }, uDaylight: { value: 1 }, uWind: { value: .35 } }]),
    vertexShader: `
      uniform float uTime, uWind;
      #include <fog_pars_vertex>
      varying vec3 vColor;
      varying float vLight;
      void main() {
        vec3 root = instanceMatrix[3].xyz;
        float h = clamp(position.y / 0.9, 0.0, 1.0);
        float seed = fract(sin(dot(root.xz, vec2(127.1,311.7))) * 43758.5453);
        vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float gust = sin(root.x * 0.32 + root.z * 0.2 - uTime * 1.1);
        float ripple = sin(root.x * 1.5 - root.z * 0.7 + uTime * 2.7 + seed * 2.0);
        world.x += (0.12 + gust * 0.18 + ripple * 0.035) * h * h * uWind;
        world.z += sin(root.z * 0.28 + uTime * 0.85) * 0.09 * h * h * uWind;
        vColor = color;
        float light = dot(normalize(mat3(modelMatrix * instanceMatrix) * normal), normalize(vec3(0.4,1.0,0.6)));
        vLight = light > 0.5 ? 1.0 : light > -0.15 ? 0.82 : 0.64;
        vec4 mvPosition = viewMatrix * world;
        #include <fog_vertex>
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      varying vec3 vColor;
      varying float vLight;
      uniform float uDaylight;
      void main() {
        gl_FragColor = vec4(vColor * vLight * mix(vec3(.2,.28,.43),vec3(1.0),uDaylight), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const random = seededRandom(584 + palette * 2 + form);
    const dummy = new T.Object3D();
    const outer = Math.min(radius * 0.8, 32);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const r = Math.sqrt(2 ** 2 + random() * (outer ** 2 - 2 ** 2));
      dummy.position.set(Math.sin(angle) * r, rootOffset, Math.cos(angle) * r);
      dummy.rotation.y = random() * Math.PI * 2;
      const size = 0.7 + random() * 0.55;
      dummy.scale.set(size, size, size);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.boundingSphere = new T.Sphere(new T.Vector3(), outer + 3);
  }, [count, palette, form, radius, rootOffset]);
  useFrame(() => {
    material.uniforms.uTime.value = environment.current.elapsed;
    material.uniforms.uDaylight.value = environment.current.daylight;
    material.uniforms.uWind.value = environment.current.wind;
  });
  return <instancedMesh key={count} ref={mesh} name={`forest-flowers-${palette}-${form}`} args={[geometry, material, count]} />;
}

export function ForestFlowers({ radius, rootOffset }: { radius: number; rootOffset: number }) {
  const quality = useWorldQuality();
  const count = { low: 60, medium: 120, high: 180 }[quality];
  return <>{([0, 1] as const).flatMap((palette) => ([0, 1] as const).map((form) =>
    <FlowerBand key={`${palette}-${form}`} palette={palette} form={form} count={count / 2} radius={radius} rootOffset={rootOffset} />
  ))}</>;
}
