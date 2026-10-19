import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import styled from "styled-components";
import { floatingActionButtonStyles, type FloatingButtonStyleProps } from "@/components/FloatingActionButton";
import { ResetFormIcon } from "@/icons/formParameter";
import { clamp, deformTrack, dragTrackProgress, quantizeValue, rubberBand, trackPoint, trackProgress, trackTangent, type TrackKind, type HorizontalTrackLayout } from "./elasticTrack";

interface Props {
  kind: TrackKind;
  compact?: boolean;
  horizontalLayout?: HorizontalTrackLayout;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  format: (value: number) => string;
  dirty: boolean;
  resetLabel: string;
  limitText?: string;
  minimumLabel: string;
  maximumLabel: string;
  onStart: () => void;
  onPreview: (value: number) => void;
  onCommit: (value: number) => void;
  onCancel: () => void;
  onReset: () => void;
}

interface Gesture {
  pointer: number;
  capture: Element;
  rect: { left: number; top: number; width: number; height: number };
  startX: number;
  startY: number;
  startT: number;
  next: number;
  min: number;
  max: number;
  step: number;
  moved: boolean;
}

export function ElasticValueSlider(props: Props) {
  const { kind, label, value, min, max, step, defaultValue, format, horizontalLayout } = props;
  const reducedMotion = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const moving = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const latest = useRef(props); latest.current = props;
  const frame = useRef(0);
  const pull = useRef({ x: 0, y: 0 });
  const gesture = useRef<Gesture | null>(null);
  const keyboardGesture = useRef(false);
  const keyboardValue = useRef(value);
  const [dragging, setDragging] = useState(false);
  const [boundary, setBoundary] = useState<"min" | "max" | null>(null);
  const vertical = kind === "height" || kind === "size" || kind === "depth";
  const width = kind === "width" ? horizontalLayout?.width ?? 320 : 180;
  const height = kind === "width" ? 160 : kind.startsWith("rounding") ? 200 : kind === "depth" ? 220 : 300;
  const progress = clamp((value - min) / Math.max(max - min, 0.00001));
  const currentProgress = () => {
    const current = latest.current;
    return clamp((current.value - current.min) / Math.max(current.max - current.min, 0.00001));
  };
  const paint = (t: number, x: number, y: number) => {
    const point = trackPoint(kind, t, horizontalLayout);
    path.current?.setAttribute("d", deformTrack(kind, t, x, y, horizontalLayout));
    if (moving.current) moving.current.style.transform = `translate(${point.x + x}px, ${point.y + y}px)`;
    if (content.current) content.current.style.transform = `skew(${clamp(x * 0.24, -10, 10)}deg, ${clamp(y * 0.12, -7, 7)}deg) scale(${1 + Math.abs(x) / 400}, ${1 + Math.abs(y) / 400})`;
  };
  useLayoutEffect(() => { paint(progress, pull.current.x, pull.current.y); });

  const settle = () => {
    cancelAnimationFrame(frame.current);
    if (reducedMotion) { pull.current = { x: 0, y: 0 }; paint(currentProgress(), 0, 0); return; }
    let previous = performance.now(), vx = 0, vy = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.025); previous = now;
      const p = pull.current;
      vx += (-420 * p.x - 25 * vx) * dt;
      vy += (-420 * p.y - 25 * vy) * dt;
      p.x += vx * dt; p.y += vy * dt;
      paint(currentProgress(), p.x, p.y);
      if (Math.abs(p.x) + Math.abs(p.y) + Math.abs(vx) + Math.abs(vy) > 0.12) frame.current = requestAnimationFrame(tick);
      else { pull.current = { x: 0, y: 0 }; paint(currentProgress(), 0, 0); }
    };
    frame.current = requestAnimationFrame(tick);
  };
  const move = (event: PointerEvent) => {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    if (event.cancelable) event.preventDefault();
    const dx = (event.clientX - drag.startX) * width / drag.rect.width;
    const dy = (event.clientY - drag.startY) * height / drag.rect.height;
    drag.moved ||= Math.abs(dx) + Math.abs(dy) > 0.1;
    let raw = dragTrackProgress(kind, drag.startT, dx, dy, horizontalLayout);
    const defaultT = (defaultValue - drag.min) / (drag.max - drag.min);
    if (Math.abs(raw - defaultT) < 0.018) raw = defaultT;
    const t = clamp(raw), tangent = trackTangent(kind, t, horizontalLayout);
    const normal = { x: -tangent.y, y: tangent.x };
    const bend = reducedMotion ? 0 : rubberBand(dx * normal.x + dy * normal.y, 30);
    const stretch = reducedMotion ? 0 : rubberBand((raw - t) * 220, 42);
    const x = normal.x * bend + tangent.x * stretch;
    const y = normal.y * bend + tangent.y * stretch;
    pull.current = { x, y };
    drag.next = quantizeValue(drag.min + t * (drag.max - drag.min), drag.min, drag.max, drag.step);
    setBoundary(raw < 0 ? "min" : raw > 1 ? "max" : null);
    latest.current.onPreview(drag.next);
    paint((drag.next - drag.min) / (drag.max - drag.min), x, y);
  };
  const finish = (cancelled: boolean, event?: PointerEvent) => {
    const drag = gesture.current;
    if (!drag || (event && drag.pointer !== event.pointerId)) return;
    // Pointer-up may be the last movement sample, particularly outside an SVG path.
    if (!cancelled && event?.type === "pointerup" && drag.moved) move(event);
    gesture.current = null;
    if (drag.capture.hasPointerCapture(drag.pointer)) drag.capture.releasePointerCapture(drag.pointer);
    setDragging(false); setBoundary(null);
    if (cancelled) latest.current.onCancel(); else latest.current.onCommit(drag.next);
    settle();
  };
  const start = (event: ReactPointerEvent, isThumb = false) => {
    if (event.button !== 0 || gesture.current || max <= min) return;
    event.preventDefault(); event.stopPropagation();
    cancelAnimationFrame(frame.current);
    const rect = svg.current!.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) * width / rect.width, y: (event.clientY - rect.top) * height / rect.height };
    const t = isThumb ? progress : clamp(trackProgress(kind, point, horizontalLayout));
    const next = quantizeValue(min + t * (max - min), min, max, step);
    gesture.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, startT: t, next, capture: event.currentTarget, rect, min, max, step, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    thumb.current?.focus({ preventScroll: true });
    setDragging(true);
    latest.current.onStart(); latest.current.onPreview(next);
    pull.current = { x: 0, y: 0 };
    paint((next - min) / (max - min), 0, 0);
  };
  const finishKeyboard = () => {
    if (!keyboardGesture.current) return;
    keyboardGesture.current = false;
    latest.current.onCommit(keyboardValue.current);
  };
  const keyboard = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (keyboardGesture.current) { keyboardGesture.current = false; latest.current.onCancel(); }
      finish(true); return;
    }
    const change = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 }[event.key];
    if (change === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    if (!keyboardGesture.current) { keyboardGesture.current = true; keyboardValue.current = value; latest.current.onStart(); }
    keyboardValue.current = quantizeValue(event.key === "Home" ? min : event.key === "End" ? max : keyboardValue.current + change!, min, max, step);
    latest.current.onPreview(keyboardValue.current);
  };
  const handlers = useRef({ move, finish, finishKeyboard });
  handlers.current = { move, finish, finishKeyboard };
  useEffect(() => {
    const onMove = (event: PointerEvent) => handlers.current.move(event);
    const onUp = (event: PointerEvent) => handlers.current.finish(false, event);
    const onBlur = () => { handlers.current.finish(false); handlers.current.finishKeyboard(); };
    const onVisibility = () => { if (document.hidden) onBlur(); };
    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(frame.current);
      if (gesture.current || keyboardGesture.current) latest.current.onCancel();
    };
  }, []);
  const defaultPoint = trackPoint(kind, clamp((defaultValue - min) / Math.max(max - min, 0.00001)), horizontalLayout);
  const info = props.limitText ?? (boundary === "min" ? props.minimumLabel : boundary === "max" ? props.maximumLabel : undefined);
  return (
    <SliderRoot data-elastic-slider={kind} data-dragging={dragging} onKeyUp={e => { if (e.key === "Escape") e.stopPropagation(); else finishKeyboard(); }} onLostPointerCapture={event => handlers.current.finish(false, event.nativeEvent)}>
      <Drawing style={{ width, height }}>
        <svg ref={svg} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path d={deformTrack(kind, progress, 0, 0, horizontalLayout)} fill="none" stroke="transparent" strokeWidth="48" style={{ pointerEvents: "stroke", cursor: "grab" }} onPointerDown={e => start(e)} />
          <path ref={path} d={deformTrack(kind, progress, 0, 0, horizontalLayout)} fill="none" stroke="#212026" strokeWidth="11" strokeLinecap="round" style={{ pointerEvents: "none" }} />
          <circle cx={defaultPoint.x} cy={defaultPoint.y} r="3" fill="#929294" style={{ pointerEvents: "none" }} />
        </svg>
        <Moving ref={moving}>
          <Thumb $variant="dark" ref={thumb} role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Number(value.toFixed(1))} aria-valuetext={format(value)} aria-orientation={vertical ? "vertical" : "horizontal"} aria-disabled={max <= min} onKeyDown={keyboard} onBlur={finishKeyboard} onPointerDown={e => start(e, true)}><span ref={content}>{format(value)}</span></Thumb>
          <Caption data-bob-caption $kind={kind} $compact={props.compact}>
            <LabelRow>{!props.compact && <Label>{label}</Label>}{props.dirty && <Reset type="button" aria-label={props.resetLabel} title={props.resetLabel} onPointerDown={e => e.stopPropagation()} onClick={props.onReset} data-ui-sound-id="ui-tap"><ResetFormIcon /></Reset>}</LabelRow>
            {!props.compact && info && <Limit role="status">{info}</Limit>}
          </Caption>
          {props.compact && info && <Limit $compact role="status">{info}</Limit>}
        </Moving>
      </Drawing>
    </SliderRoot>
  );
}

const SliderRoot = styled.div`position: relative; width: fit-content; pointer-events: none; touch-action: none; user-select: none; --thumb-width: 80px; --thumb-height: 60px; [data-mobile="true"] & { --thumb-width: 106px; --thumb-height: 80px; } @media (max-height: 700px) { [data-mobile="true"] & { --thumb-width: 116px; --thumb-height: 88px; } }`;
const Drawing = styled.div`position: relative; > svg { overflow: visible; position: absolute; inset: 0; pointer-events: none; }`;
const Moving = styled.div`position: absolute; left: 0; top: 0; will-change: transform;`;
const Thumb = styled.div<FloatingButtonStyleProps>`
  ${floatingActionButtonStyles}
  --floating-button-edge: #0b0b0c;
  position: absolute; left: 0; top: 0; display: grid; place-items: center; transform: translate(-50%, -50%);
  min-width: var(--thumb-width); width: max-content; height: var(--thumb-height); padding: 0 12px;
  border: 4px solid #0b0b0c; background: #212026; border-radius: calc(var(--thumb-height) / 2.5);
  box-shadow: 0 5px 0 #0b0b0c, inset 0 0 0 2px white; color: #929294; font-size: 18px; font-weight: 900;
  pointer-events: auto; cursor: grab; touch-action: none;
  &:active { cursor: grabbing; } &:focus-visible { outline: 3px solid white; outline-offset: 4px; }
  span { display: block; pointer-events: none; font-variant-numeric: tabular-nums; }
  [data-mobile="true"] & { font-size: 24px; }
  @media (max-height: 700px) { [data-mobile="true"] & { font-size: 27px; } }
`;
const Caption = styled.div<{ $kind: TrackKind; $compact?: boolean }>`
  position: absolute; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; width: max-content;
  left: ${({ $kind }) => ["rounding", "roundingLower", "depth"].includes($kind) ? "auto" : $kind === "width" ? "0" : "calc(var(--thumb-width) / 2 + 12px)"};
  right: ${({ $kind }) => ["rounding", "roundingLower", "depth"].includes($kind) ? "calc(var(--thumb-width) / 2 + 12px)" : "auto"};
  top: ${({ $kind }) => $kind === "width" ? "calc(var(--thumb-height) / 2 + 12px)" : "0"};
  transform: ${({ $kind }) => $kind === "width" ? "translateX(-50%)" : "translateY(-50%)"};
  ${({ $kind }) => ["rounding", "roundingLower", "depth"].includes($kind) ? "align-items: flex-end;" : ""}
  ${({ $compact }) => $compact ? "left: 0; right: auto; top: calc(var(--thumb-height) / -2 - 12px); transform: translate(-50%, -100%); align-items: center;" : ""}
`;
const LabelRow = styled.div`display: flex; align-items: center; gap: 7px; pointer-events: none;`;
const Label = styled.span`background: #212026; color: white; font-weight: 900; font-size: 15px; white-space: nowrap; border-radius: 12px; padding: 7px 11px; [data-mobile="true"] & { font-size: 20px; } @media (max-height: 700px) { [data-mobile="true"] & { font-size: 23px; } }`;
const Reset = styled.button`display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border-radius: 50%; background: white; color: #212026; pointer-events: auto; flex-shrink: 0; &:focus-visible { outline: 2px solid white; outline-offset: 3px; } [data-mobile="true"] & { width: 66px; height: 66px; svg { width: 26px; height: 26px; } } @media (max-height: 700px) { [data-mobile="true"] & { width: 80px; height: 80px; } }`;
const Limit = styled.span<{ $compact?: boolean }>`max-width: 180px; text-align: inherit; color: white; background: #212026; border-radius: 10px; padding: 6px 8px; font-size: 11px; [data-mobile="true"] & { max-width: 210px; font-size: 20px; } ${({ $compact }) => $compact ? "position: absolute; left: 0; top: calc(var(--thumb-height) / 2 + 12px); width: max-content; transform: translateX(-50%); text-align: center;" : ""}`;
