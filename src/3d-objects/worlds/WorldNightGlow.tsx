import { useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as T from "three";
import { useWorldEnvironment } from "./WorldEnvironment";

/** Keep decorative emission on the same clock as the sky and other world lights. */
export function NightGlowMaterial({ color, phase = 0, blink = false, nightIntensity = 2, ...props }: Omit<ThreeElements["meshStandardMaterial"], "color"> & { color: string; phase?: number; blink?: boolean; nightIntensity?: number }) {
  const environment = useWorldEnvironment();
  const material = useRef<T.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!material.current) return;
    const { elapsed, daylight } = environment.current;
    const pulse = blink ? .45 + .55 * (.5 + .5 * Math.sin(elapsed * 1.65 + phase)) : 1;
    material.current.emissiveIntensity = (1 - daylight) * pulse * nightIntensity;
  });
  return <meshStandardMaterial ref={material} color={color} emissive={color} emissiveIntensity={0} roughness={.8} {...props} />;
}

