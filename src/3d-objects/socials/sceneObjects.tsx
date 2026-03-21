import { Decal, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { GlobeModel } from "../models/globe";
import { FUN_FACTS, SOCIAL_LINKS } from "./contentData";
import {
  AnimatedThroneBase,
  createSocialBallDescriptors,
  getFunFactCardTexture,
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
const FUN_FACT_CARD_WIDTH = 0.44;
const FUN_FACT_CARD_HEIGHT = 0.6;
const FUN_FACT_CARD_THICKNESS = 0.028;
const FUN_FACT_STACK_OFFSET_Y = 0.013;
const FUN_FACT_STACK_OFFSET_Z = 0.024;
const FUN_FACT_STACK_TILT = 0.06;
const FUN_FACT_REVEAL_LIFT = 0.19;
const FUN_FACT_REVEAL_FORWARD = 0.12;
const FUN_FACT_REVEAL_ROTATION_Z = -0.08;
const FUN_FACT_REVEAL_PEAK_LIFT = 0.2;
const FUN_FACT_REVEAL_PEAK_FORWARD = 0.14;
const FUN_FACT_REVEAL_PEAK_ROTATION_X = Math.PI * 0.96;
const FUN_FACT_THRONE_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0.08];
const FUN_FACT_FOCUS_ROTATION: [number, number, number] = [0.2, 0, 0.05];

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

export function FunFactsDeckObject(props: ThroneObjectProps) {
  const currentIndex = useSocialsStore((state) => state.currentFunFactIndex);
  const revealToken = useSocialsStore((state) => state.funFactRevealToken);
  const topCardRef = useRef<THREE.Group>(null);
  const revealProgress = useRef(1);
  const lastRevealToken = useRef(revealToken);
  const isRevealAnimating = useRef(false);
  const swappedFactDuringAnimation = useRef(false);
  const [displayedFactIndex, setDisplayedFactIndex] = useState(currentIndex);

  const displayedFact = FUN_FACTS[displayedFactIndex] ?? FUN_FACTS[0];
  const incomingFact = FUN_FACTS[currentIndex] ?? displayedFact;
  const baseRotation = props.isFloating ? FUN_FACT_FOCUS_ROTATION : FUN_FACT_THRONE_ROTATION;
  const stackDepthDirection = props.isFloating ? 1 : -1;
  const restingTopCardZ = stackDepthDirection * FUN_FACT_STACK_OFFSET_Z * 2;
  const revealPeakForward = stackDepthDirection * FUN_FACT_REVEAL_PEAK_FORWARD;
  const frontFactTexture = useMemo(
    () => getFunFactCardTexture(displayedFact),
    [displayedFact],
  );
  const backFactTexture = useMemo(
    () => getFunFactCardTexture(incomingFact),
    [incomingFact],
  );

  useEffect(() => {
    const tokenChanged = revealToken !== lastRevealToken.current;
    lastRevealToken.current = revealToken;

    if (props.isFloating && tokenChanged) {
      revealProgress.current = 0;
      isRevealAnimating.current = true;
      swappedFactDuringAnimation.current = false;
      return;
    }

    if (!props.isFloating) {
      isRevealAnimating.current = false;
      revealProgress.current = 1;
      swappedFactDuringAnimation.current = false;
      setDisplayedFactIndex(currentIndex);
    }
  }, [currentIndex, props.isFloating, revealToken]);

  useFrame((_, dt) => {
    if (!topCardRef.current) return;

    if (!props.isFloating || !isRevealAnimating.current) {
      topCardRef.current.rotation.set(0, 0, -FUN_FACT_STACK_TILT);
      topCardRef.current.position.set(
        0,
        FUN_FACT_STACK_OFFSET_Y * 2,
        restingTopCardZ,
      );
      return;
    }

    revealProgress.current = Math.min(1, revealProgress.current + dt * 1.7);
    const phase = revealProgress.current < 0.5 ? revealProgress.current / 0.5 : (revealProgress.current - 0.5) / 0.5;
    const eased = 1 - Math.pow(1 - phase, 3);

    if (revealProgress.current < 0.5) {
      topCardRef.current.rotation.x = THREE.MathUtils.lerp(
        0,
        FUN_FACT_REVEAL_PEAK_ROTATION_X,
        eased,
      );
      topCardRef.current.rotation.z = THREE.MathUtils.lerp(
        -FUN_FACT_STACK_TILT,
        FUN_FACT_REVEAL_ROTATION_Z,
        eased,
      );
      topCardRef.current.position.y = THREE.MathUtils.lerp(
        FUN_FACT_STACK_OFFSET_Y * 2,
        FUN_FACT_REVEAL_PEAK_LIFT,
        eased,
      );
      topCardRef.current.position.z = THREE.MathUtils.lerp(
        restingTopCardZ,
        revealPeakForward,
        eased,
      );
    } else {
      if (!swappedFactDuringAnimation.current) {
        swappedFactDuringAnimation.current = true;
        setDisplayedFactIndex(currentIndex);
      }

      topCardRef.current.rotation.x = THREE.MathUtils.lerp(
        FUN_FACT_REVEAL_PEAK_ROTATION_X,
        0,
        eased,
      );
      topCardRef.current.rotation.z = THREE.MathUtils.lerp(
        FUN_FACT_REVEAL_ROTATION_Z,
        -FUN_FACT_STACK_TILT,
        eased,
      );
      topCardRef.current.position.y = THREE.MathUtils.lerp(
        FUN_FACT_REVEAL_PEAK_LIFT,
        FUN_FACT_STACK_OFFSET_Y * 2,
        eased,
      );
      topCardRef.current.position.z = THREE.MathUtils.lerp(
        revealPeakForward,
        restingTopCardZ,
        eased,
      );
    }

    if (revealProgress.current >= 1) {
      isRevealAnimating.current = false;
      swappedFactDuringAnimation.current = false;
      topCardRef.current.rotation.set(0, 0, -FUN_FACT_STACK_TILT);
      topCardRef.current.position.set(
        0,
        FUN_FACT_STACK_OFFSET_Y * 2,
        restingTopCardZ,
      );
    }
  });

  return (
    <AnimatedThroneBase
      {...props}
      baseHeight={0.092}
      spinSpeed={0}
      bobAmplitude={0.012}
      pulseAmplitude={0.006}
    >
      <group position={[0, 0.008, 0]} rotation={baseRotation}>
        {[0, 1, 2].map((index) => (
          <group
            key={`stack-card-${index}`}
            position={[
              index * 0.007 - 0.007,
              index * FUN_FACT_STACK_OFFSET_Y - FUN_FACT_STACK_OFFSET_Y,
              stackDepthDirection * index * FUN_FACT_STACK_OFFSET_Z,
            ]}
            rotation={[0, 0, (index - 1) * FUN_FACT_STACK_TILT]}
          >
            <RoundedBox
              args={[
                FUN_FACT_CARD_WIDTH,
                FUN_FACT_CARD_HEIGHT,
                FUN_FACT_CARD_THICKNESS,
              ]}
              radius={0.032}
              smoothness={4}
            >
              <meshStandardMaterial
                color={index === 1 ? "#ffe8cc" : "#f4ede5"}
                roughness={0.9}
              />
            </RoundedBox>
          </group>
        ))}

        <group ref={topCardRef}>
          <RoundedBox
            args={[
              FUN_FACT_CARD_WIDTH + 0.02,
              FUN_FACT_CARD_HEIGHT + 0.02,
              FUN_FACT_CARD_THICKNESS + 0.004,
            ]}
            radius={0.036}
            smoothness={4}
          >
            <meshStandardMaterial color="#fffaf2" roughness={0.88} />
          </RoundedBox>
          <mesh position={[0, 0, (FUN_FACT_CARD_THICKNESS + 0.004) / 2 + 0.001]}>
            <planeGeometry
              args={[FUN_FACT_CARD_WIDTH - 0.04, FUN_FACT_CARD_HEIGHT - 0.04]}
            />
            <meshBasicMaterial
              map={frontFactTexture}
              transparent
              toneMapped={false}
            />
          </mesh>
          <mesh
            position={[0, 0, -(FUN_FACT_CARD_THICKNESS + 0.004) / 2 - 0.001]}
            rotation={[0, Math.PI, 0]}
          >
            <planeGeometry
              args={[FUN_FACT_CARD_WIDTH - 0.04, FUN_FACT_CARD_HEIGHT - 0.04]}
            />
            <meshBasicMaterial
              map={backFactTexture}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </AnimatedThroneBase>
  );
}
