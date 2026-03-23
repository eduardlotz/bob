import { playUISound } from "@/utils/soundSystem";
import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styled from "styled-components";

import { SOCIAL_LINKS } from "./contentData";
import { getSocialLogoDataUrl } from "./helper";

const SocialsCanvasStage = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const SocialsCanvasFrame = styled.div`
  position: relative;
  width: 100%;
  min-height: 360px;
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
  height: 360px;
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

function createInitialSocialBalls(width: number, height: number): SocialCanvasBall[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const orbit = Math.min(width, height) * 0.24;
  const baseRadius = clampValue(Math.min(width, height) * 0.12, 38, 54);
  const sizeFactors = [1.18, 0.9, 1.06, 1.24, 0.94, 1.1] as const;

  return SOCIAL_LINKS.map((link, index) => {
    const angle = (index / SOCIAL_LINKS.length) * Math.PI * 2 - Math.PI / 2;
    const radius = clampValue(baseRadius * sizeFactors[index % sizeFactors.length], 36, 66);

    return {
      id: link.id,
      href: link.href,
      label: link.label,
      x: centerX + Math.cos(angle) * orbit,
      y: centerY + Math.sin(angle) * orbit,
      vx: Math.cos(angle + Math.PI / 3) * 1.1,
      vy: Math.sin(angle + Math.PI / 3) * 1.1,
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

    void load();

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

        ball.vy += 0.062 * dt;
        ball.vx *= 0.996;
        ball.vy *= 0.996;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x < ball.radius) {
          ball.x = ball.radius;
          ball.vx *= -0.94;
        } else if (ball.x > width - ball.radius) {
          ball.x = width - ball.radius;
          ball.vx *= -0.94;
        }

        if (ball.y < ball.radius) {
          ball.y = ball.radius;
          ball.vy *= -0.94;
        } else if (ball.y > height - ball.radius) {
          ball.y = height - ball.radius;
          ball.vy *= -0.94;
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

          const impulse = (-(1 + 0.94) * relativeVelocity) / 2;
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

  const getLocalPointer = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

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
            const ball = ballsRef.current.find((entry) => entry.id === dragRef.current.ballId);
            if (ball) {
              ball.vx = (dx / dt) * 13;
              ball.vy = (dy / dt) * 13;
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
