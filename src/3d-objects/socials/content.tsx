import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styled from "styled-components";

import { ItemStatusChip } from "@/apps/ui";
import { Button } from "@/layout/atoms";
import { formatNumber } from "@/molecules/TapCounter";
import { useCoreStore } from "@/store/core/store";
import { useSocialsStore } from "@/store/socials";
import { playUISound } from "@/utils/soundSystem";

import {
  FUN_FACT_REVEAL_COST,
  FUN_FACTS,
  SOCIAL_LINKS,
  TIMELINE_ENTRIES,
} from "./contentData";
import { getSocialLogoDataUrl } from "./helper";

const OVERLAY_PANEL_COLOR = "#f2f2f3";

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LinkCard = styled.a<{ $raised?: boolean }>`
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 16px;
  border-radius: 22px;
  background: ${({ $raised }) => ($raised ? "rgba(0,0,0,0.035)" : "transparent")};
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.18s ease,
    background 0.18s ease;

  &:hover {
    transform: translateX(3px);
    background: rgba(0, 0, 0, 0.045);
  }
`;

const IconBadge = styled.div<{ $color: string; $ink?: string }>`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: ${({ $color }) => $color};
  color: ${({ $ink }) => $ink ?? "#ffffff"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  flex-shrink: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 10px 18px rgba(0, 0, 0, 0.07);
`;

const LinkMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const LinkTitle = styled.span`
  font-size: 0.92rem;
  font-weight: 800;
  color: rgba(18, 18, 18, 0.92);
`;

const LinkHandle = styled.span`
  font-size: 0.76rem;
  font-weight: 600;
  color: rgba(18, 18, 18, 0.42);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TimelineWrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 18px 12px 0;
  margin-left: 10px;

  &::before {
    content: "";
    position: absolute;
    left: 27px;
    top: 20px;
    bottom: 0;
    width: 3px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.08);
  }
`;

const TimelineRow = styled.div`
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  align-items: center;
  position: relative;
  z-index: 1;
`;

const TimelineEmoji = styled.div`
  justify-self: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: ${OVERLAY_PANEL_COLOR};
  box-shadow:
    0 0 0 5px ${OVERLAY_PANEL_COLOR},
    inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  font-size: 1.3rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TimelineBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TimelineDate = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgba(18, 18, 18, 0.45);
`;

const TimelineTitle = styled.span`
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1.15;
  color: rgba(18, 18, 18, 0.94);
`;

const TimelineDescription = styled.p`
  margin: 2px 0 0;
  font-size: 0.84rem;
  font-weight: 500;
  line-height: 1.25;
  color: rgba(18, 18, 18, 0.48);
`;

const FavoritesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
`;

const FavoriteCoverStage = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  min-width: 0;
`;

const FavoriteImageFrame = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
`;

const FavoriteImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const FavoriteFallbackSurface = styled.div<{ $gradient: string }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.74), transparent 34%),
    linear-gradient(180deg, rgba(255, 250, 244, 0.94), rgba(237, 230, 220, 0.94));

  &::after {
    content: "";
    position: absolute;
    inset: 16%;
    border-radius: 999px;
    background: ${({ $gradient }) => $gradient};
    box-shadow:
      0 18px 36px rgba(0, 0, 0, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
  }

  &::before {
    content: "";
    position: absolute;
    width: 34%;
    aspect-ratio: 1;
    border-radius: 999px;
    top: 22%;
    left: 26%;
    background: rgba(255, 255, 255, 0.18);
    filter: blur(2px);
    z-index: 1;
  }
`;

const FavoriteMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0 2px;
`;

const FavoriteSubtitle = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(18, 18, 18, 0.42);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FavoriteTitle = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.15;
  color: rgba(18, 18, 18, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FavoritePlatformBadge = styled.div<{ $platformColor: string }>`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  background: ${({ $platformColor }) => $platformColor};
  color: #ffffff;
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transform: translate(4px, -4px);
`;

const FavoriteCard = styled.a`
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;

  &:hover ${FavoriteImageFrame} {
    transform: translateY(-4px);
    box-shadow: 0 18px 28px rgba(0, 0, 0, 0.12);
  }
`;

const SocialsCanvasStage = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const SocialsCanvasFrame = styled.div`
  position: relative;
  width: 100%;
  min-height: 340px;
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(0, 0, 0, 0.03)),
    rgba(0, 0, 0, 0.035);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 0 0 1px rgba(0, 0, 0, 0.04);
`;

const SocialsCanvasElement = styled.canvas`
  display: block;
  width: 100%;
  height: 340px;
  cursor: grab;
  touch-action: none;
`;

const VisuallyHiddenLinks = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

const FactsLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
`;

const FactsTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const FactsMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

const FactsLibraryStage = styled.div`
  position: relative;
  min-height: 396px;
`;

const FactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const FactTileButton = styled(motion.button)<{ $locked: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 84px;
  padding: 12px;
  border: none;
  border-radius: 18px;
  background: ${({ $locked }) =>
    $locked
      ? "rgba(0, 0, 0, 0.04)"
      : "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(244,237,229,0.92))"};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    0 10px 18px rgba(0, 0, 0, 0.06);
  cursor: ${({ $locked }) => ($locked ? "default" : "pointer")};
  text-align: left;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: ${({ $locked }) =>
      $locked
        ? "linear-gradient(135deg, transparent 0 40%, rgba(0,0,0,0.04) 40% 52%, transparent 52% 100%)"
        : "none"};
    pointer-events: none;
  }
`;

const FactTileTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.4rem;
`;

const FactTileId = styled.span<{ $locked?: boolean; $accent?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.24rem 0.5rem;
  border-radius: 999px;
  background: ${({ $locked, $accent }) =>
    $locked ? "rgba(0,0,0,0.08)" : `${$accent ?? "#121212"}18`};
  color: ${({ $locked, $accent }) => ($locked ? "rgba(18,18,18,0.4)" : $accent ?? "#121212")};
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
`;

const FactTileLock = styled.span`
  font-size: 0.82rem;
  color: rgba(18, 18, 18, 0.36);
`;

const FactTileName = styled.span<{ $locked?: boolean }>`
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.1;
  color: ${({ $locked }) => ($locked ? "rgba(18,18,18,0.34)" : "rgba(18,18,18,0.92)")};
`;

const FactTilePreview = styled.span<{ $locked?: boolean }>`
  display: block;
  margin-top: 0.35rem;
  font-size: 0.68rem;
  line-height: 1.2;
  color: ${({ $locked }) => ($locked ? "rgba(18,18,18,0.28)" : "rgba(18,18,18,0.48)")};
`;

const FactDetailBackdrop = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(242, 242, 243, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 24px;
  cursor: pointer;
`;

const FactDetailCard = styled(motion.button)<{ $accent: string }>`
  position: relative;
  width: min(100%, 248px);
  min-height: 0;
  aspect-ratio: 0.78;
  padding: 18px 18px 20px;
  border: none;
  border-radius: 26px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.99) 0%,
      rgba(248, 242, 232, 0.97) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    0 24px 40px rgba(0, 0, 0, 0.12);
  text-align: left;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid ${({ $accent }) => `${$accent}33`};
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 70px 0 18px;
    background-image: linear-gradient(
      to bottom,
      transparent 0 17px,
      rgba(0, 0, 0, 0.045) 17px 18px
    );
    background-size: 100% 18px;
    pointer-events: none;
    opacity: 0.9;
  }
`;

const FactDetailChip = styled.span<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  background: ${({ $accent }) => `${$accent}18`};
  color: ${({ $accent }) => $accent};
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
`;

const FactDetailTitle = styled.h3`
  margin: 0.9rem 0 0;
  max-width: 13ch;
  font-size: 1.2rem;
  line-height: 0.98;
  letter-spacing: -0.04em;
  color: rgba(18, 18, 18, 0.95);
`;

const FactDetailText = styled.p`
  position: relative;
  z-index: 1;
  margin: 1rem 0 0;
  max-width: 19ch;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(18, 18, 18, 0.72);
`;

const FactDetailHint = styled.span`
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 16px;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(18, 18, 18, 0.34);
`;

const FactsProgressChip = styled(ItemStatusChip)`
  background: rgba(0, 0, 0, 0.06);
`;

const FactsPriceChip = styled(ItemStatusChip)`
  background: rgba(18, 18, 18, 0.1);
`;

const RevealPrimaryButton = styled(Button)`
  width: 100%;
  height: auto;
  min-height: 58px;
  padding: 18px 22px;

  &:disabled {
    opacity: 0.42;
    box-shadow: none;
    cursor: not-allowed;
  }

  &:disabled:hover {
    box-shadow: none;
  }

`;

const FactsFloatingCta = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 3;
  margin-top: auto;
  padding-top: 0.5rem;
  background: linear-gradient(
    180deg,
    rgba(242, 242, 243, 0) 0%,
    rgba(242, 242, 243, 0.86) 26%,
    rgba(242, 242, 243, 1) 100%
  );
`;

function getPlatformMeta(href: string) {
  if (href.includes("spotify")) {
    return { label: "Spotify", color: "#1db954" };
  }

  return { label: "SoundCloud", color: "#ff7f1f" };
}

function PlatformGlyph({ href }: { href: string }) {
  if (href.includes("spotify")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
        <path
          d="M6.4 9.3c3.7-1.1 7.9-.7 11 1.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M7.4 12.7c2.7-.8 5.7-.5 8 .8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8.3 15.9c1.8-.5 3.8-.3 5.3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M9.7 16.9h7.7a3 3 0 0 0 0-6 4.4 4.4 0 0 0-8.1-1.2A2.7 2.7 0 0 0 9.7 16.9Z" />
      <rect x="4.5" y="11.3" width="1.4" height="5.6" rx="0.7" />
      <rect x="6.8" y="9.7" width="1.4" height="7.2" rx="0.7" />
      <rect x="9.1" y="8.4" width="1.4" height="8.5" rx="0.7" />
    </svg>
  );
}

function FavoritePlatformBadgeMark({ href }: { href: string }) {
  const platform = getPlatformMeta(href);

  return (
    <FavoritePlatformBadge $platformColor={platform.color} aria-label={platform.label}>
      <PlatformGlyph href={href} />
    </FavoritePlatformBadge>
  );
}

function FavoriteCover({ title, artworkUrl, fallbackColors }: {
  title: string;
  artworkUrl: string | null;
  fallbackColors: [string, string, string];
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const gradient = `linear-gradient(145deg, ${fallbackColors[0]}, ${fallbackColors[1]} 58%, ${fallbackColors[2]})`;
  const showFallback = !artworkUrl || imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [artworkUrl]);

  return (
    <>
      {showFallback && <FavoriteFallbackSurface $gradient={gradient} aria-hidden />}
      {artworkUrl && !imageFailed && (
        <FavoriteImage
          src={artworkUrl}
          alt={title}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}
    </>
  );
}

type SocialCanvasBall = {
  id: string;
  href: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  textColor?: string;
};

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createInitialSocialBalls(
  width: number,
  height: number,
): SocialCanvasBall[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const orbit = Math.min(width, height) * 0.24;
  const radius = clampValue(Math.min(width, height) * 0.12, 42, 58);

  return SOCIAL_LINKS.map((link, index) => {
    const angle = (index / SOCIAL_LINKS.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: link.id,
      href: link.href,
      label: link.label,
      x: centerX + Math.cos(angle) * orbit,
      y: centerY + Math.sin(angle) * orbit,
      vx: Math.cos(angle + Math.PI / 3) * 0.7,
      vy: Math.sin(angle + Math.PI / 3) * 0.7,
      radius,
      color: link.color,
      textColor: link.textColor,
    };
  });
}

export function SocialsOverlayContent() {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<SocialCanvasBall[]>([]);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number | null;
    ballId: string | null;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
    prevX: number;
    prevY: number;
    prevTime: number;
  }>({
    pointerId: null,
    ballId: null,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    moved: false,
    prevX: 0,
    prevY: 0,
    prevTime: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        SOCIAL_LINKS.map(
          (link) =>
            new Promise<[string, HTMLImageElement]>((resolve) => {
              const image = new Image();
              image.onload = () => resolve([link.id, image]);
              image.onerror = () => resolve([link.id, image]);
              image.src = getSocialLogoDataUrl(link);
            }),
        ),
      );

      if (cancelled) return;
      imagesRef.current = Object.fromEntries(entries);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ballsRef.current = createInitialSocialBalls(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    resize();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const { width, height } = sizeRef.current;
      if (!width || !height) {
        rafRef.current = window.requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((time - lastTime) / 16.6667, 2);
      lastTime = time;
      const balls = ballsRef.current;
      const drag = dragRef.current;

      for (const ball of balls) {
        if (drag.ballId === ball.id) {
          const targetX = clampValue(drag.x, ball.radius, width - ball.radius);
          const targetY = clampValue(drag.y, ball.radius, height - ball.radius);
          ball.vx = (targetX - ball.x) * 0.32;
          ball.vy = (targetY - ball.y) * 0.32;
          ball.x = targetX;
          ball.y = targetY;
          continue;
        }

        ball.vy += 0.045 * dt;
        ball.vx *= 0.992;
        ball.vy *= 0.992;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x < ball.radius) {
          ball.x = ball.radius;
          ball.vx *= -0.88;
        } else if (ball.x > width - ball.radius) {
          ball.x = width - ball.radius;
          ball.vx *= -0.88;
        }

        if (ball.y < ball.radius) {
          ball.y = ball.radius;
          ball.vy *= -0.88;
        } else if (ball.y > height - ball.radius) {
          ball.y = height - ball.radius;
          ball.vy *= -0.88;
        }
      }

      for (let i = 0; i < balls.length; i += 1) {
        for (let j = i + 1; j < balls.length; j += 1) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const minDistance = a.radius + b.radius;

          if (distance >= minDistance) continue;

          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;
          const push = overlap * 0.5;

          if (drag.ballId !== a.id) {
            a.x -= nx * push;
            a.y -= ny * push;
          }
          if (drag.ballId !== b.id) {
            b.x += nx * push;
            b.y += ny * push;
          }

          const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relativeVelocity > 0) continue;

          const impulse = (-(1 + 0.86) * relativeVelocity) / 2;
          if (drag.ballId !== a.id) {
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
          }
          if (drag.ballId !== b.id) {
            b.vx += impulse * nx;
            b.vy += impulse * ny;
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      balls.forEach((ball) => {
        const image = imagesRef.current[ball.id];

        ctx.save();
        ctx.translate(ball.x, ball.y);

        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.stroke();

        if (image?.complete) {
          const iconSize = ball.radius * 1.08;
          ctx.drawImage(image, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
        }

        ctx.restore();
      });

      rafRef.current = window.requestAnimationFrame(render);
    };

    rafRef.current = window.requestAnimationFrame(render);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const getLocalPointer = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    [],
  );

  const openLink = useCallback((href: string) => {
    playUISound("ui-tap-1");
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <SocialsCanvasStage>
      <SocialsCanvasFrame ref={frameRef}>
        <SocialsCanvasElement
          ref={canvasRef}
          onPointerDown={(event) => {
            const { x, y } = getLocalPointer(event);
            const hitBall = [...ballsRef.current]
              .reverse()
              .find((ball) => Math.hypot(ball.x - x, ball.y - y) <= ball.radius);

            if (!hitBall) return;

            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              pointerId: event.pointerId,
              ballId: hitBall.id,
              startX: x,
              startY: y,
              x,
              y,
              moved: false,
              prevX: x,
              prevY: y,
              prevTime: performance.now(),
            };
            event.currentTarget.style.cursor = "grabbing";
          }}
          onPointerMove={(event) => {
            if (dragRef.current.pointerId !== event.pointerId) return;

            const { x, y } = getLocalPointer(event);
            const now = performance.now();
            const dx = x - dragRef.current.prevX;
            const dy = y - dragRef.current.prevY;
            if (
              !dragRef.current.moved &&
              Math.hypot(x - dragRef.current.startX, y - dragRef.current.startY) > 8
            ) {
              dragRef.current.moved = true;
            }

            const dt = Math.max(8, now - dragRef.current.prevTime);
            const ball = ballsRef.current.find(
              (entry) => entry.id === dragRef.current.ballId,
            );
            if (ball) {
              ball.vx = (dx / dt) * 10;
              ball.vy = (dy / dt) * 10;
            }

            dragRef.current.x = x;
            dragRef.current.y = y;
            dragRef.current.prevX = x;
            dragRef.current.prevY = y;
            dragRef.current.prevTime = now;
          }}
          onPointerUp={(event) => {
            if (dragRef.current.pointerId !== event.pointerId) return;

            const releasedBall = ballsRef.current.find(
              (entry) => entry.id === dragRef.current.ballId,
            );
            const shouldOpen = releasedBall && !dragRef.current.moved;

            dragRef.current.pointerId = null;
            dragRef.current.ballId = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            event.currentTarget.style.cursor = "grab";

            if (shouldOpen) {
              openLink(releasedBall.href);
            }
          }}
          onPointerCancel={(event) => {
            if (dragRef.current.pointerId !== event.pointerId) return;
            dragRef.current.pointerId = null;
            dragRef.current.ballId = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            event.currentTarget.style.cursor = "grab";
          }}
        />
        <VisuallyHiddenLinks>
          {SOCIAL_LINKS.map((link) => (
            <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </VisuallyHiddenLinks>
      </SocialsCanvasFrame>
    </SocialsCanvasStage>
  );
}

export function TimelineOverlayContent() {
  return (
    <TimelineWrap>
      {TIMELINE_ENTRIES.map((entry) => (
        <TimelineRow key={entry.id}>
          <TimelineEmoji>{entry.emoji}</TimelineEmoji>
          <TimelineBody>
            <TimelineDate>{entry.date}</TimelineDate>
            <TimelineTitle>{entry.title}</TimelineTitle>
            {entry.description && (
              <TimelineDescription>{entry.description}</TimelineDescription>
            )}
          </TimelineBody>
        </TimelineRow>
      ))}
    </TimelineWrap>
  );
}

export function FavoritesOverlayContent() {
  const favorites = useSocialsStore((state) => state.resolvedFavorites);

  return (
    <FavoritesGrid>
      {favorites.map((favorite) => (
        <FavoriteCard
          key={favorite.id}
          href={favorite.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FavoriteCoverStage>
            <FavoritePlatformBadgeMark href={favorite.href} />
            <FavoriteImageFrame>
              <FavoriteCover
                title={favorite.title}
                artworkUrl={favorite.artworkUrl}
                fallbackColors={favorite.fallbackGradient.colors}
              />
            </FavoriteImageFrame>
          </FavoriteCoverStage>
          <FavoriteMeta>
            <FavoriteSubtitle>{favorite.artist}</FavoriteSubtitle>
            <FavoriteTitle>{favorite.title}</FavoriteTitle>
          </FavoriteMeta>
        </FavoriteCard>
      ))}
    </FavoritesGrid>
  );
}

export function FunFactsOverlayContent() {
  const taps = useCoreStore((state) => state.taps);
  const currentFunFactIndex = useSocialsStore((state) => state.currentFunFactIndex);
  const revealedFunFactIds = useSocialsStore((state) => state.revealedFunFactIds);
  const revealNextUnrevealedFunFact = useSocialsStore(
    (state) => state.revealNextUnrevealedFunFact,
  );
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const lastCurrentFactIdRef = useRef<string | null>(null);

  const unlockedFacts = useMemo(
    () => FUN_FACTS.filter((fact) => revealedFunFactIds[fact.id] === true),
    [revealedFunFactIds],
  );
  const currentFact = FUN_FACTS[currentFunFactIndex] ?? FUN_FACTS[0];
  const selectedFact =
    (selectedFactId
      ? FUN_FACTS.find((fact) => fact.id === selectedFactId) ?? null
      : null);
  const nextUnrevealedFact = useMemo(
    () => FUN_FACTS.find((fact) => revealedFunFactIds[fact.id] !== true) ?? null,
    [revealedFunFactIds],
  );
  const canReveal = taps >= FUN_FACT_REVEAL_COST && nextUnrevealedFact !== null;

  useEffect(() => {
    const currentFactChanged = lastCurrentFactIdRef.current !== currentFact.id;
    lastCurrentFactIdRef.current = currentFact.id;

    if (
      currentFactChanged &&
      !selectedFactId &&
      revealedFunFactIds[currentFact.id] === true
    ) {
      setSelectedFactId(currentFact.id);
      return;
    }

    if (selectedFactId && revealedFunFactIds[selectedFactId] !== true) {
      setSelectedFactId(unlockedFacts[0]?.id ?? null);
    }
  }, [currentFact.id, revealedFunFactIds, selectedFactId, unlockedFacts]);

  const onReveal = useCallback(() => {
    if (!canReveal) return;

    useCoreStore.setState((state) => ({
      taps: Math.max(0, state.taps - FUN_FACT_REVEAL_COST),
    }));
    const revealedFact = revealNextUnrevealedFunFact();
    if (!revealedFact) return;

    setSelectedFactId(revealedFact.id);
    playUISound("ui-tap-2");
  }, [canReveal, revealNextUnrevealedFunFact]);

  return (
    <FactsLayout>
      <FactsTopBar>
        <FactsMeta>
          <FactsProgressChip>
            {unlockedFacts.length}/{FUN_FACTS.length} Fakten
          </FactsProgressChip>
          <FactsPriceChip>
            {formatNumber(FUN_FACT_REVEAL_COST)} <span>🫵</span>
          </FactsPriceChip>
        </FactsMeta>
      </FactsTopBar>

      <FactsLibraryStage>
        <FactsGrid>
          {FUN_FACTS.map((fact) => {
            const isUnlocked = revealedFunFactIds[fact.id] === true;
            const isSelected = selectedFactId === fact.id;

            return (
              <FactTileButton
                key={fact.id}
                type="button"
                layoutId={isUnlocked ? `fact-note-${fact.id}` : undefined}
                $locked={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) return;
                  setSelectedFactId(fact.id);
                  playUISound("ui-tap-1");
                }}
                whileHover={isUnlocked ? { y: -2, scale: 1.01 } : undefined}
                whileTap={isUnlocked ? { scale: 0.985 } : undefined}
                style={{ opacity: isSelected && selectedFact ? 0 : 1 }}
              >
                <FactTileTop>
                  <FactTileId $locked={!isUnlocked} $accent={fact.accentColor}>
                    {fact.id}
                  </FactTileId>
                  {!isUnlocked && <FactTileLock>?</FactTileLock>}
                </FactTileTop>
                <div>
                  <FactTileName $locked={!isUnlocked}>
                    {isUnlocked ? fact.name : "Noch verborgen"}
                  </FactTileName>
                  <FactTilePreview $locked={!isUnlocked}>
                    {isUnlocked ? `${fact.text.slice(0, 42)}...` : "Mit Taps freischalten"}
                  </FactTilePreview>
                </div>
              </FactTileButton>
            );
          })}
        </FactsGrid>

        <AnimatePresence>
          {selectedFact && (
            <FactDetailBackdrop
              key={selectedFact.id}
              onClick={() => setSelectedFactId(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FactDetailCard
                layoutId={`fact-note-${selectedFact.id}`}
                $accent={selectedFact.accentColor}
                initial={{ opacity: 0.92, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0.92, scale: 0.97, y: 10 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                onClick={() => setSelectedFactId(null)}
              >
                <FactDetailChip $accent={selectedFact.accentColor}>
                  {selectedFact.id}
                </FactDetailChip>
                <FactDetailTitle>{selectedFact.name}</FactDetailTitle>
                <FactDetailText>{selectedFact.text}</FactDetailText>
                <FactDetailHint>Tippe daneben, um wieder zur Sammlung zu gehen.</FactDetailHint>
              </FactDetailCard>
            </FactDetailBackdrop>
          )}
        </AnimatePresence>
      </FactsLibraryStage>

      {nextUnrevealedFact && (
        <FactsFloatingCta>
          <RevealPrimaryButton
            type="button"
            whileTap={canReveal ? { scale: 0.985 } : undefined}
            onClick={onReveal}
            disabled={!canReveal}
          >
            Neuen Fakt zeigen
          </RevealPrimaryButton>
        </FactsFloatingCta>
      )}
    </FactsLayout>
  );
}
