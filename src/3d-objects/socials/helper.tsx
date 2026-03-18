import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FunFact, SocialLink, ThroneObjectProps } from "./types";

const stickerTextureCache = new Map<string, THREE.CanvasTexture>();
const cardTextureCache = new Map<string, THREE.CanvasTexture>();

function encodeSvgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSocialLogoDataUrl(link: SocialLink) {
  const stroke = link.id === "github" ? "#ffffff" : "#ffffff";
  const svgById: Record<string, string> = {
    github: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <path fill="${stroke}" d="M64 18c-25.4 0-46 20.6-46 46 0 20.3 13.2 37.5 31.6 43.6 2.3.4 3.1-1 3.1-2.2v-7.8c-12.8 2.8-15.5-5.4-15.5-5.4-2.1-5.3-5.1-6.7-5.1-6.7-4.2-2.9.3-2.8.3-2.8 4.6.3 7 4.7 7 4.7 4.1 7 10.8 5 13.4 3.9.4-3 .1-5.1 2-6.3-10.2-1.2-20.9-5.1-20.9-22.7 0-5 1.8-9 4.7-12.2-.5-1.2-2-5.9.4-12.2 0 0 3.8-1.2 12.5 4.7a43.3 43.3 0 0 1 22.8 0c8.7-5.9 12.5-4.7 12.5-4.7 2.5 6.3 1 11 .5 12.2 3 3.2 4.7 7.2 4.7 12.2 0 17.7-10.7 21.5-20.9 22.6 1.7 1.5 3.1 4.3 3.1 8.8v13c0 1.2.8 2.6 3.2 2.2A46 46 0 0 0 110 64c0-25.4-20.6-46-46-46Z"/>
      </svg>`,
    x: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <path fill="${stroke}" d="M25 24h18.6l21.6 28.8L90 24h13L71.6 60.1 105 104H86.4L63.7 74.2 36.4 104H23.3l33.5-36.5z"/>
      </svg>`,
    instagram: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <rect x="24" y="24" width="80" height="80" rx="22" ry="22" fill="none" stroke="${stroke}" stroke-width="10"/>
        <circle cx="64" cy="64" r="18" fill="none" stroke="${stroke}" stroke-width="10"/>
        <circle cx="88" cy="40" r="6" fill="${stroke}"/>
      </svg>`,
    soundcloud: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <path fill="${stroke}" d="M52 88h44a16 16 0 0 0 0-32 24 24 0 0 0-46.2-5.6A14 14 0 0 0 52 88Z"/>
        <rect x="24" y="66" width="6" height="22" rx="3" fill="${stroke}"/>
        <rect x="34" y="60" width="6" height="28" rx="3" fill="${stroke}"/>
        <rect x="44" y="54" width="6" height="34" rx="3" fill="${stroke}"/>
      </svg>`,
    cosmos: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <circle cx="64" cy="24" r="9" fill="${stroke}"/>
        <circle cx="92" cy="36" r="9" fill="${stroke}"/>
        <circle cx="104" cy="64" r="9" fill="${stroke}"/>
        <circle cx="92" cy="92" r="9" fill="${stroke}"/>
        <circle cx="64" cy="104" r="9" fill="${stroke}"/>
        <circle cx="36" cy="92" r="9" fill="${stroke}"/>
        <circle cx="24" cy="64" r="9" fill="${stroke}"/>
        <circle cx="36" cy="36" r="9" fill="${stroke}"/>
      </svg>`,
    linkedin: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <rect x="26" y="48" width="16" height="52" fill="${stroke}"/>
        <rect x="50" y="48" width="16" height="52" fill="${stroke}"/>
        <path fill="${stroke}" d="M66 58c5-7 11-10 20-10 14 0 22 9 22 27v25H92V78c0-9-3-14-11-14-9 0-15 6-15 18v18H50V48h16v10Z"/>
        <circle cx="34" cy="34" r="10" fill="${stroke}"/>
      </svg>`,
  };

  return encodeSvgDataUrl(svgById[link.id] ?? svgById.github);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function AnimatedThroneBase({
  focused,
  isFloating,
  baseHeight = 0.16,
  spinSpeed = 0.0045,
  bobAmplitude = 0.038,
  pulseAmplitude = 0.018,
  children,
}: ThroneObjectProps & {
  children: React.ReactNode;
  baseHeight?: number;
  spinSpeed?: number;
  bobAmplitude?: number;
  pulseAmplitude?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    t.current += dt;

    const bob = Math.sin(t.current * 1.3) * bobAmplitude;
    const baseScale = focused ? 1.14 : 1;
    const pulse = Math.sin(t.current * 1.8) * pulseAmplitude;
    const scale = baseScale + pulse;

    groupRef.current.position.y = isFloating
      ? bob
      : baseHeight + bob + (focused ? 0.055 : 0);
    groupRef.current.scale.setScalar(scale);

    if (!isFloating && spinSpeed !== 0) {
      groupRef.current.rotation.y += dt * spinSpeed;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export function createAnimatedThroneFromElement(
  element: React.ReactElement,
  options?: {
    baseHeight?: number;
    spinSpeed?: number;
    bobAmplitude?: number;
    pulseAmplitude?: number;
  },
): React.ComponentType<ThroneObjectProps> {
  const displayName =
    (element.type as { displayName?: string; name?: string })?.displayName ||
    (element.type as { displayName?: string; name?: string })?.name ||
    "Element";

  const AnimatedThroneElement = (props: ThroneObjectProps) => {
    const { color, focused, isFloating } = props;
    return (
      <AnimatedThroneBase
        {...props}
        focused={focused}
        isFloating={isFloating}
        baseHeight={options?.baseHeight}
        spinSpeed={options?.spinSpeed}
        bobAmplitude={options?.bobAmplitude}
        pulseAmplitude={options?.pulseAmplitude}
      >
        {React.cloneElement(element, { color })}
      </AnimatedThroneBase>
    );
  };

  AnimatedThroneElement.displayName = `AnimatedThrone(${displayName})`;
  return AnimatedThroneElement;
}

export function getStickerTexture(link: SocialLink) {
  if (typeof document === "undefined") return null;

  const key = `${link.id}:${link.color}:${link.sticker}:${link.textColor ?? "#fff"}`;
  const cached = stickerTextureCache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  drawRoundedRect(ctx, 18, 18, size - 36, size - 36, 64);
  ctx.fillStyle = link.color;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.fillStyle = link.textColor ?? "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${link.sticker.length > 1 ? 110 : 140}px sans-serif`;
  ctx.fillText(link.sticker, size / 2, size / 2 + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  stickerTextureCache.set(key, texture);

  return texture;
}

export function getFunFactCardTexture(fact: FunFact) {
  if (typeof document === "undefined") return null;

  const cacheKey = `${fact.id}:${fact.name}:${fact.text}:${fact.accentColor}`;
  const cached = cardTextureCache.get(cacheKey);
  if (cached) return cached;

  const width = 768;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#fff8ef";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(17,17,17,0.06)";
  drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 42);
  ctx.fill();

  ctx.fillStyle = fact.accentColor;
  drawRoundedRect(ctx, 82, 92, 196, 66, 26);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "700 34px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fact.id, 114, 126);

  ctx.fillStyle = "#111111";
  ctx.font = "700 54px sans-serif";
  ctx.fillText(fact.name, 84, 236);

  ctx.font = "400 40px sans-serif";
  const lines = wrapCanvasText(ctx, fact.text, width - 168);
  const lineHeight = 55;
  lines.slice(0, 10).forEach((line, index) => {
    ctx.fillText(line, 84, 360 + index * lineHeight);
  });

  ctx.fillStyle = "rgba(17,17,17,0.34)";
  ctx.font = "600 28px sans-serif";
  ctx.fillText("tap to reshuffle from the overlay", 84, height - 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cardTextureCache.set(cacheKey, texture);

  return texture;
}

export function useStickerTextures(links: SocialLink[]) {
  return useMemo(() => links.map((link) => getStickerTexture(link)), [links]);
}

export function useSocialLogoTextures(links: SocialLink[]) {
  return useMemo(() => links.map((link) => getSocialLogoDataUrl(link)), [links]);
}

export function createMiniBallLayout(count: number, radius: number) {
  return Array.from({ length: count }, (_, index) => {
    const offset = 2 / count;
    const y = index * offset - 1 + offset / 2;
    const radial = Math.sqrt(1 - y * y);
    const theta = index * Math.PI * (3 - Math.sqrt(5));

    return new THREE.Vector3(
      Math.cos(theta) * radial * radius,
      y * radius,
      Math.sin(theta) * radial * radius,
    );
  });
}

export function createHollowSphereColliderLayout(
  radius: number,
  latitudeBands = [-72, -48, -24, 0, 24, 48, 72],
  longitudeSteps = 14,
) {
  const positions: THREE.Vector3[] = [
    new THREE.Vector3(0, radius, 0),
    new THREE.Vector3(0, -radius, 0),
  ];

  latitudeBands.forEach((latitudeDegrees, bandIndex) => {
    const phi = THREE.MathUtils.degToRad(90 - latitudeDegrees);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const thetaOffset = (bandIndex % 2) * (Math.PI / longitudeSteps);

    for (let step = 0; step < longitudeSteps; step += 1) {
      const theta = (step / longitudeSteps) * Math.PI * 2 + thetaOffset;
      positions.push(
        new THREE.Vector3(
          Math.cos(theta) * sinPhi * radius,
          cosPhi * radius,
          Math.sin(theta) * sinPhi * radius,
        ),
      );
    }
  });

  return positions;
}

export function createOutwardQuaternion(position: THREE.Vector3) {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    position.clone().normalize(),
  );
  return quaternion;
}

export function createSocialBallDescriptors(
  links: SocialLink[],
  radius: number,
) {
  const positions = createMiniBallLayout(links.length, radius);
  return links.map((link, index) => ({
    link,
    position: positions[index],
    quaternion: createOutwardQuaternion(positions[index]),
  }));
}

export function getLoopedNextIndex(currentIndex: number, total: number) {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}
