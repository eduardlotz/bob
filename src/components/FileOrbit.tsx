import * as THREE from "three";
import { useMemo, Suspense, useState, useRef, useEffect } from "react";
import {
  Billboard,
  Float,
  Image,
  useTexture,
  useVideoTexture,
} from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useCoreStore, useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { geometry } from "maath";

interface PortfolioItem {
  url: string;
  title: string;
  type?: "image" | "video";
  link?: string;
  sound?: SoundConfig;
}

const ITEMS: PortfolioItem[] = [
  {
    url: "/images/portfolio/face_study.jpeg",
    title: "3D Gesicht Studie 1/2",
  },
  {
    url: "/images/portfolio/gradient_gem.jpeg",
    title: "3D Licht Studie",
  },
  {
    url: "/videos/portfolio/face-emotions-study.mp4",
    title: "3D Gesicht Studie 2/2",
    type: "video",
  },
  {
    url: "/images/portfolio/bubbles-cover.jpeg",
    title: "bubbles",
  },
  {
    url: "/images/portfolio/du-fehlst-cover.jpeg",
    title: "du fehlst",
  },
  {
    url: "/images/portfolio/hassliebe-slowie-cover.jpeg",
    title: "hassliebe (slowie version)",
  },
  {
    url: "/images/portfolio/hsd-dingeundinge.jpeg",
    title: "Dinge/Undinge",
  },
  {
    url: "/images/portfolio/peaceofmind-clothing.jpeg",
    title: "Peace of Mind Prints",
  },
  {
    url: "/videos/portfolio/lego-gravity-field.mp4",
    title: "3D Physics Studie",
    type: "video",
  },
  {
    url: "/images/portfolio/soundcheck-cover.jpeg",
    title: "Soundchecks",
  },
  {
    url: "/images/portfolio/soundcloud-cover.jpeg",
    title: "Mixes",
  },
  {
    url: "/images/portfolio/hassliebe-fast-version-cover.jpeg",
    title: "hassliebe (fast version)",
  },
  {
    url: "/videos/portfolio/peace-of-mind-roses-explo.mp4",
    title: "Peace & Roses",
    type: "video",
  },
  {
    url: "/images/portfolio/hassliebe_cover.jpeg",
    title: "hassliebe",
  },
  {
    url: "/images/portfolio/first_character.jpeg",
    title: "3D Körper Studie",
  },
  { url: "/images/portfolio/fluffy_bear.jpeg", title: "3D Haare Studie" },
  {
    url: "/images/portfolio/peace_of_mind_red.jpeg",
    title: "Shirt Prints",
  },
  {
    url: "/images/portfolio/noisy_wallpaper.jpeg",
    title: "Noise & Peace",
  },
  {
    url: "/images/portfolio/peace_of_mind_orange.jpeg",
    title: "Starve the ego",
  },
  {
    url: "/videos/portfolio/what-the-figma.mp4",
    title: "Wie zum Figma",
    type: "video",
  },
  {
    url: "/images/portfolio/toon_character.jpeg",
    title: "3D Low Poly Character",
  },
  {
    url: "/images/portfolio/peace_of_mind_logos.jpeg",
    title: "Peace of Mind Variants",
  },
  {
    url: "/images/portfolio/warum_cover.jpeg",
    title: "warum",
  },
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
    url: "/images/portfolio/tinyplanet_skateboard.jpeg",
    title: "Tiny Planet",
  },
  {
    url: "/images/portfolio/warum_v2.jpeg",
    title: "warum (edit)",
  },
];

interface MediaItemProps {
  item: PortfolioItem;
  position: THREE.Vector3;
}

// Configuration
const CONFIG = {
  cullingDistance: 50,
  maxTextureSize: 1024,
  videoPlayDistance: 30,
};

extend({ RoundedPlaneGeometry: geometry.RoundedPlaneGeometry });

// Texture compression utility
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

// Lazy loading video component
function VideoPlane({
  url,
  shouldLoad,
  shouldPlay,
  onClick,
}: {
  url: string;
  shouldLoad: boolean;
  shouldPlay: boolean;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>("");

  useEffect(() => {
    if (shouldLoad && !loaded) {
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      const onMetadata = () => {
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        textureRef.current = texture;
        videoRef.current = video;

        // Generate poster frame
        video.currentTime = 0.1;
      };

      const onSeeked = () => {
        // Create canvas for poster
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          setPosterUrl(canvas.toDataURL());
        }
        setLoaded(true);
      };

      video.addEventListener("loadedmetadata", onMetadata);
      video.addEventListener("seeked", onSeeked);
      video.load();

      return () => {
        video.removeEventListener("loadedmetadata", onMetadata);
        video.removeEventListener("seeked", onSeeked);
        video.pause();
        video.src = "";
        video.load();
        if (textureRef.current) {
          textureRef.current.dispose();
        }
      };
    }
  }, [shouldLoad, loaded, url]);

  useEffect(() => {
    if (videoRef.current && textureRef.current) {
      if (shouldPlay) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0.1;
      }
      textureRef.current.needsUpdate = true;
    }
  }, [shouldPlay]);

  const scale = useMemo(() => {
    if (loaded && videoRef.current) {
      return getMediaScale(
        videoRef.current.videoWidth || 16,
        videoRef.current.videoHeight || 9
      );
    }
    return [8, 8];
  }, [loaded]);

  if (!loaded) {
    return (
      <mesh onClick={onClick}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#222" />
      </mesh>
    );
  }

  // Show poster when not playing
  if (!shouldPlay && posterUrl) {
    return (
      <mesh scale={[scale[0], scale[1], 1]} onClick={onClick}>
        {/* @ts-ignore */}
        <roundedPlaneGeometry args={[1, 1, 0.05, 6]} />
        <meshBasicMaterial>
          <primitive
            attach="map"
            object={new THREE.TextureLoader().load(posterUrl)}
          />
        </meshBasicMaterial>
      </mesh>
    );
  }

  return (
    <mesh scale={[scale[0], scale[1], 1]} onClick={onClick}>
      {/* @ts-ignore */}
      <roundedPlaneGeometry args={[1, 1, 0.05, 6]} />
      <meshBasicMaterial map={textureRef.current} toneMapped={false} />
    </mesh>
  );
}

// Texture cache to prevent reloading
const textureCache = new Map<string, THREE.Texture>();

// Lazy loading image component
function ImagePlane({
  url,
  shouldLoad,
  onClick,
}: {
  url: string;
  shouldLoad: boolean;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const textureRef = useRef<THREE.Texture | null>(null);

  const scale = useMemo(() => {
    if (loaded && textureRef.current) {
      const { width, height } = textureRef.current.image;
      return getMediaScale(width, height);
    }
    return [8, 8];
  }, [loaded]);

  useEffect(() => {
    if (shouldLoad && !loaded) {
      // Check cache first
      if (textureCache.has(url)) {
        textureRef.current = textureCache.get(url)!;
        setLoaded(true);
        return;
      }

      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          compressTexture(texture, CONFIG.maxTextureSize);
          texture.colorSpace = THREE.SRGBColorSpace;
          textureRef.current = texture;
          textureCache.set(url, texture);
          setLoaded(true);
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", url, error);
        }
      );
    }
  }, [shouldLoad, loaded, url]);

  if (!loaded || !textureRef.current) {
    return (
      <mesh onClick={onClick}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#333" />
      </mesh>
    );
  }

  return (
    <Image
      texture={textureRef.current}
      transparent
      scale={scale[0]}
      onClick={onClick}
      radius={0.15}
    />
  );
}

function MediaItem({
  item,
  position,
  index,
}: {
  item: PortfolioItem;
  position: THREE.Vector3;
  index: number;
}) {
  const { url, title, type } = item;
  const { camera } = useThree();
  const [distance, setDistance] = useState(Infinity);

  const { setHoveredObject } = useFloatingBar();
  const { focusOnTarget, focusOnImage, focusedImageTitle } = useViewStore();
  const { triggerQuest } = useQuestSystem();

  const currentlyActive = focusedImageTitle === title;
  const setHovering = useCursorStore.getState().setHoveringClickable;
  const setPointerDown = useCursorStore.getState().setPointerDown;

  const isVideo =
    type === "video" || url.endsWith(".mp4") || url.endsWith(".webm");

  // Calculate distance every frame
  useFrame(() => {
    const dist = camera.position.distanceTo(position);
    setDistance(dist);
  });

  const shouldLoad = distance < CONFIG.cullingDistance || currentlyActive;
  const shouldPlay = isVideo && distance < CONFIG.videoPlayDistance;

  const handleClick = () => {
    if (focusedImageTitle !== title) {
      focusOnTarget({ position, distance: 8 });
      focusOnImage(title);
    }
  };

  // Don't render if too far
  if (distance > CONFIG.cullingDistance + 20 && !currentlyActive) {
    return null;
  }

  return (
    <Billboard
      position={position}
      onPointerEnter={() => {
        setHoveredObject({ title });
        if (!currentlyActive) setHovering(true);
      }}
      onPointerLeave={() => {
        setHoveredObject(null);
        setHovering(false);
        setPointerDown(false);
      }}
      onPointerDown={() => {
        setPointerDown(true);
        if (!currentlyActive) {
          triggerQuest("click_creative_image");
          playUISound();
        }
      }}
      onPointerUp={() => setPointerDown(false)}
    >
      {isVideo ? (
        <VideoPlane
          url={url}
          shouldLoad={shouldLoad}
          shouldPlay={shouldPlay}
          onClick={handleClick}
        />
      ) : (
        <ImagePlane url={url} shouldLoad={shouldLoad} onClick={handleClick} />
      )}
    </Billboard>
  );
}

export type OrbitForm =
  | "EQUATORIAL_RING"
  | "LOGARITHMIC_SPIRAL"
  | "FIBONACCI_SPHERE"
  | "GALAXY_WAVES";

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
    case "FIBONACCI_SPHERE": {
      const t = (index + 0.5) / count;
      const y = 1 - 2 * t;
      const power = 1;
      const squash = Math.sign(y) * Math.pow(Math.abs(y), power);
      const phi = Math.acos(squash);
      return { r: radius, phi: phi, theta: index * GOLDEN_ANGLE };
    }

    case "EQUATORIAL_RING": {
      const tweak = 0;
      return {
        r: radius,
        phi: Math.PI / 2 + tweak * Math.log(index + 1),
        theta: index * GOLDEN_ANGLE,
      };
    }

    case "LOGARITHMIC_SPIRAL": {
      const t = index / (count - 1);
      const turns = 1;
      const height = radius * 5;
      const theta = 2 * Math.PI * turns * t;
      const x = radius * Math.cos(theta);
      const z = (radius * Math.sin(theta) * Math.PI) / 2;
      const y = height * (t - 0.5);
      return { r: x, phi: y, theta: z };
    }

    case "GALAXY_WAVES": {
      const currentRadius = Math.sqrt(index + 1) * (radius / 2);
      const y = (1 - (index / (count - 1)) * 2) * (currentRadius * 0.5);
      const r = Math.sqrt(Math.max(0, currentRadius * currentRadius - y * y));
      const theta = GOLDEN_ANGLE * index;
      return {
        r: Math.cos(theta) * r,
        phi: Math.sin(theta) * y,
        theta: Math.sin(theta) * r,
      };
    }
  }
}

export function FileOrbit({ radius = 40 }: { radius?: number }) {
  const { selectedOrbitForm: orbitForm } = useCoreStore();
  const spherical = new THREE.Spherical();
  const n = ITEMS.length;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 1; i < n + 1; i++) {
      const { phi, theta, r } = getSphericalAngles({
        index: i,
        count: n,
        form: orbitForm,
        radius,
      });

      if (orbitForm === "GALAXY_WAVES" || orbitForm === "LOGARITHMIC_SPIRAL")
        pts.push(new THREE.Vector3(r, phi, theta));
      else
        pts.push(
          new THREE.Vector3().setFromSpherical(spherical.set(r, phi, theta))
        );
    }
    return pts;
  }, [radius, orbitForm]);

  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
