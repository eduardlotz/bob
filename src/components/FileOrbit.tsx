import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { Billboard } from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useAppStore, useCoreStore, useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { extend, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { geometry } from "maath";

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

  const reduced = base.cullingDistance * (isMobile ? 0.5 : 0.75);

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

export interface PortfolioItem {
  url: string;
  title: string;
  type?: "image" | "video";
  link?: string;
  sound?: SoundConfig;
  meta?: MediaMeta[];
}

const ITEMS: PortfolioItem[] = [
  { url: "/images/portfolio/gradient_gem.jpeg", title: "3D Licht Studie" },
  {
    url: "/images/portfolio/face_study.jpeg",
    title: "3D Gesicht Studie 1/2",
    meta: [
      { type: "text", label: "Year", value: "2024" },
      { type: "tag", value: "Blender" },
      { type: "tag", value: "Lighting Study" },
      { type: "credits", role: "Artist", name: "Eddie" },
    ],
  },
  {
    url: "/videos/portfolio/face-emotions-study.mp4",
    title: "3D Gesicht Studie 2/2",
    type: "video",
  },
  {
    url: "/videos/portfolio/lego-gravity-field.mp4",
    title: "3D Physics Studie",
    type: "video",
  },
  { url: "/images/portfolio/first_character.jpeg", title: "3D Körper Studie" },
  { url: "/images/portfolio/fluffy_bear.jpeg", title: "3D Haare Studie" },
  {
    url: "/videos/portfolio/what-the-figma.mp4",
    title: "Wie zum Figma",
    type: "video",
  },
  {
    url: "/images/portfolio/toon_character.jpeg",
    title: "3D Low Poly Character",
  },
  { url: "/images/portfolio/tinyplanet_skateboard.jpeg", title: "Tiny Planet" },
  {
    url: "/images/portfolio/skateboard_stickers.jpeg",
    title: "Skateboard Stickers",
  },
  {
    url: "/videos/portfolio/beer-books.mp4",
    title: "3D Grease Pencil Studie",
    type: "video",
  },

  {
    url: "/videos/portfolio/peace-of-mind-roses-explo.mp4",
    title: "Peace & Roses",
    type: "video",
  },

  {
    url: "/images/portfolio/peace_of_mind_logos.jpeg",
    title: "Peace of Mind Variants",
  },
  {
    url: "/images/portfolio/peaceofmind-clothing.jpeg",
    title: "Peace of Mind Prints",
  },
  {
    url: "/images/portfolio/peace_of_mind_orange.jpeg",
    title: "Starve the ego",
  },
  { url: "/images/portfolio/peace_of_mind_red.jpeg", title: "Shirt Prints" },
  { url: "/images/portfolio/noisy_wallpaper.jpeg", title: "Noise & Peace" },
  { url: "/images/portfolio/hsd-dingeundinge.jpeg", title: "Dinge/Undinge" },
  { url: "/images/portfolio/bubbles-cover.jpeg", title: "bubbles brand" },
  { url: "/images/portfolio/bubbles-detail.jpeg", title: "bubbles app" },
  { url: "/images/portfolio/dingsda.jpeg", title: "dingsda app" },
  { url: "/images/portfolio/fetzclub.jpeg", title: "fetzclub app" },

  { url: "/images/portfolio/hassliebe_cover.jpeg", title: "hassliebe" },
  {
    url: "/images/portfolio/hassliebe-fast-version-cover.jpeg",
    title: "hassliebe (fast version)",
  },
  {
    url: "/images/portfolio/hassliebe-slowie-cover.jpeg",
    title: "hassliebe (slowie version)",
  },
  { url: "/images/portfolio/soundcloud-cover.jpeg", title: "Mixes" },
  { url: "/images/portfolio/du-fehlst-cover.jpeg", title: "du fehlst" },
  { url: "/images/portfolio/soundcheck-cover.jpeg", title: "Soundchecks" },
  { url: "/images/portfolio/warum_cover.jpeg", title: "warum" },
  { url: "/images/portfolio/warum_v2.jpeg", title: "warum (edit)" },
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

function VideoPlane({
  url,
  distanceRef,
  cull,
  onClick,
}: {
  url: string;
  distanceRef: React.MutableRefObject<number>;
  cull: CullConfig;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTex = useRef<THREE.VideoTexture | null>(null);
  const posterTex = useRef<THREE.Texture | null>(null);

  const scaleRef = useRef<[number, number]>([8, 8]);
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
      scaleRef.current = getMediaScale(w, h);

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
  }, [url]);

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
}: {
  url: string;
  distanceRef: React.MutableRefObject<number>;
  cull: CullConfig;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const texRef = useRef<THREE.Texture | null>(null);
  const scaleRef = useRef<[number, number]>([8, 8]);
  const { isMobile } = useAppStore();
  const renderConfig = isMobile ? CONFIG.low : CONFIG.high;

  useEffect(() => {
    if (textureCache.has(url)) {
      const t = textureCache.get(url)!;
      texRef.current = t;
      scaleRef.current = getMediaScale(t.image.width, t.image.height);
      return;
    }

    new THREE.TextureLoader().load(url, (t) => {
      compressTexture(t, renderConfig.maxTextureSize);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      textureCache.set(url, t);
      texRef.current = t;
      scaleRef.current = getMediaScale(t.image.width, t.image.height);
    });
  }, [url]);

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

  useFrame(() => {
    distanceRef.current = camera.position.distanceTo(position);
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
        />
      ) : (
        <ImagePlane
          url={url}
          onClick={handleClick}
          distanceRef={distanceRef}
          cull={cull}
        />
      )}
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
