import * as THREE from "three";
import { useMemo, Suspense } from "react";
import { Billboard, Image, useTexture } from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/cursorStore";
import { useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";

interface PortfolioImage {
  url: string;
  title: string;
  link?: string;
  sound?: SoundConfig;
}

const IMAGES: PortfolioImage[] = [
  { url: "/images/portfolio/face_study.jpeg", title: "face_study" },
  { url: "/images/portfolio/hassliebe_cover.jpeg", title: "hassliebe_cover" },
  { url: "/images/portfolio/first_character.jpeg", title: "character_model" },
  { url: "/images/portfolio/fluffy_bear.jpeg", title: "bear_head" },
  { url: "/images/portfolio/gradient_gem.jpeg", title: "gradient_gem" },
  {
    url: "/images/portfolio/peace_of_mind_red.jpeg",
    title: "peace_of_mind_red",
  },
  { url: "/images/portfolio/noisy_wallpaper.jpeg", title: "peace_of_mind" },
  {
    url: "/images/portfolio/peace_of_mind_orange.jpeg",
    title: "peace_of_mind_orange",
  },
  { url: "/images/portfolio/toon_character.jpeg", title: "toon_character" },
  {
    url: "/images/portfolio/peace_of_mind_logos.jpeg",
    title: "peace_of_mind_logos",
  },
  { url: "/images/portfolio/warum_cover.jpeg", title: "warum_cover" },
  {
    url: "/images/portfolio/skateboard_stickers.jpeg",
    title: "skateboard_stickers",
  },
  { url: "/images/portfolio/tinyplanet_skateboard.jpeg", title: "tiny_planet" },
  { url: "/images/portfolio/warum_v2.jpeg", title: "warum_2026_edit" },
];

interface ImageItemProps {
  url: string;
  title: string;
  position: THREE.Vector3;
}

function ImageItem({ url, title, position }: ImageItemProps) {
  const texture = useTexture(url);

  const { setHoveredObject } = useFloatingBar();
  const { focusOnTarget, focusOnImage, focusedImageTitle } = useViewStore();
  const cursor = useCursorStore();

  const currentlyActive = focusedImageTitle === title; // TODO: use ids instead

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();

    setHoveredObject({
      title: title,
    });
    cursor.set("hover");
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
    cursor.set("default");
  };

  const handlePointerDown = () => {
    cursor.set("active");
    if (!currentlyActive) playUISound();
  };

  const handlePointerUp = () => {
    cursor.set("hover");
  };

  const scale = useMemo<[number, number]>(() => {
    const { width, height } = texture.image as {
      width: number;
      height: number;
    };

    const max = 8;
    const factor = max / Math.max(width, height);

    return [width * factor, height * factor];
  }, [texture]);

  return (
    <Billboard
      position={position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Image
        texture={texture}
        transparent
        scale={scale}
        onClick={() => {
          // disable focus reset for already active images
          if (focusedImageTitle !== title) {
            focusOnTarget({ position, distance: 8 });
            focusOnImage(title);
          }
        }}
      />
    </Billboard>
  );
}

export function ImageOrbit({ radius = 40 }: { radius?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = IMAGES.length;
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
          <ImageItem
            key={IMAGES[i].url}
            position={pos}
            url={IMAGES[i].url}
            title={IMAGES[i].title}
          />
        ))}
      </group>
    </Suspense>
  );
}
