import { useEffect, useMemo } from "react";
import { a, useSpring } from "@react-spring/three";
import { Color, DoubleSide, SphereGeometry, type WebGLProgramParametersWithUniforms } from "three";
import type { BobBodyFit, Vec3 } from "@/components/bob/wearableFit";
import { createAstronautGeometry } from "./astronautGeometry";

// Linear RGB/material values from the original Astrobob costume.
const SHELL_COLOR = new Color().setRGB(0.305411, 0.305411, 0.305411);
const GLASS_COLOR = new Color().setRGB(0.8, 0.8, 0.8);

// View-relative bands suggest a reflected sky without environment maps or PBR.
function visorReflections(shader: WebGLProgramParametersWithUniforms) {
  shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
    vec3 visorNormal = normalize(normal);
    float rim = 1.0 - abs(dot(visorNormal, normalize(vViewPosition)));
    float edge = smoothstep(0.66, 0.82, rim) * 0.12;
    float glint = smoothstep(0.93, 0.96, dot(visorNormal, normalize(vec3(-0.45, 0.65, 0.6))));
    outgoingLight += vec3(0.72, 0.88, 1.0) * (edge + glint * 0.2);
    #include <opaque_fragment>
  `);
}

interface Props {
  position: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  body: BobBodyFit;
  preview: boolean;
}

/** Three decorative parts, sized directly from Bob; no imported model/colliders. */
export function AstronautHelmet({ position, rotation, scale, body, preview }: Props) {
  const geometry = useMemo(() => createAstronautGeometry(body), [body]);
  const button = useMemo(() => new SphereGeometry(1, 12, 8), []);
  useEffect(() => () => {
    geometry.shell.dispose();
    geometry.visor.dispose();
  }, [geometry]);
  useEffect(() => () => button.dispose(), [button]);
  const spring = useSpring({ from: { size: 0 }, size: 1, config: { tension: 300, friction: 10 } });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <a.group scale={spring.size}>
        <mesh name="astrobob-shell" geometry={geometry.shell} castShadow receiveShadow>
          <meshToonMaterial color={SHELL_COLOR} side={DoubleSide}
            transparent={preview} opacity={preview ? 0.25 : 1} depthWrite={!preview} />
        </mesh>
        <mesh name="astrobob-visor" geometry={geometry.visor}>
          <meshToonMaterial color={GLASS_COLOR} onBeforeCompile={visorReflections}
            transparent opacity={0.6} side={DoubleSide} forceSinglePass depthWrite={false} />
        </mesh>
        <mesh name="astrobob-button" geometry={button} position={geometry.buttonPosition}
          scale={geometry.buttonRadius} castShadow receiveShadow>
          <meshToonMaterial color={GLASS_COLOR}
            transparent={preview} opacity={preview ? 0.25 : 1} depthWrite={!preview} />
        </mesh>
      </a.group>
    </group>
  );
}
