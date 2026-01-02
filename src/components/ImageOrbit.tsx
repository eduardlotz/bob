import * as THREE from "three";
import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import { Billboard, Image, useTexture } from "@react-three/drei";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/cursorStore";
import { useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";

interface PortfolioImage {
  url: string;
  title: string;
}

const IMAGES: PortfolioImage[] = [
  { url: "/images/portfolio/face_study.png", title: "face_study" },
  { url: "/images/portfolio/hassliebe_cover.png", title: "hassliebe_cover" },
  { url: "/images/portfolio/first_character.png", title: "character_model" },
  { url: "/images/portfolio/fluffy_bear.png", title: "bear_head" },
  { url: "/images/portfolio/gradient_gem.png", title: "gradient_gem" },
  {
    url: "/images/portfolio/peace_of_mind_red.png",
    title: "peace_of_mind_red",
  },
  { url: "/images/portfolio/noisy_wallpaper.jpg", title: "peace_of_mind" },
  {
    url: "/images/portfolio/peace_of_mind_orange.png",
    title: "peace_of_mind_orange",
  },
  { url: "/images/portfolio/toon_character.png", title: "toon_character" },
  {
    url: "/images/portfolio/peace_of_mind_logos.png",
    title: "peace_of_mind_logos",
  },
  { url: "/images/portfolio/warum_cover.png", title: "warum_cover" },
  {
    url: "/images/portfolio/skateboard_stickers.png",
    title: "skateboard_stickers",
  },
  { url: "/images/portfolio/tinyplanet_skateboard.jpg", title: "tiny_planet" },
];

interface ImageItemProps {
  url: string;
  title: string;
  position: THREE.Vector3;
}

function ImageItem({ url, title, position }: ImageItemProps) {
  const texture = useTexture(url);

  const { setHoveredObject } = useFloatingBar();
  const { focusOnTarget, focusOnImage } = useViewStore();
  const cursor = useCursorStore();

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
    playUISound();
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
    >
      <Image
        texture={texture}
        transparent
        scale={scale}
        onClick={() => {
          focusOnTarget({ position, distance: 14 });
          focusOnImage(title);
        }}
      />
    </Billboard>
  );
}

export function ImageOrbit({ radius = 20 }: { radius?: number }) {
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
