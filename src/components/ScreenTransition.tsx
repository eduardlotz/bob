import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animate, useMotionValue } from "motion/react";
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
import { afterScreenTransitionPaint } from "@/utils/screenTransitionPaint";
import { isRouteReady } from "@/store/routeLoading";

export function ScreenTransition({ children }: { children?: ReactNode }) {
  const phase = useScreenTransition(state => state.phase);
  const request = useScreenTransition(state => state.request);
  const openness = useMotionValue(0);
  const curtain = useRef<HTMLDivElement>(null);
  const { formType, parameters } = useActiveBobShape();
  const appearance = request?.appearance ?? PAGE_TRANSITION;
  const failed = useRef(false);

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
      const mask = getTransitionMask(window.innerWidth, window.innerHeight, geometry);
      const style = curtain.current?.style;
      if (style) {
        // Motion writes JS property names directly; WebKit's prefixed mask
        // properties need real CSS names. Keep these writes in the same frame
        // as the geometry, including the final closed frame before scene work.
        for (const prefix of ["-webkit-", ""]) {
          style.setProperty(`${prefix}mask-image`, mask.image);
          style.setProperty(`${prefix}mask-size`, mask.size);
          style.setProperty(`${prefix}mask-position`, mask.position);
          style.setProperty(`${prefix}mask-repeat`, "no-repeat");
          style.setProperty(`${prefix}mask-composite`, prefix ? "xor, source-over" : "exclude, add");
        }
      }
    };
    const track = () => { draw(); frame = requestAnimationFrame(track); };
    draw();
    frame = requestAnimationFrame(track);
    const unsubscribe = openness.on("change", draw);
    return () => { cancelAnimationFrame(frame); unsubscribe(); };
  }, [phase, request, appearance, formType, parameters, openness]);

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
          paintedFrames = useProgress.getState().active || !isRouteReady(window.location.pathname) ? 0 : paintedFrames + 1;
          if (paintedFrames >= 2 && performance.now() - coveredAt >= MINIMUM_TRANSITION_HOLD_MS) store.advance(request.id, "opening");
          else frame = requestAnimationFrame(waitForScene);
        };
        frame = requestAnimationFrame(waitForScene);
      };
      // Animation completion runs before browser paint. A synchronous mount or
      // shader compile here can otherwise freeze the outgoing scene on Safari.
      const cancelPaint = afterScreenTransitionPaint(() => { void changeScene(); });
      return () => { cancelled = true; cancelPaint(); cancelAnimationFrame(frame); };
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
        ref={curtain}
        data-screen-transition={phase}
        data-transition-focus={request?.keepBobVisible ? "bob" : "screen"}
        data-transition-fill={appearance.fill.kind}
        $fill={appearance.fill}
        aria-busy={phase !== "loading"}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
      >
        {appearance.fill.kind === "checkerboard" && <CheckerPattern $fill={appearance.fill} aria-hidden="true" />}
        {(phase === "loading" || request?.initial) && children}
      </Curtain>

    </>,
    document.body,
  );
}

const drift = keyframes`
  from { background-position: 0 0; }
  to { background-position: var(--checker-tile) 0; }
`;

const Curtain = styled.div<{ $fill: TransitionAppearance["fill"] }>`
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
