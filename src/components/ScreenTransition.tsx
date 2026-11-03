import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import styled, { keyframes } from "styled-components";
import { useProgress } from "@react-three/drei";
import {
  INITIAL_REVEAL_SECONDS,
  SCREEN_TRANSITION_SECONDS,
  MINIMUM_TRANSITION_HOLD_MS,
  useScreenTransition,
} from "@/store/screenTransition";
import { PAGE_TRANSITION, type TransitionAppearance } from "@/styles/screenTransitions";
import { useActiveBobShape } from "@/hooks/useActiveBobShape";
import { getBlobFormHalfSize } from "@/types/blobForms";
import { bobTransitionFocus, getInitialTransitionCenter, getTransitionGeometry, getTransitionMask } from "@/utils/screenTransitionMask";
import { getMenuOrbitAngles, type MenuTransitionBubble } from "@/utils/menuTransitionBubbles";

export function ScreenTransition({ children }: { children?: ReactNode }) {
  const phase = useScreenTransition(state => state.phase);
  const request = useScreenTransition(state => state.request);
  const openness = useMotionValue(0);
  const mask = useMotionValue("none");
  const orbitX = useMotionValue(0);
  const orbitY = useMotionValue(0);
  const orbitDiameter = useMotionValue(64);
  const orbitOpacity = useMotionValue(0);
  const orbitRotation = useMotionValue(0);
  const morphProgress = useMotionValue(0);
  const orbitStart = useRef<{ id: number; time: number | null }>({ id: 0, time: null });
  const reducedMotion = useReducedMotion();
  const { formType, parameters } = useActiveBobShape();
  const appearance = request?.appearance ?? PAGE_TRANSITION;
  const failed = useRef(false);
  const orbitAngles = useMemo(() => {
    const focus = bobTransitionFocus.current;
    return getMenuOrbitAngles(request?.menuBubbles ?? [], focus?.x ?? window.innerWidth / 2, focus?.y ?? window.innerHeight / 2);
  }, [request]);

  useLayoutEffect(() => {
    if (phase === "idle" || phase === "loading") return;
    let frame = 0;
    const draw = () => {
      const focus = request?.keepBobVisible ? bobTransitionFocus.current : null;
      // Initial loading opens just above Bob's visible vertical center.
      // Keep this separate from focus, which also keeps a body-sized hole open.
      const initialCenter = request?.initial
        ? getInitialTransitionCenter(window.innerWidth, window.innerHeight, bobTransitionFocus.current)
        : undefined;
      const halfSize = getBlobFormHalfSize(formType, parameters);
      const aspect = focus ? focus.halfWidth / focus.halfHeight : halfSize[0] / halfSize[1];
      const geometry = getTransitionGeometry(
        window.innerWidth, window.innerHeight, openness.get() / 101,
        appearance.shape, formType, aspect, focus, initialCenter,
      );
      mask.set(getTransitionMask(window.innerWidth, window.innerHeight, geometry));
      orbitX.set(geometry.x);
      orbitY.set(geometry.y);
      // Bubbles move straight from their measured menu positions to the final
      // orbit during closing, rather than chasing an initially fullscreen hole.
      const orbitGeometry = phase === "closing"
        ? getTransitionGeometry(window.innerWidth, window.innerHeight, 0, appearance.shape, formType, aspect, focus)
        : geometry;
      orbitDiameter.set((orbitGeometry.outerRadius + 32) * 2);
      morphProgress.set(reducedMotion || phase !== "closing" ? 1 : Math.min(1, Math.max(0, 1 - openness.get() / 101)));
      orbitOpacity.set(phase === "closing" ? 1 : Math.min(1, Math.max(0, (1 - openness.get() / 101) * 3)));
      if (orbitStart.current.id !== request?.id) orbitStart.current = { id: request?.id ?? 0, time: null };
      if (phase !== "closing" && orbitStart.current.time === null) orbitStart.current.time = performance.now();
      orbitRotation.set(reducedMotion || orbitStart.current.time === null ? 0 : (performance.now() - orbitStart.current.time) / 5000 * Math.PI * 2);
    };
    const track = () => { draw(); frame = requestAnimationFrame(track); };
    draw();
    frame = requestAnimationFrame(track);
    const unsubscribe = openness.on("change", draw);
    return () => { cancelAnimationFrame(frame); unsubscribe(); };
  }, [phase, request, appearance, formType, parameters, openness, mask, orbitX, orbitY, orbitDiameter, orbitOpacity, orbitRotation, morphProgress, reducedMotion]);

  useEffect(() => {
    if (!request) {
      openness.set(phase === "loading" ? 0 : 101);
      return;
    }
    let cancelled = false;
    let frame = 0;
    const store = useScreenTransition.getState();

    if (phase === "covered") {
      const coveredAt = performance.now();
      const changeScene = async () => {
        try {
          await request.action?.();
        } catch (error) {
          failed.current = true;
          console.error("Screen transition action failed:", error);
        }
        if (cancelled) return;
        // Let React commit and the canvas paint the replacement while covered.
        let paintedFrames = 0;
        const waitForScene = () => {
          if (cancelled) return;
          paintedFrames = useProgress.getState().active ? 0 : paintedFrames + 1;
          if (paintedFrames >= 2 && performance.now() - coveredAt >= MINIMUM_TRANSITION_HOLD_MS) store.advance(request.id, "opening");
          else frame = requestAnimationFrame(waitForScene);
        };
        frame = requestAnimationFrame(waitForScene);
      };
      void changeScene();
      return () => { cancelled = true; cancelAnimationFrame(frame); };
    }

    if (phase !== "closing" && phase !== "opening") return;
    if (phase === "closing") {
      failed.current = false;
      openness.set(101);
    }
    const animation = animate(openness, phase === "closing" ? 0 : 101, {
      duration: request.initial ? INITIAL_REVEAL_SECONDS : SCREEN_TRANSITION_SECONDS / 2,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        if (phase === "closing") store.advance(request.id, "covered");
        else store.complete(request.id, !failed.current);
      },
    });
    return () => animation.stop();
  }, [phase, request, openness]);

  useEffect(() => {
    if (phase === "idle" || phase === "loading") return;
    const blockKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", blockKey, true);
    window.addEventListener("keyup", blockKey, true);
    return () => {
      window.removeEventListener("keydown", blockKey, true);
      window.removeEventListener("keyup", blockKey, true);
    };
  }, [phase]);

  if (phase === "idle") return null;

  return createPortal(
    <>
      <Curtain
        data-screen-transition={phase}
        data-transition-focus={request?.keepBobVisible ? "bob" : "screen"}
        data-transition-fill={appearance.fill.kind}
        $fill={appearance.fill}
        aria-busy={phase !== "loading"}
        style={{
          maskImage: phase === "loading" ? undefined : mask,
          WebkitMaskImage: phase === "loading" ? undefined : mask,
        }}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
      >
        {appearance.fill.kind === "checkerboard" && <CheckerPattern $fill={appearance.fill} aria-hidden="true" />}
        {(phase === "loading" || request?.initial) && children}
      </Curtain>
      {request && !request.initial && phase !== "loading" && appearance.loadingDots !== false && !!request.menuBubbles?.length && (
        <div aria-hidden="true" data-transition-loading-dots>
          {request.menuBubbles.map(bubble => (
            <MenuBubbleDot
              key={`${request.id}:${bubble.id}`}
              bubble={bubble}
              angle={orbitAngles.get(bubble.id) ?? 0}
              centerX={orbitX}
              centerY={orbitY}
              diameter={orbitDiameter}
              rotation={orbitRotation}
              progress={morphProgress}
              opacity={orbitOpacity}
              reducedMotion={!!reducedMotion}
            />
          ))}
        </div>
      )}
    </>,
    document.body,
  );
}

function MenuBubbleDot({ bubble, angle, centerX, centerY, diameter, rotation, progress, opacity, reducedMotion }: {
  bubble: MenuTransitionBubble;
  angle: number;
  centerX: MotionValue<number>;
  centerY: MotionValue<number>;
  diameter: MotionValue<number>;
  rotation: MotionValue<number>;
  progress: MotionValue<number>;
  opacity: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const dotScale = 6 / bubble.height;
  const rawScale = useMotionValue(reducedMotion ? dotScale : 1);
  // Keep the spring positive even for unusually tall options: an overshoot
  // must never flip the label or dot inside out.
  const scale = useTransform(rawScale, value => Math.max(dotScale * 0.6, value));
  const shapeProgress = useTransform(rawScale, value => Math.max(0, Math.min(1, (1 - value) / (1 - dotScale))));
  useEffect(() => {
    if (reducedMotion) { rawScale.set(dotScale); return; }
    let cancelled = false;
    rawScale.set(1);
    let animation = animate(rawScale, 1.08, { duration: 0.09, ease: "easeOut" });
    void animation.then(() => {
      if (cancelled) return;
      animation = animate(rawScale, dotScale, { type: "spring", visualDuration: 0.32, bounce: 0.16 });
    });
    return () => { cancelled = true; animation.stop(); };
  }, [rawScale, dotScale, reducedMotion]);
  const left = useTransform(() => bubble.x + (centerX.get() + Math.cos(angle + rotation.get()) * diameter.get() / 2 - bubble.x) * progress.get());
  const top = useTransform(() => bubble.y + (centerY.get() + Math.sin(angle + rotation.get()) * diameter.get() / 2 - bubble.y) * progress.get());
  const surfaceWidth = useTransform(shapeProgress, [0, 0.75, 1], [bubble.width, bubble.width, bubble.height]);
  // The glyphs retain their original metrics and shrink uniformly with the
  // bubble. Only hide them once they become too small to read.
  const labelOpacity = useTransform(shapeProgress, [0, 0.75, 1], [1, 1, 0]);
  const dotOpacity = useTransform(() => {
    const pulse = reducedMotion ? 0.5 : 0.5 + Math.sin(rotation.get() * 2.5 + angle) * 0.25;
    return (bubble.opacity + (pulse - bubble.opacity) * shapeProgress.get()) * opacity.get();
  });
  return (
    <BubbleAnchor
      data-menu-orbit-dot={bubble.id}
      style={{ left, top, opacity: dotOpacity }}
    >
      <MorphingBubble style={{ width: bubble.width, height: bubble.height, scale, color: bubble.color }}>
        <BubbleSurface style={{ width: surfaceWidth, background: bubble.background }}>
          <BubbleShadow style={{ boxShadow: bubble.boxShadow, opacity: labelOpacity }} />
        </BubbleSurface>
        <BubbleLabel style={{ ...bubble.font, opacity: labelOpacity }}>{bubble.label}</BubbleLabel>
      </MorphingBubble>
    </BubbleAnchor>
  );
}

const BubbleAnchor = styled(motion.div)`
  position: fixed;
  z-index: 99999;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const MorphingBubble = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
`;

const BubbleSurface = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 9999px;
`;

const BubbleShadow = styled(motion.div)`
  position: absolute;
  inset: 0;
  border-radius: inherit;
`;

const BubbleLabel = styled(motion.span)`
  position: relative;
  flex-shrink: 0;
  white-space: nowrap;
`;

const drift = keyframes`
  from { background-position: 0 0; }
  to { background-position: var(--checker-tile) 0; }
`;

const Curtain = styled(motion.div)<{ $fill: TransitionAppearance["fill"] }>`
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: ${props => props.$fill.kind === "solid" ? props.$fill.color : props.$fill.colors[0]};
  overflow: hidden;
  isolation: isolate;
  touch-action: none;
`;

const CheckerPattern = styled.div<{ $fill: Extract<TransitionAppearance["fill"], { kind: "checkerboard" }> }>`
  position: absolute;
  inset: -100vmax;
  z-index: -1;
  pointer-events: none;
  transform: rotate(45deg);
  ${props => `
    --checker-tile: ${props.$fill.squareSize * 2}px;
    background-image: conic-gradient(${props.$fill.colors[0]} 25%, ${props.$fill.colors[1]} 0 50%, ${props.$fill.colors[0]} 0 75%, ${props.$fill.colors[1]} 0);
    background-size: var(--checker-tile) var(--checker-tile);
    animation-duration: ${props.$fill.duration}s;
  `}
  animation-name: ${drift};
  animation-timing-function: linear;
  animation-iteration-count: infinite;
`;
