import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import { Fireplace } from "./Fireplace";
export { Fireplace };
import { useWorldEnvironment } from "./WorldEnvironment";

const softPool = (shader: T.WebGLProgramParametersWithUniforms) => {
  shader.vertexShader = 'varying vec2 vPool;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPool = uv * 2.0 - 1.0;');
  shader.fragmentShader = 'varying vec2 vPool;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'diffuseColor.a *= pow(max(0.0, 1.0 - dot(vPool, vPool)), 2.0);\n#include <opaque_fragment>');
};

let nextFillId = 0;

/** An additive material tint, not a Three light: no light loops or shadow maps. */
export function NightMaterialFill({ kind }: { kind: "fire" | "moon" }) {
  const scene = useThree(s => s.scene);
  const environment = useWorldEnvironment();
  const fillId = useMemo(() => ++nextFillId, []);
  const uniforms = useMemo(() => ({
    uNightFill: { value: 0 },
    uNightSource: { value: new T.Vector3(0, -.8, 2) },
    uNightTint: { value: new T.Color("#ffad54") },
  }), []);
  useEffect(() => {
    const originals = new Map<T.Material, { compile: T.Material["onBeforeCompile"]; key: T.Material["customProgramCacheKey"] }>();
    const patch = () => scene.traverse(object => {
      const mesh = object as T.Mesh;
      if (!mesh.isMesh) return;
      let parent: T.Object3D | null = mesh;
      while (parent) {
        if (parent.name === "night-fireplace") return;
        parent = parent.parent;
      }
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!material || originals.has(material) || !(material instanceof T.MeshStandardMaterial || material instanceof T.MeshToonMaterial || material instanceof T.MeshLambertMaterial)) continue;
        const compile = material.onBeforeCompile, key = material.customProgramCacheKey;
        originals.set(material, { compile, key });
        material.onBeforeCompile = function(shader, renderer) {
          compile.call(this, shader, renderer);
          Object.assign(shader.uniforms, uniforms);
          shader.vertexShader = 'varying vec3 vNightPosition; varying vec3 vNightNormal; uniform vec3 uNightSource;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
            vec4 nightPosition = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              nightPosition = instanceMatrix * nightPosition;
            #endif
            vNightPosition = (modelMatrix * nightPosition).xyz;
            vNightNormal = inverseTransformDirection(transformedNormal, viewMatrix);
            #include <project_vertex>`);
          shader.fragmentShader = 'varying vec3 vNightPosition; varying vec3 vNightNormal; uniform float uNightFill; uniform vec3 uNightTint; uniform vec3 uNightSource;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
            float nightReach = 1.0 - smoothstep(1.9, 7.5, length(vNightPosition - vec3(0.0, 0.0, 2.0)));
            float facing = max(0.0, dot(normalize(vNightNormal), normalize(uNightSource - vNightPosition)));
            float toonBand = step(.25, facing) * .45 + step(.65, facing) * .55;
            outgoingLight += diffuseColor.rgb * uNightTint * uNightFill * nightReach * toonBand;
            #include <opaque_fragment>`);
        };
        material.customProgramCacheKey = () => key.call(material) + ':night-fill-toon-v5:' + fillId;
        material.needsUpdate = true;
      }
    });
    patch();
    // Includes lazily loaded Bob forms and counter geometry replacements.
    const timer = window.setInterval(patch, 500);
    return () => {
      clearInterval(timer);
      uniforms.uNightFill.value = 0;
      originals.forEach(({ compile, key }, material) => {
        material.onBeforeCompile = compile; material.customProgramCacheKey = key; material.needsUpdate = true;
      });
    };
  }, [scene, uniforms, fillId]);
  useFrame(() => {
    const { daylight, elapsed } = environment.current;
    uniforms.uNightTint.value.set(kind === "moon" ? "#9dbce8" : "#ffad54");
    if (kind === "fire") uniforms.uNightSource.value.set(0, -.8, 2);
    else uniforms.uNightSource.value.set(3, 5, 6);
    const flicker = kind === "fire" ? .82 + .1 * Math.sin(elapsed * 13) + .08 * Math.sin(elapsed * 23.7) : 1;
    uniforms.uNightFill.value = (1 - daylight) * flicker * (kind === "moon" ? .24 : .65);
  }, -4);
  return null;
}

/** The corner lamp pair uses transparent cones and soft ground pools. */
export function StreetLightPools() {
  const environment = useWorldEnvironment();
  const group = useRef<T.Group>(null);
  useFrame(() => {
    const night = 1 - environment.current.daylight;
    group.current?.traverse(o => {
      const material = (o as T.Mesh).material as T.MeshBasicMaterial;
      if (material?.isMeshBasicMaterial) material.opacity = night * (o.name === "beam" ? .035 : .17);
    });
  });
  return <group ref={group} name="night-street-pools">{[-4.8, 4.8].flatMap(z => [-1, 1].map(side => <group key={`${side}:${z}`} position={[side * 4.25, -1.28, z]}>
    <mesh name="beam" position={[0, 2.1, 0]}><coneGeometry args={[1.8, 4.2, 24, 1, true]} /><meshBasicMaterial color="#ffe4a0" side={T.DoubleSide} transparent opacity={0} depthWrite={false} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 0]}><circleGeometry args={[1.8, 32]} /><meshBasicMaterial color="#ffe4a0" onBeforeCompile={softPool} transparent opacity={0} depthWrite={false} /></mesh>
  </group>))}</group>;
}

/** The additional near-corner posts use ordinary toon lighting, without shadows. */
export function CityCornerLights() {
  return <group name="near-corner-lights"><CornerLight side={-1} /><CornerLight side={1} /></group>;
}
function CornerLight({ side }: { side: number }) {
  const environment = useWorldEnvironment();
  const light = useRef<T.SpotLight>(null);
  const target = useRef<T.Object3D>(null);
  useEffect(() => { if (light.current && target.current) light.current.target = target.current; }, []);
  useFrame(() => { if (light.current) light.current.intensity = (1 - environment.current.daylight) * 16; }, -4);
  return <>
    <object3D ref={target} position={[0, .4, -1]} />
    <spotLight ref={light} name={`corner-spot-${side}`} position={[side * 4.25, 2.92, 4.8]} color="#ffe4b0"
      intensity={0} angle={.68} penumbra={.5} distance={16} decay={2} castShadow={false} />
  </>;
}
