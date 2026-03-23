import { Decal, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { GlobeModel } from "../models/globe";
import { SOCIAL_LINKS } from "./contentData";
import {
  AnimatedThroneBase,
  createSocialBallDescriptors,
  useSocialLogoTextures,
} from "./helper";
import type { ThroneObjectProps } from "./types";

const GLOBE_SCALE = 2.46;
const GLOBE_SCALE_VEC: [number, number, number] = [
  GLOBE_SCALE,
  GLOBE_SCALE,
  GLOBE_SCALE,
];
const FOCUS_GLOBE_SCALE = 1.2;
const FOCUS_GLOBE_SCALE_VEC: [number, number, number] = [
  FOCUS_GLOBE_SCALE,
  FOCUS_GLOBE_SCALE,
  FOCUS_GLOBE_SCALE,
];
const SOCIAL_BALL_RADII = [0.05, 0.064, 0.056, 0.068, 0.052, 0.06] as const;

function SocialBallVisual({
  logoTexture,
  radius,
  color,
}: {
  logoTexture: THREE.Texture | null;
  radius: number;
  color: string;
}) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshToonMaterial color={color} />
        {logoTexture && (
          <Decal position={[0, 0, radius * 0.72]} scale={radius * 1.15}>
            <meshBasicMaterial
              map={logoTexture}
              transparent
              polygonOffset
              polygonOffsetFactor={-1}
              toneMapped={false}
            />
          </Decal>
        )}
      </mesh>
    </group>
  );
}

function StaticSocialsGlobeVisual({
  idleAnimated,
  scale,
}: {
  idleAnimated: boolean;
  scale: [number, number, number];
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const logoUrls = useSocialLogoTextures(SOCIAL_LINKS);
  const logos = useTexture(logoUrls);
  const descriptors = useMemo(
    () => createSocialBallDescriptors(SOCIAL_LINKS, 0.2),
    [],
  );

  useEffect(() => {
    const list = Array.isArray(logos) ? logos : [logos];
    list.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    });
  }, [logos]);

  useFrame((state, dt) => {
    if (!orbitRef.current) return;

    const time = state.clock.elapsedTime;
    orbitRef.current.rotation.y += dt * (idleAnimated ? 0.32 : 0.14);
    orbitRef.current.rotation.x =
      Math.sin(time * 0.8) * (idleAnimated ? 0.08 : 0.04);

    orbitRef.current.children.forEach((child, index) => {
      const descriptor = descriptors[index];
      if (!descriptor) return;

      child.position.copy(descriptor.position);

      if (idleAnimated) {
        const pulse = 1 + Math.sin(time * 1.8 + index * 1.15) * 0.08;
        child.position.multiplyScalar(pulse);
        child.position.y += Math.sin(time * 2.2 + index * 0.85) * 0.014;
        child.rotation.z = Math.sin(time * 1.5 + index) * 0.2;
      } else {
        child.rotation.z = 0;
      }
    });
  });

  return (
    <GlobeModel scale={scale} color="#7fb5ff">
      <group ref={orbitRef}>
        {descriptors.map((descriptor, index) => (
          <group
            key={descriptor.link.id}
            position={descriptor.position}
            quaternion={descriptor.quaternion}
          >
            <SocialBallVisual
              radius={SOCIAL_BALL_RADII[index % SOCIAL_BALL_RADII.length]}
              color={descriptor.link.color}
              logoTexture={Array.isArray(logos) ? logos[index] : logos}
            />
          </group>
        ))}
      </group>
    </GlobeModel>
  );
}

export function SocialsGlobeObject(props: ThroneObjectProps) {
  return (
    <AnimatedThroneBase
      {...props}
      baseHeight={0.2}
      spinSpeed={0.0014}
      bobAmplitude={0.044}
      pulseAmplitude={0.02}
    >
      <StaticSocialsGlobeVisual
        idleAnimated={!props.isFloating}
        scale={props.isFloating ? FOCUS_GLOBE_SCALE_VEC : GLOBE_SCALE_VEC}
      />
    </AnimatedThroneBase>
  );
}
