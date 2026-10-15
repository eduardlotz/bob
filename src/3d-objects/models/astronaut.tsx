import { useEffect, useMemo } from "react";
import { a, useSpring } from "@react-spring/three";
import { Color, DoubleSide, SphereGeometry } from "three";
import type { BobBodyFit, Vec3 } from "@/components/bob/wearableFit";
import { createAstronautGeometry } from "./astronautGeometry";

// Linear RGB/material values from the original Astrobob costume.
const SHELL_COLOR = new Color().setRGB(0.305411, 0.305411, 0.305411);
const GLASS_COLOR = new Color().setRGB(0.8, 0.8, 0.8);

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
          <meshStandardMaterial color={SHELL_COLOR} roughness={0.5} side={DoubleSide}
            transparent={preview} opacity={preview ? 0.25 : 1} depthWrite={!preview} />
        </mesh>
        <mesh name="astrobob-visor" geometry={geometry.visor}>
          <meshStandardMaterial color={GLASS_COLOR} metalness={0.844961} roughness={0.197674}
            transparent opacity={0.6} side={DoubleSide} forceSinglePass depthWrite={false} />
        </mesh>
        <mesh name="astrobob-button" geometry={button} position={geometry.buttonPosition}
          scale={geometry.buttonRadius} castShadow receiveShadow>
          <meshStandardMaterial color={GLASS_COLOR} roughness={0.670543}
            transparent={preview} opacity={preview ? 0.25 : 1} depthWrite={!preview} />
        </mesh>
      </a.group>
    </group>
  );
}
