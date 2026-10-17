import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { useWorldEnvironment } from "./WorldEnvironment";
import { FIRE_LIGHT_POSITION, FIRE_LIGHT_TINT, firelightGLSL, firelightStrength } from "./firelight";

/** A radial ground fill shares the flame clock; no extra light or shadow map. */
export function IslandSandMaterial({ map }: { map: T.Texture }) {
  const environment = useWorldEnvironment();
  const uniforms = useMemo(() => ({
    uFirePosition: { value: FIRE_LIGHT_POSITION },
    uFireTint: { value: FIRE_LIGHT_TINT },
    uFireStrength: { value: 0 },
  }), []);
  const patch = useMemo(() => (shader: T.WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = "varying vec3 vFirePosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>",
      "vFirePosition=(modelMatrix*vec4(transformed,1.)).xyz;\n#include <project_vertex>");
    shader.fragmentShader = firelightGLSL + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>",
      "outgoingLight += diffuseColor.rgb * uFireTint * uFireStrength * fireReach() * .85;\n#include <opaque_fragment>");
  }, [uniforms]);
  useFrame(() => {
    uniforms.uFireStrength.value = firelightStrength(environment.current.elapsed, environment.current.daylight);
  });
  return <WorldToonMaterial map={map} side={T.DoubleSide} onBeforeCompile={patch} customProgramCacheKey={() => "island-sand-fire-pool-v1"} />;
}

/** The sand dims evenly; terrain normals no longer cross the moving sun's toon bands. */
export function UnderwaterSandMaterial({ map }: { map: T.Texture }) {
  const environment = useWorldEnvironment();
  const material = useRef<T.MeshBasicMaterial>(null);
  const nightTint = useMemo(() => new T.Color(.11, .17, .24), []);
  const uniforms = useMemo(() => ({ uBobPool: { value: 0 } }), []);
  const patch = useMemo(() => (shader: T.WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = "varying vec3 vSandPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>",
      "vSandPosition=(modelMatrix*vec4(transformed,1.)).xyz;\n#include <project_vertex>");
    shader.fragmentShader = "varying vec3 vSandPosition; uniform float uBobPool;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
      float pool=1.-smoothstep(.6,4.2,length(vSandPosition.xz));
      outgoingLight += texture2D(map,vMapUv).rgb * vec3(.35,.7,.86) * uBobPool * pool;
      #include <opaque_fragment>`);
  }, [uniforms]);
  useFrame(() => {
    const night = 1 - environment.current.daylight;
    material.current?.color.setRGB(1, 1, 1).lerp(nightTint, night);
    uniforms.uBobPool.value = night * .13;
  });
  return <meshBasicMaterial ref={material} map={map} onBeforeCompile={patch} customProgramCacheKey={() => "underwater-even-sand-v1"} />;
}
