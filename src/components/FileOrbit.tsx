import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import { Billboard, Html } from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useAppStore, useCoreStore, useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { extend, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { geometry } from "maath";
import styled from "styled-components";
import { AnimatePresence, motion } from "motion/react";
import { MotionVariants } from "@/styles/motion";
import { useI18n } from "@/i18n";

type ViewCullMode = "default" | "focused";

interface CullConfig {
  cullingDistance: number;
  fadeStart: number;
  videoPlayDistance: number;
}

function resolveCullConfig({
  isMobile,
  viewMode,
  isFocusedItem,
}: {
  isMobile: boolean;
  viewMode: ViewCullMode;
  isFocusedItem: boolean;
}): CullConfig {
  const base = isMobile ? CONFIG.low : CONFIG.high;

  if (isFocusedItem) {
    return {
      cullingDistance: base.cullingDistance,
      fadeStart: base.cullingDistance,
      videoPlayDistance: base.videoPlayDistance * 100,
    };
  }

  if (viewMode === "default") {
    return {
      cullingDistance: base.cullingDistance,
      fadeStart: base.cullingDistance * 0.5,
      videoPlayDistance: base.videoPlayDistance,
    };
  }

  const reduced = base.cullingDistance * 0.1;

  return {
    cullingDistance: reduced,
    fadeStart: reduced * 0.5,
    videoPlayDistance: 0,
  };
}

export type MediaMeta =
  | { type: "text"; label: string; value: string }
  | { type: "link"; label: string; href: string }
  | { type: "tag"; value: string }
  | { type: "credits"; role: string; name: string };

export interface PortfolioLink {
  type: "soundcloud" | "instagram" | "external";
  href: string;
  label?: string;
}

export interface PortfolioItem {
  url: string;
  title: string;
  type?: "image" | "video";
  link?: string;
  sound?: SoundConfig;
  meta?: MediaMeta[];
  links?: PortfolioLink[];
}

const ITEMS: PortfolioItem[] = [
  {
    url: "/images/portfolio/gradient_gem.jpeg",
    title: "3D Licht Studie",
    meta: [
      {
        type: "text",
        label: "Lichter",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/images/portfolio/face_study.jpeg",
    title: "3D Gesicht Studie 1/2",
    meta: [
      {
        type: "text",
        label: "Topologie von Gesichtern",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/videos/portfolio/face-emotions-study.mp4",
    title: "3D Gesicht Studie 2/2",
    type: "video",
    meta: [
      {
        type: "text",
        label: "Animation von Gesichtern",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/videos/portfolio/lego-gravity-field.mp4",
    title: "3D Physics Studie",
    type: "video",
    meta: [
      {
        type: "text",
        label: "RigidBody Forces",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/images/portfolio/first_character.jpeg",
    title: "3D Körper Studie",
    meta: [
      {
        type: "text",
        label: "Modeling/Rigging von Menschen",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/images/portfolio/fluffy_bear.jpeg",
    title: "3D Haare Studie",
    meta: [
      {
        type: "text",
        label: "Haarsimulation",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/videos/portfolio/what-the-figma.mp4",
    title: "Wie zum Figma",
    type: "video",
    meta: [
      {
        type: "text",
        label: "Wie zum Figma",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/images/portfolio/toon_character.jpeg",
    title: "3D Low Poly Character",
    meta: [
      {
        type: "text",
        label: "Low Poly / toon shading",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/images/portfolio/tinyplanet_skateboard.jpeg",
    title: "Tiny Planet",
    meta: [
      {
        type: "text",
        label: "tiny planet",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender\nFigma" },
    ],
  },
  {
    url: "/images/portfolio/skateboard_stickers.jpeg",
    title: "Skateboard Stickers",
    meta: [
      {
        type: "text",
        label: "Sticker Decals",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender\nFigma" },
    ],
  },
  {
    url: "/videos/portfolio/beer-books.mp4",
    title: "3D Grease Pencil Studie",
    type: "video",
    meta: [
      {
        type: "text",
        label: "Grease Pencil",
        value: "",
      },
      {
        type: "text",
        label: "3D Studie",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },

  {
    url: "/videos/portfolio/peace-of-mind-roses-explo.mp4",
    title: "Peace & Roses",
    type: "video",
    meta: [
      {
        type: "text",
        label: "Peace & Roses",
        value: "2026",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },

  {
    url: "/images/portfolio/peace_of_mind_logos.jpeg",
    title: "Peace of Mind Logos",
    meta: [
      {
        type: "text",
        label: "Peace of mind logos",
        value: "2023 — 2025",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/peaceofmind-clothing.jpeg",
    title: "Peace of Mind Prints",
    meta: [
      {
        type: "text",
        label: "Peace of mind prints",
        value: "2023 — 2025",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/peace_of_mind_orange.jpeg",
    title: "Starve the ego",
    meta: [
      {
        type: "text",
        label: "Starve the Ego — feed the soul",
        value: "2024",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/peace_of_mind_red.jpeg",
    title: "Shirt Prints",
    meta: [
      {
        type: "text",
        label: "Print Ideen",
        value: "2024",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/noisy_wallpaper.jpeg",
    title: "Noise & Peace",
    meta: [
      {
        type: "text",
        label: "Noise & Peace",
        value: "2025",
      },
      { type: "text", label: "Tools", value: "Blender" },
    ],
  },
  {
    url: "/images/portfolio/hsd-dingeundinge.jpeg",
    title: "Dinge/Undinge",
    meta: [
      {
        type: "text",
        label: "Hochschule Düsseldorf Eignungsprüfung",
        value: "",
      },
      {
        type: "text",
        label: "Dinge / Undinge",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Figma Photoshop" },
    ],
  },
  {
    url: "/images/portfolio/bubbles-cover.jpeg",
    title: "bubbles brand",
    meta: [
      {
        type: "text",
        label: "bubbles (brand)",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/bubbles-detail.jpeg",
    title: "bubbles app",
    meta: [
      {
        type: "text",
        label: "bubbles (ui)",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/dingsda.jpeg",
    title: "dingsda app",
    meta: [
      {
        type: "text",
        label: "dingsda quiz (ui)",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },
  {
    url: "/images/portfolio/fetzclub.jpeg",
    title: "fetzclub app",
    meta: [
      {
        type: "text",
        label: "fetzclub app (ui)",
        value: "2023",
      },
      { type: "text", label: "Tools", value: "Figma" },
    ],
  },

  {
    url: "/images/portfolio/hassliebe_cover.jpeg",
    title: "hassliebe",
    meta: [
      { type: "text", label: "Hassliebe", value: "2024" },
      { type: "text", label: "Sound Design", value: "Auxy Studio" },
      {
        type: "text",
        label: "Cover Design",
        value: "Blender\nFigma\nPhotoshop",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/hassliebe",
      },
    ],
  },
  {
    url: "/images/portfolio/hassliebe-fast-version-cover.jpeg",
    title: "hassliebe (fast version)",
    meta: [
      { type: "text", label: "Hassliebe (fast version)", value: "2025" },
      { type: "text", label: "Sound Design", value: "Auxy Studio" },
      {
        type: "text",
        label: "Cover Design",
        value: "Blender\nFigma\nPhotoshop",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/hassliebe-fast-version",
      },
    ],
  },
  {
    url: "/images/portfolio/hassliebe-slowie-cover.jpeg",
    title: "hassliebe (slowie version)",
    meta: [
      { type: "text", label: "Hassliebe (slowie version)", value: "2025" },
      { type: "text", label: "Sound Design", value: "Auxy Studio" },
      {
        type: "text",
        label: "Cover Design",
        value: "Blender\nFigma\nPhotoshop",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/hassliebe-slowie-version",
      },
    ],
  },
  {
    url: "/images/portfolio/soundcloud-cover.jpeg",
    title: "Mixes",
    meta: [
      { type: "text", label: "Techno Mixes", value: "2023 — 2024" },
      { type: "text", label: "Mixing", value: "rekordbox" },
      {
        type: "text",
        label: "Cover Design",
        value: "Figma\niphone 12",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/sets/mixes-23-24",
      },
    ],
  },
  {
    url: "/images/portfolio/du-fehlst-cover.jpeg",
    title: "du fehlst",
    meta: [
      { type: "text", label: "du fehlst", value: "2025" },
      { type: "text", label: "Sound Design", value: "Auxy Studio" },
      {
        type: "text",
        label: "Cover Design",
        value: "iphone 12\nPhotoshop",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/du-fehlst",
      },
    ],
  },
  {
    url: "/images/portfolio/soundcheck-cover.jpeg",
    title: "Soundchecks",
    meta: [
      { type: "text", label: "Soundchecks", value: "2025" },
      { type: "text", label: "Mixing", value: "rekordbox" },
      {
        type: "text",
        label: "Cover Design",
        value: "Blender\nFigma\niphone 12",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/sets/soundchecks",
      },
    ],
  },
  {
    url: "/images/portfolio/warum_cover.jpeg",
    title: "warum",
    meta: [
      { type: "text", label: "warum", value: "2025" },
      { type: "text", label: "Sound Design", value: "Auxy Studio" },
      {
        type: "text",
        label: "Cover Design",
        value: "Blender\nFigma\nPhotoshop",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/warum",
      },
    ],
  },
  {
    url: "/images/portfolio/warum_v2.jpeg",
    title: "warum (edit)",
    meta: [
      { type: "text", label: "warum (edit)", value: "2026" },
      { type: "text", label: "Sound Design", value: "Auxy Studio" },
      {
        type: "text",
        label: "Cover Design",
        value: "Blender\nFigma\nPhotoshop",
      },
    ],
    links: [
      {
        type: "soundcloud",
        href: "https://soundcloud.com/captainlowie/warum-edit",
      },
    ],
  },
];

// Configuration
const CONFIG = {
  low: { cullingDistance: 30, maxTextureSize: 1024 / 2, videoPlayDistance: 10 },
  high: {
    cullingDistance: 40,
    maxTextureSize: 1024,
    videoPlayDistance: 10,
  },
};

extend({ RoundedPlaneGeometry: geometry.RoundedPlaneGeometry });

function compressTexture(texture: THREE.Texture, maxSize: number) {
  const img = texture.image;
  if (!img || img.width <= maxSize) return texture;

  const canvas = document.createElement("canvas");
  const scale = maxSize / Math.max(img.width, img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    texture.image = canvas;
    texture.needsUpdate = true;
  }

  return texture;
}

function getMediaScale(width: number, height: number): [number, number] {
  const max = 8;
  const factor = max / Math.max(width, height);
  return [width * factor, height * factor];
}

const DEFAULT_MEDIA_SCALE: [number, number] = [8, 8];
const PORTFOLIO_OVERLAY_SIDE_GAP = 2;
const PORTFOLIO_OVERLAY_DESKTOP_TOP_INSET = 2;
const PORTFOLIO_OVERLAY_MOBILE_GAP = 1.5;
const PORTFOLIO_OVERLAY_DEPTH_TEST_OFFSET = -3.2;

const PortfolioMetaOverlay = ({
  item,
  isActive,
  mediaScale,
  depthOffset,
  distanceFactor,
}: {
  item: PortfolioItem;
  isActive: boolean;
  mediaScale: [number, number];
  depthOffset: number;
  distanceFactor: number;
}) => {
  const { messages } = useI18n();
  const { isMobile } = useAppStore();
  const overlayOffsetX = isMobile
    ? 0
    : mediaScale[0] / 2 + PORTFOLIO_OVERLAY_SIDE_GAP;
  const overlayOffsetY = isMobile
    ? -(mediaScale[1] / 2 + PORTFOLIO_OVERLAY_MOBILE_GAP)
    : mediaScale[1] / 2 - PORTFOLIO_OVERLAY_DESKTOP_TOP_INSET;
  return (
    <Html
      transform
      position={[overlayOffsetX, overlayOffsetY, depthOffset]}
      style={{
        width: isMobile ? "18rem" : "20rem",
        maxWidth: "92vw",
        pointerEvents: isActive ? "auto" : "none",
      }}
      zIndexRange={[20, 0]}
      distanceFactor={distanceFactor}
    >
      <AnimatePresence mode="popLayout">
        {isActive && (
          <MetaWrapper
            initial={"initial"}
            animate={"animate"}
            exit={"exit"}
            variants={MotionVariants.OptionButton}
            key={item.title}
          >
            {item.meta?.map((m, i) => (
              <MetaRow key={i}>
                {"label" in m && <MetaLeft>{m.label}</MetaLeft>}
                {"value" in m && <MetaRight>{m.value}</MetaRight>}
              </MetaRow>
            ))}

            {item.links?.map((link, i) => (
              <PillLink key={i} href={link.href} target="_blank">
                {link.label ?? messages.ui.linkActions[link.type]}
                <ExternalLinkIcon />
              </PillLink>
            ))}
          </MetaWrapper>
        )}
      </AnimatePresence>
    </Html>
  );
};

function VideoPlane({
  url,
  distanceRef,
  cull,
  onClick,
  onScaleChange,
}: {
  url: string;
  distanceRef: React.MutableRefObject<number>;
  cull: CullConfig;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onScaleChange: (scale: [number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTex = useRef<THREE.VideoTexture | null>(null);
  const posterTex = useRef<THREE.Texture | null>(null);

  const scaleRef = useRef<[number, number]>(DEFAULT_MEDIA_SCALE);
  const readyRef = useRef(false);

  useEffect(() => {
    if (readyRef.current) return;

    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";

    const onCanPlay = () => {
      const w = video.videoWidth || 16;
      const h = video.videoHeight || 9;
      const scale = getMediaScale(w, h);
      scaleRef.current = scale;
      onScaleChange(scale);

      const vTex = new THREE.VideoTexture(video);
      vTex.colorSpace = THREE.SRGBColorSpace;
      vTex.minFilter = THREE.LinearFilter;
      vTex.magFilter = THREE.LinearFilter;
      videoTex.current = vTex;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      const pTex = new THREE.CanvasTexture(canvas);
      pTex.colorSpace = THREE.SRGBColorSpace;
      posterTex.current = pTex;

      videoRef.current = video;
      readyRef.current = true;
    };

    video.addEventListener("canplay", onCanPlay);
    video.load();

    return () => {
      video.pause();
      video.src = "";
      video.load();
      videoTex.current?.dispose();
      posterTex.current?.dispose();
    };
  }, [onScaleChange, url]);

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return;

    const d = distanceRef.current;

    let targetOpacity = 1;
    if (d > cull.cullingDistance) {
      targetOpacity = 0;
    } else if (d > cull.fadeStart) {
      targetOpacity =
        1 - (d - cull.fadeStart) / (cull.cullingDistance - cull.fadeStart);
    }

    targetOpacity = Math.max(0, Math.min(1, targetOpacity));

    matRef.current.opacity = THREE.MathUtils.lerp(
      matRef.current.opacity,
      targetOpacity,
      delta * 20,
    );

    meshRef.current.visible = matRef.current.opacity > 0.01;

    if (!readyRef.current) return;

    meshRef.current.scale.set(scaleRef.current[0], scaleRef.current[1], 1);

    if (d < cull.videoPlayDistance) {
      if (matRef.current.map !== videoTex.current) {
        matRef.current.map = videoTex.current!;
        matRef.current.needsUpdate = true;
      }
      videoRef.current?.play().catch(() => {});
    } else {
      if (matRef.current.map !== posterTex.current) {
        matRef.current.map = posterTex.current!;
        matRef.current.needsUpdate = true;
      }
      videoRef.current?.pause();
    }
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
      {/* @ts-ignore */}
      <roundedPlaneGeometry args={[1, 1, 0.05, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color="#ffffff"
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

const textureCache = new Map<string, THREE.Texture>();

function ImagePlane({
  url,
  distanceRef,
  cull,
  onClick,
  onScaleChange,
}: {
  url: string;
  distanceRef: React.MutableRefObject<number>;
  cull: CullConfig;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onScaleChange: (scale: [number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const texRef = useRef<THREE.Texture | null>(null);
  const scaleRef = useRef<[number, number]>(DEFAULT_MEDIA_SCALE);
  const { isMobile } = useAppStore();
  const renderConfig = isMobile ? CONFIG.low : CONFIG.high;

  useEffect(() => {
    if (textureCache.has(url)) {
      const t = textureCache.get(url)!;
      texRef.current = t;
      const scale = getMediaScale(t.image.width, t.image.height);
      scaleRef.current = scale;
      onScaleChange(scale);
      return;
    }

    new THREE.TextureLoader().load(url, (t) => {
      compressTexture(t, renderConfig.maxTextureSize);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      textureCache.set(url, t);
      texRef.current = t;
      const scale = getMediaScale(t.image.width, t.image.height);
      scaleRef.current = scale;
      onScaleChange(scale);
    });
  }, [onScaleChange, renderConfig.maxTextureSize, url]);

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return;

    const d = distanceRef.current;

    let targetOpacity = 1;
    if (d > cull.fadeStart) {
      targetOpacity =
        1 - (d - cull.fadeStart) / (cull.cullingDistance - cull.fadeStart);
    }
    targetOpacity = Math.max(0, Math.min(1, targetOpacity));

    matRef.current.opacity = THREE.MathUtils.lerp(
      matRef.current.opacity,
      targetOpacity,
      delta * 20,
    );

    meshRef.current.visible = matRef.current.opacity > 0.01;

    if (texRef.current && matRef.current.map !== texRef.current) {
      matRef.current.map = texRef.current;
      matRef.current.needsUpdate = true;
      meshRef.current.scale.set(scaleRef.current[0], scaleRef.current[1], 1);
    }
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
      {/* @ts-ignore */}
      <roundedPlaneGeometry args={[1, 1, 0.05, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color="#ffffff"
        transparent
        opacity={0} // Start at 0, fade in
        toneMapped={false}
      />
    </mesh>
  );
}

function MediaItem({
  item,
  position,
}: {
  item: PortfolioItem;
  position: THREE.Vector3;
  index: number;
}) {
  const { url, title, type } = item;
  const { camera } = useThree();

  const { setHoveredObject } = useFloatingBar();
  const { focusOnTarget, focusOnImage, focusedImageTitle } = useViewStore();
  const { triggerQuest } = useQuestSystem();
  const { isMobile } = useAppStore();

  const isFocused = focusedImageTitle === item.title;
  const viewMode: ViewCullMode = focusedImageTitle ? "focused" : "default";
  const setHovering = useCursorStore.getState().setHoveringClickable;
  const setPointerDown = useCursorStore.getState().setPointerDown;

  const isVideo =
    type === "video" || url.endsWith(".mp4") || url.endsWith(".webm");
  const [overlayDepthOffset, setOverlayDepthOffset] = useState(-0.5);
  const [overlayDistanceFactor, setOverlayDistanceFactor] = useState(
    isMobile ? 10 : 8,
  );
  const overlayDepthRef = useRef(overlayDepthOffset);
  const overlayDistanceFactorRef = useRef(overlayDistanceFactor);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (distanceRef.current > cull.cullingDistance) return;

    if (focusedImageTitle !== title) {
      focusOnTarget({ position, distance: 8 });
      focusOnImage(title);
      triggerQuest("click_portfolio_item");
      playUISound();
    }
  };

  const distanceRef = useRef(Infinity);
  const [mediaScale, setMediaScale] =
    useState<[number, number]>(DEFAULT_MEDIA_SCALE);

  useFrame(() => {
    const liveDistance = camera.position.distanceTo(position);
    distanceRef.current = liveDistance;

    if (!isFocused) return;

    const nextDepthOffset = -Math.min(
      8.5,
      Math.max(
        mediaScale[0] * 0.45,
        liveDistance * 0.25 + Math.abs(PORTFOLIO_OVERLAY_DEPTH_TEST_OFFSET),
      ),
    );
    const nextDistanceFactor = Math.max(
      isMobile ? 6.5 : 5.5,
      liveDistance * 0.55,
    );

    if (Math.abs(nextDepthOffset - overlayDepthRef.current) > 0.05) {
      overlayDepthRef.current = nextDepthOffset;
      setOverlayDepthOffset(nextDepthOffset);
    }

    if (Math.abs(nextDistanceFactor - overlayDistanceFactorRef.current) > 0.1) {
      overlayDistanceFactorRef.current = nextDistanceFactor;
      setOverlayDistanceFactor(nextDistanceFactor);
    }
  });

  const cull = resolveCullConfig({
    isMobile,
    viewMode,
    isFocusedItem: isFocused,
  });

  return (
    <Billboard
      position={position}
      onPointerEnter={(e) => {
        if (distanceRef.current > cull.cullingDistance) return;

        e.stopPropagation();
        setHoveredObject({ title });
        if (!isFocused) setHovering(true);
      }}
      onPointerLeave={() => {
        setHoveredObject(null);
        setHovering(false);
        setPointerDown(false);
      }}
      onPointerDown={(e) => {
        setPointerDown(true);
      }}
      onPointerUp={() => setPointerDown(false)}
    >
      {isVideo ? (
        <VideoPlane
          url={url}
          onClick={handleClick}
          distanceRef={distanceRef}
          cull={cull}
          onScaleChange={setMediaScale}
        />
      ) : (
        <ImagePlane
          url={url}
          onClick={handleClick}
          distanceRef={distanceRef}
          cull={cull}
          onScaleChange={setMediaScale}
        />
      )}

      <PortfolioMetaOverlay
        isActive={isFocused}
        item={item}
        mediaScale={mediaScale}
        depthOffset={overlayDepthOffset}
        distanceFactor={overlayDistanceFactor}
      />
    </Billboard>
  );
}

export type OrbitForm = "EQUATORIAL_RING";
// | "FIBONACCI_SPHERE"
// | "LOGARITHMIC_SPIRAL"
// | "GALAXY_WAVES";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function getSphericalAngles({
  index,
  count,
  form,
  radius,
}: {
  index: number;
  count: number;
  form: OrbitForm;
  radius: number;
}): { r: number; phi: number; theta: number } {
  switch (form) {
    // case "FIBONACCI_SPHERE": {
    //   const t = (index + 0.5) / count;
    //   const y = 1 - 2 * t;
    //   const power = 1;
    //   const squash = Math.sign(y) * Math.pow(Math.abs(y), power);
    //   const phi = Math.acos(squash);
    //   return { r: radius, phi: phi, theta: index * GOLDEN_ANGLE };
    // }

    case "EQUATORIAL_RING": {
      const phi = Math.PI / 2;
      const theta = (index / count) * 2 * Math.PI;
      return { r: radius, phi, theta };
    }

    // case "LOGARITHMIC_SPIRAL": {
    //   const t = index / (count - 1);
    //   const turns = 1;
    //   const height = radius * 5;
    //   const theta = 2 * Math.PI * turns * t;
    //   const x = radius * Math.cos(theta);
    //   const z = (radius * Math.sin(theta) * Math.PI) / 2;
    //   const y = height * (t - 0.5);
    //   return { r: x, phi: y, theta: z };
    // }

    // case "GALAXY_WAVES": {
    //   const currentRadius = Math.sqrt(index + 1) * (radius / 2);
    //   const y = (1 - (index / (count - 1)) * 2) * (currentRadius * 0.5);
    //   const r = Math.sqrt(Math.max(0, currentRadius * currentRadius - y * y));
    //   const theta = GOLDEN_ANGLE * index;
    //   return {
    //     r: Math.cos(theta) * r,
    //     phi: Math.sin(theta) * y,
    //     theta: Math.sin(theta) * r,
    //   };
    // }
  }
}

export function FileOrbit({ radius = 60 }: { radius?: number }) {
  const { selectedOrbitForm: orbitForm } = useCoreStore();
  const { isMobile } = useAppStore();

  // const effectiveRadius = isMobile ? radius * 0.8 : radius;
  const effectiveRadius = radius;

  const spherical = new THREE.Spherical();
  const n = ITEMS.length;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 1; i < n + 1; i++) {
      const { phi, theta, r } = getSphericalAngles({
        index: i,
        count: n,
        form: orbitForm,
        radius: effectiveRadius,
      });

      // if (orbitForm === "GALAXY_WAVES" || orbitForm === "LOGARITHMIC_SPIRAL")
      //   pts.push(new THREE.Vector3(r, phi, theta));
      // else
      pts.push(
        new THREE.Vector3().setFromSpherical(spherical.set(r, phi, theta)),
      );
    }
    return pts;
  }, [effectiveRadius, orbitForm]);

  return (
    <group>
      {points.map((pos, i) => (
        <MediaItem
          key={ITEMS[i].url}
          position={pos}
          item={ITEMS[i]}
          index={i}
        />
      ))}
    </group>
  );
}

export const MetaWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: flex-start;
  pointer-events: auto;
  background-color: rgba(14, 14, 14, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: white;

  padding: 1.5rem 2rem;
  border-radius: 2.5rem;
  width: 100%;
  max-width: 22.5rem;
`;

export const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  align-items: start;
  width: 100%;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 500;
  text-transform: uppercase;

  > * {
    margin: 0;
  }
`;

export const MetaLeft = styled.p`
  text-align: left;
  line-height: 1.25;
  white-space: pre-wrap;
`;

export const MetaRight = styled(MetaLeft)`
  text-align: right;
  justify-self: end;
  margin-left: 0;
`;

export const PillLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;

  padding: 12px 32px;
  width: 100%;
  min-width: 0;

  border-radius: 9999px;

  font-weight: 600;
  font-family: "Open Sauce Two";
  font-size: 1rem;
  color: #ffffff;
  text-decoration: none;
  text-align: center;
  white-space: nowrap;

  background: linear-gradient(180deg, #f87903 0%, #c56308 100%);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 -1px 1px rgba(0, 0, 0, 0.15);

  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: linear-gradient(180deg, #ff9f38 0%, #e66610 100%);

    color: white;
  }
`;

const ExternalLinkIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 6L14 2M14 2H10M14 2L8.66667 7.33333M6.66667 3.33333H5.2C4.0799 3.33333 3.51984 3.33333 3.09202 3.55132C2.71569 3.74307 2.40973 4.04903 2.21799 4.42535C2 4.85318 2 5.41323 2 6.53333V10.8C2 11.9201 2 12.4802 2.21799 12.908C2.40973 13.2843 2.71569 13.5903 3.09202 13.782C3.51984 14 4.0799 14 5.2 14H9.46667C10.5868 14 11.1468 14 11.5746 13.782C11.951 13.5903 12.2569 13.2843 12.4487 12.908C12.6667 12.4802 12.6667 11.9201 12.6667 10.8V9.33333"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
