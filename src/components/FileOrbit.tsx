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
import { useCoreStore, useViewStore } from "@/store";
import { playUISound } from "@/utils/soundSystem";
import { SoundConfig } from "@/utils/sound/types";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { extend } from "@react-three/fiber";
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

const useMediaScale = (width: number, height: number): [number, number] => {
  return useMemo(() => {
    const max = 8;
    const factor = max / Math.max(width, height);
    return [width * factor, height * factor];
  }, [width, height]);
};

extend({ RoundedPlaneGeometry: geometry.RoundedPlaneGeometry });

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
      {/* @ts-ignore */}
      <roundedPlaneGeometry args={[1, 1, 0.05, 6]} />

      {/* <planeGeometry /> */}
      <Suspense fallback={null}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </Suspense>
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
    <Suspense fallback={null}>
      <Image
        texture={texture}
        transparent
        scale={calculatedScale}
        onClick={onClick}
        radius={0.15}
      />
    </Suspense>
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
      {/* <Float floatIntensity={10} speed={0.5}> */}
      {isVideo ? (
        <VideoPlane url={url} scale={[1, 1]} onClick={handleClick} />
      ) : (
        <ImagePlane url={url} onClick={handleClick} />
      )}
      {/* </Float> */}
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
    // evenly distributed sphere, little squashed
    case "FIBONACCI_SPHERE": {
      const t = (index + 0.5) / count;
      const y = 1 - 2 * t;

      const power = 1;
      const squash = Math.sign(y) * Math.pow(Math.abs(y), power);

      const phi = Math.acos(squash);

      return {
        r: radius,
        phi: phi,
        theta: index * GOLDEN_ANGLE,
      };
    }

    // ring around camera
    case "EQUATORIAL_RING": {
      const tweak = 0;

      return {
        r: radius,
        phi: Math.PI / 2 + tweak * Math.log(index + 1),
        theta: index * GOLDEN_ANGLE,
      };
    }

    // vertical spiral
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

    // 4. Galaxy Like Waves
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
          <MediaItem key={ITEMS[i].url} position={pos} item={ITEMS[i]} />
        ))}
      </group>
    </Suspense>
  );
}
