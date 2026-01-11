import * as THREE from "three";
import { useMemo, Suspense, useEffect, useRef } from "react";
import {
  Billboard,
  Float,
  Image,
  useTexture,
  useVideoTexture,
} from "@react-three/drei";
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

function VideoPlane({
  url,
  scale,
  onClick,
  currentlyActive,
  inRange,
}: {
  url: string;
  scale: [number, number];
  onClick: () => void;
  currentlyActive: boolean;
  inRange?: boolean;
}) {
  const texture = useVideoTexture(url, {
    start: currentlyActive,
    muted: true,
    loop: true,
    playsInline: true,
  });

  useEffect(() => {
    if (!currentlyActive) texture.image?.pause();
    else texture.image?.play();
  }, [currentlyActive]);

  const { videoWidth, videoHeight } = texture.image;
  const calculatedScale = useMediaScale(videoWidth, videoHeight);

  return (
    <mesh scale={[calculatedScale[0], calculatedScale[1], 1]} onClick={onClick}>
      <planeGeometry />
      <Suspense fallback={null}>
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          opacity={inRange ? 1 : 0}
          transparent
        />
      </Suspense>
    </mesh>
  );
}

function ImagePlane({
  url,
  scale,
  onClick,
  inRange,
}: {
  url: string;
  scale?: [number, number];
  onClick: () => void;
  inRange?: boolean;
}) {
  const texture = useTexture(url);

  const { width, height } = texture.image;
  const calculatedScale = useMediaScale(width, height);

  return (
    <Suspense fallback={null}>
      <Image
        texture={texture}
        transparent
        scale={calculatedScale}
        onClick={onClick}
        opacity={inRange ? 1 : 0}
      />
    </Suspense>
  );
}

const LOW_RENDER_DISTANCE = 90;
const HIGH_RENDER_DISTANCE = 1000;
const MOBILE_ITEMS_LIMIT = 10;

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

  const { camera } = useThree();

  const distance = camera.position.distanceTo(position);
  const inRange = distance < RENDER_DISTANCE;

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

  if (isVideo && isMobile) return null;

  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ camera }) => {
    const obj = groupRef.current;
    if (!obj) return;

    const d = camera.position.distanceTo(obj.position);
    const inRange = d < RENDER_DISTANCE;

    obj.visible = inRange;
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
            <VideoPlane
              url={url}
              scale={[1, 1]}
              onClick={handleClick}
              currentlyActive={currentlyActive}
              inRange={inRange}
            />
          ) : (
            <ImagePlane url={url} onClick={handleClick} inRange={inRange} />
          )}
        </Float>
      </Billboard>
    </group>
  );
}

export function FileOrbit({ spread = 20 }: { spread?: number }) {
  const { isMobile } = useAppStore();
  const media = isMobile
    ? ITEMS.filter((i) => i.type !== "video").slice(0, MOBILE_ITEMS_LIMIT)
    : ITEMS;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = media.length;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    // const goldenAngle = Math.PI * (2 - Math.sqrt(2));

    for (let i = 0; i < n; i++) {
      // sqrt(i) creates a more even "galaxy" density
      const currentRadius = Math.sqrt(i + 1) * spread;

      // y goes from 1 to -1 over the course of the loop (vertical spread)
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

    return pts;
  }, [spread]);

  return (
    <group>
      {points.map((pos, i) => (
        <MediaItem key={media[i].url} position={pos} item={media[i]} />
      ))}
    </group>
  );
}
