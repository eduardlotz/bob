import * as THREE from "three";
import { useMemo, useEffect, useRef, useState } from "react";
import { Billboard, Float } from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useAppStore, useCoreStore, useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { useFrame, useThree } from "@react-three/fiber";

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
    title: "Bubbles",
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

const useMediaScale = (width: number, height: number): [number, number] => {
  return useMemo(() => {
    const max = 8;
    const factor = max / Math.max(width, height);
    return [width * factor, height * factor];
  }, [width, height]);
};

function VideoPlaneWithDisposal({
  url,
  onClick,
  currentlyActive,
  shouldLoad,
}: {
  url: string;
  onClick: () => void;
  currentlyActive: boolean;
  shouldLoad: boolean;
}) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const [scale, setScale] = useState<[number, number]>([1, 1]);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!shouldLoad) {
      // Dispose texture and video when out of range
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
        videoRef.current = null;
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
        setTexture(null);
      }
      return;
    }

    // Load video texture when in range
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.addEventListener("loadedmetadata", () => {
      const { videoWidth, videoHeight } = video;
      const max = 8;
      const factor = max / Math.max(videoWidth, videoHeight);
      setScale([videoWidth * factor, videoHeight * factor]);
    });

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    videoRef.current = video;
    textureRef.current = videoTexture;
    setTexture(videoTexture);

    if (currentlyActive) {
      video.play();
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [url, shouldLoad]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (!currentlyActive) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [currentlyActive]);

  if (!texture) return null;

  return (
    <mesh scale={[scale[0], scale[1], 1]} onClick={onClick}>
      <planeGeometry />
      <meshBasicMaterial map={texture} toneMapped={false} transparent />
    </mesh>
  );
}

function ImagePlaneWithDisposal({
  url,
  onClick,
  shouldLoad,
}: {
  url: string;
  onClick: () => void;
  shouldLoad: boolean;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [scale, setScale] = useState<[number, number]>([1, 1]);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!shouldLoad) {
      // Dispose texture when out of range
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
        setTexture(null);
      }
      return;
    }

    // Load texture when in range
    const loader = new THREE.TextureLoader();
    loader.load(url, (loadedTexture) => {
      textureRef.current = loadedTexture;
      setTexture(loadedTexture);

      // Calculate scale inside the callback, not using hook
      const { width, height } = loadedTexture.image;
      const max = 8;
      const factor = max / Math.max(width, height);
      setScale([width * factor, height * factor]);
    });

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [url, shouldLoad]);

  if (!texture) return null;

  return (
    <mesh scale={[scale[0], scale[1], 1]} onClick={onClick}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

const LOW_RENDER_DISTANCE = 90;
const HIGH_RENDER_DISTANCE = 1000;

function MediaItem({ item, position }: MediaItemProps) {
  const { url, title, type } = item;

  const { setHoveredObject } = useFloatingBar();
  const { focusOnTarget, focusOnImage, focusedImageTitle } = useViewStore();
  const { triggerQuest } = useQuestSystem();
  const { graphicPreferences } = useCoreStore();
  const { isMobile } = useAppStore();

  const graphicMode = graphicPreferences.qualityMode;
  const RENDER_DISTANCE =
    isMobile || graphicMode === "low"
      ? LOW_RENDER_DISTANCE
      : HIGH_RENDER_DISTANCE;

  const [shouldLoad, setShouldLoad] = useState(false);

  const currentlyActive = focusedImageTitle === title;
  const setHovering = useCursorStore.getState().setHoveringClickable;
  const setPointerDown = useCursorStore.getState().setPointerDown;

  const isVideo =
    type === "video" || url.endsWith(".mp4") || url.endsWith(".webm");

  const handleClick = () => {
    if (focusedImageTitle !== title) {
      focusOnTarget({ position, distance: 8 });
      focusOnImage(title);
    }
  };

  if (isVideo && isMobile) return null;

  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ camera }) => {
    const obj = groupRef.current;
    if (!obj) return;

    const d = camera.position.distanceTo(obj.position);
    const inRange = d < RENDER_DISTANCE;

    // Update shouldLoad based on distance
    if (inRange !== shouldLoad) {
      setShouldLoad(inRange);
    }

    obj.visible = shouldLoad;
    obj.matrixAutoUpdate = inRange;
  });

  return (
    <group ref={groupRef} position={position}>
      <Billboard
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
            triggerQuest("click_portfolio_item");
            playUISound();
          }
        }}
        onPointerUp={() => setPointerDown(false)}
      >
        <Float floatIntensity={10} speed={0.5}>
          {isVideo ? (
            <VideoPlaneWithDisposal
              url={url}
              onClick={handleClick}
              currentlyActive={currentlyActive}
              shouldLoad={shouldLoad}
            />
          ) : (
            <ImagePlaneWithDisposal
              url={url}
              onClick={handleClick}
              shouldLoad={shouldLoad}
            />
          )}
        </Float>
      </Billboard>
    </group>
  );
}

// divide orbit into spatial chunks
function getChunkKey(position: THREE.Vector3, chunkSize = 100) {
  return `${Math.floor(position.x / chunkSize)}_${Math.floor(
    position.y / chunkSize
  )}_${Math.floor(position.z / chunkSize)}`;
}

// group items by chunk
function chunkItems(items: PortfolioItem[], positions: THREE.Vector3[]) {
  const chunks = new Map<
    string,
    Array<{ item: PortfolioItem; position: THREE.Vector3 }>
  >();

  items.forEach((item, i) => {
    const key = getChunkKey(positions[i]);
    if (!chunks.has(key)) chunks.set(key, []);
    chunks.get(key)!.push({ item, position: positions[i] });
  });

  return chunks;
}

export function FileOrbit({ spread = 20 }: { spread?: number }) {
  const { camera } = useThree();
  const { isMobile } = useAppStore();
  const [visibleChunks, setVisibleChunks] = useState<Set<string>>(new Set());

  const chunks = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = ITEMS.length;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < n; i++) {
      const currentRadius = Math.sqrt(i + 1) * spread;
      const y = (1 - (i / (n - 1)) * 2) * (currentRadius * 0.5);
      const r = Math.sqrt(Math.max(0, currentRadius * currentRadius - y * y));
      const theta = goldenAngle * i;

      pts.push(
        new THREE.Vector3(
          Math.cos(theta) * r,
          Math.sin(theta) * y,
          Math.sin(theta) * r
        )
      );
    }

    return chunkItems(ITEMS, pts);
  }, [spread]);

  useFrame(() => {
    const newVisible = new Set<string>();
    const chunkSize = isMobile ? 50 : 200;

    // which chunks to load based on camera position
    const camPos = camera.position;

    // load 3x3x3 grid of chunks around camera
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const offsetPos = new THREE.Vector3(
            camPos.x + x * chunkSize,
            camPos.y + y * chunkSize,
            camPos.z + z * chunkSize
          );
          newVisible.add(getChunkKey(offsetPos, chunkSize));
        }
      }
    }

    setVisibleChunks(newVisible);
  });

  return (
    <group>
      {Array.from(chunks.entries()).map(([chunkKey, items]) =>
        visibleChunks.has(chunkKey) ? (
          <ChunkGroup key={chunkKey} items={items} />
        ) : null
      )}
    </group>
  );
}

function ChunkGroup({
  items,
}: {
  items: Array<{ item: PortfolioItem; position: THREE.Vector3 }>;
}) {
  return (
    <group>
      {items.map(({ item, position }) => (
        <MediaItem key={item.url} item={item} position={position} />
      ))}
    </group>
  );
}
