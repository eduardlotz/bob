import { Decal, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { GlobeModel } from "../models/globe";
import { SOCIAL_LINKS } from "./contentData";
import {
  AnimatedThroneBase,
  createSocialBallDescriptors,
  useSocialLogoTextures,
  useStickerTextures,
} from "./helper";
import { useSocialsStore } from "@/store/socials";
import type { ThroneObjectProps } from "./types";
const GLOBE_SCALE = 0.82;
const GLOBE_SCALE_VEC: [number, number, number] = [GLOBE_SCALE, GLOBE_SCALE, GLOBE_SCALE];
const STATIC_SOCIAL_BALL_RADIUS = 0.05;
const TIMELINE_PANEL_SIZE: [number, number, number] = [0.34, 0.42, 0.06];
const TIMELINE_NODE_POSITIONS = [0.1, 0, -0.1] as const;

export function TimelineCameraObject(props: ThroneObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(elapsed * 0.75) * 0.14;
      groupRef.current.rotation.z = Math.sin(elapsed * 0.45) * 0.025;
    }

    if (pulseRef.current) {
      const pulse = 1 + Math.sin(elapsed * 2) * 0.06;
      pulseRef.current.scale.setScalar(pulse);
    }

    if (nodesRef.current) {
      nodesRef.current.position.y = Math.sin(elapsed * 1.2) * 0.01;
    }
  });

  return (
    <AnimatedThroneBase {...props} baseHeight={0.155} spinSpeed={0.0022}>
      <group ref={groupRef} rotation={[0.1, -0.08, -0.05]} scale={0.72}>
        <RoundedBox args={TIMELINE_PANEL_SIZE} radius={0.055} smoothness={4}>
          <meshStandardMaterial color="#f4efe7" roughness={0.86} />
        </RoundedBox>

        <RoundedBox
          args={[0.16, 0.05, 0.02]}
          radius={0.02}
          smoothness={4}
          position={[-0.055, 0.155, 0.034]}
        >
          <meshStandardMaterial color="#171a22" roughness={0.7} />
        </RoundedBox>

        <mesh position={[-0.055, 0.155, 0.045]}>
          <planeGeometry args={[0.09, 0.01]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        <mesh position={[-0.085, 0, 0.036]} castShadow receiveShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.26, 18]} />
          <meshToonMaterial color="#d2cabd" />
        </mesh>

        <mesh position={[-0.085, 0.13, 0.04]}>
          <sphereGeometry args={[0.03, 20, 20]} />
          <meshBasicMaterial color="#7c8cff" toneMapped={false} />
        </mesh>

        <mesh ref={pulseRef} position={[-0.085, 0.13, 0.042]}>
          <sphereGeometry args={[0.038, 20, 20]} />
          <meshToonMaterial color="#7c8cff" />
        </mesh>

        <group ref={nodesRef} position={[0.01, 0, 0.02]}>
          {TIMELINE_NODE_POSITIONS.map((y, index) => (
            <group key={`timeline-node-${index}`} position={[-0.005, y, 0]}>
              <mesh position={[-0.08, 0, 0]}>
                <sphereGeometry args={[0.022, 18, 18]} />
                <meshToonMaterial
                  color={index === 0 ? "#ff8c69" : index === 1 ? "#7c8cff" : "#f0b56a"}
                />
              </mesh>
              <RoundedBox
                args={[0.18 - index * 0.025, 0.024, 0.024]}
                radius={0.012}
                smoothness={4}
                position={[0.035, 0, -0.002]}
              >
                <meshStandardMaterial color="#d9d0c1" roughness={0.86} />
              </RoundedBox>
            </group>
          ))}
        </group>
      </group>
    </AnimatedThroneBase>
  );
}

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

function StaticSocialsGlobeVisual() {
  const orbitRef = useRef<THREE.Group>(null);
  const logoUrls = useSocialLogoTextures(SOCIAL_LINKS);
  const logos = useTexture(logoUrls);
  const descriptors = useMemo(
    () => createSocialBallDescriptors(SOCIAL_LINKS, 0.18),
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
    orbitRef.current.rotation.y += dt * 0.26;
    orbitRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });

  return (
    <GlobeModel scale={GLOBE_SCALE_VEC} color="#7fb5ff">
      <group ref={orbitRef}>
        {descriptors.map((descriptor, index) => (
          <group
            key={descriptor.link.id}
            position={descriptor.position}
            quaternion={descriptor.quaternion}
          >
            <SocialBallVisual
              radius={STATIC_SOCIAL_BALL_RADIUS}
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
    <AnimatedThroneBase {...props} baseHeight={0.2} spinSpeed={0.0012}>
      <StaticSocialsGlobeVisual />
    </AnimatedThroneBase>
  );
}

export function FavoritesStackObject(props: ThroneObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const resolvedFavorites = useSocialsStore((state) => state.resolvedFavorites);
  const favoritePreviewItems = resolvedFavorites.slice(0, 3);
  const textures = useTexture(favoritePreviewItems.map((item) => item.textureUrl));

  useEffect(() => {
    const list = Array.isArray(textures) ? textures : [textures];
    list.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
    });
  }, [textures]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.16;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.02;
  });

  return (
    <AnimatedThroneBase {...props} baseHeight={0.19} spinSpeed={0.0008}>
      <group ref={groupRef}>
        {favoritePreviewItems.map((item, index) => {
          const texture = Array.isArray(textures) ? textures[index] : textures;
          const x = (index - 1) * 0.11;
          const y = index * 0.02;
          const z = -index * 0.03;
          const rotation = (index - 1) * 0.18;

          return (
            <group
              key={item.id}
              position={[x, y, z]}
              rotation={[0.14, rotation, rotation * 0.45]}
            >
              <RoundedBox args={[0.32, 0.42, 0.04]} radius={0.03} smoothness={4}>
                <meshStandardMaterial color="#f6f0e8" roughness={0.82} />
              </RoundedBox>
              <mesh position={[0, 0, 0.021]}>
                <planeGeometry args={[0.27, 0.37]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
      </group>
    </AnimatedThroneBase>
  );
}
