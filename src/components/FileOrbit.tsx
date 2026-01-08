import * as THREE from "three";
import { useMemo, Suspense } from "react";
import {
  Billboard,
  Float,
  Image,
  useTexture,
  useVideoTexture,
} from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";
import { useQuestSystem } from "@/hooks/useQuestSystem";

interface PortfolioItem {
  url: string;
  title: string;
  type?: "image" | "video";
  link?: string;
  sound?: SoundConfig;
}

const ITEMS: PortfolioItem[] = [
  {
    url: "/images/portfolio/gradient_gem.jpeg",
    title: "Gradient Gem",
  },
  {
    url: "/images/portfolio/face_study.jpeg",
    title: "Gesichter Studie",
  },
  {
    url: "/videos/portfolio/peace-of-mind-roses-explo.mp4",
    title: "Peace & Roses",
    type: "video",
  },
  {
    url: "/images/portfolio/hassliebe_cover.jpeg",
    title: "Hassliebe Cover",
  },
  {
    url: "/images/portfolio/first_character.jpeg",
    title: "Erster 3D Charakter",
  },
  { url: "/images/portfolio/fluffy_bear.jpeg", title: "Bärchen" },
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
    url: "/images/portfolio/toon_character.jpeg",
    title: "Animal Crossing Style Charcter",
  },
  {
    url: "/images/portfolio/peace_of_mind_logos.jpeg",
    title: "Peace of Mind Variants",
  },
  {
    url: "/images/portfolio/warum_cover.jpeg",
    title: "Warum Cover",
  },
  {
    url: "/images/portfolio/skateboard_stickers.jpeg",
    title: "Skateboard Stickers",
  },
  {
    url: "/images/portfolio/tinyplanet_skateboard.jpeg",
    title: "Tiny Planet",
  },
  {
    url: "/images/portfolio/warum_v2.jpeg",
    title: "Warum (edit) Cover",
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

function VideoPlane({
  url,
  scale,
  onClick,
}: {
  url: string;
  scale: [number, number];
  onClick: () => void;
}) {
  const texture = useVideoTexture(url, {
    start: true,
    muted: true,
    loop: true,
    playsInline: true,
  });

  const { videoWidth, videoHeight } = texture.image;
  const calculatedScale = useMediaScale(videoWidth, videoHeight);

  return (
    <mesh scale={[calculatedScale[0], calculatedScale[1], 1]} onClick={onClick}>
      <planeGeometry />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function ImagePlane({
  url,
  scale,
  onClick,
}: {
  url: string;
  scale?: [number, number];
  onClick: () => void;
}) {
  const texture = useTexture(url);

  const { width, height } = texture.image;
  const calculatedScale = useMediaScale(width, height);

  return (
    <Image
      texture={texture}
      transparent
      scale={calculatedScale}
      onClick={onClick}
    />
  );
}

function MediaItem({ item, position }: MediaItemProps) {
  const { url, title, type } = item;

  const { setHoveredObject } = useFloatingBar();
  const { focusOnTarget, focusOnImage, focusedImageTitle } = useViewStore();
  const { triggerQuest } = useQuestSystem();

  const currentlyActive = focusedImageTitle === title;
  const setHovering = useCursorStore.getState().setHoveringClickable;
  const setPointerDown = useCursorStore.getState().setPointerDown;

  const isVideo =
    type === "video" || url.endsWith(".mp4") || url.endsWith(".webm");

  const handleClick = () => {
    // disable focus reset for already active images
    if (focusedImageTitle !== title) {
      focusOnTarget({ position, distance: 8 });
      focusOnImage(title);
    }
  };

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
      <Float floatIntensity={10} speed={0.5}>
        {isVideo ? (
          <VideoPlane url={url} scale={[1, 1]} onClick={handleClick} />
        ) : (
          <ImagePlane url={url} onClick={handleClick} />
        )}
      </Float>
    </Billboard>
  );
}

export function FileOrbit({ radius = 40 }: { radius?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = ITEMS.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;

      pts.push(
        new THREE.Vector3(
          Math.cos(theta) * r * radius,
          y * radius,
          Math.sin(theta) * r * radius
        )
      );
    }

    return pts;
  }, [radius]);

  return (
    <Suspense fallback={null}>
      <group>
        {points.map((pos, i) => (
          <MediaItem key={ITEMS[i].url} position={pos} item={ITEMS[i]} />
        ))}
      </group>
    </Suspense>
  );
}
