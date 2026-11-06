import { type CSSProperties, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styled, { css } from "styled-components";

export interface AnimatedSegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

type SegmentedSize = "sm" | "md";

interface AnimatedSegmentedControlProps<T extends string> {
  options: readonly AnimatedSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  size?: SegmentedSize;
  fullWidth?: boolean;
  indicatorSize?: "segment" | "content";
  animateOptions?: boolean;
  className?: string;
  style?: CSSProperties;
  theme?: "dark" | "light";
}

export function AnimatedSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId: _layoutId,
  size = "md",
  fullWidth = true,
  indicatorSize = "segment",
  animateOptions = true,
  className,
  style,
  theme = "light",
}: AnimatedSegmentedControlProps<T>) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.55 };
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    [options, value],
  );
  const optionCount = Math.max(1, options.length);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [contentIndicator, setContentIndicator] = useState<{ x: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (indicatorSize !== "content") return;
    const root = rootRef.current;
    const track = trackRef.current;
    const button = root?.querySelectorAll<HTMLButtonElement>("button")[activeIndex];
    const label = button?.querySelector<HTMLElement>("[data-segmented-label]");
    if (!root || !track || !button || !label) return;
    const measure = () => {
      const width = button.offsetWidth;
      // Offset metrics ignore layout animation transforms, keeping the pill's
      // target stable while the phone or label is moving.
      const x = button.offsetLeft - track.offsetLeft;
      setContentIndicator(previous => previous?.x === x && previous.width === width ? previous : { x, width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(button);
    observer.observe(label);
    return () => observer.disconnect();
  }, [activeIndex, indicatorSize, optionCount]);

  return (
    <SegmentedRoot
      ref={rootRef}
      className={className}
      style={style}
      $size={size}
      $fullWidth={fullWidth}
      $fitContent={indicatorSize === "content"}
      $theme={theme}
      data-layout-id={_layoutId}
    >
      <SlidingTrack ref={trackRef}>
        {(indicatorSize === "segment" || contentIndicator) && <SlidingBackground
          initial={false}
          animate={indicatorSize === "content" && contentIndicator
            ? contentIndicator
            : { width: `${100 / optionCount}%`, x: `${activeIndex * 100}%` }}
          transition={transition}
        />}
      </SlidingTrack>

      <AnimatePresence initial={false} mode="popLayout">
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <SegmentedButton
              key={option.value}
              layout={animateOptions ? "position" : false}
              initial={animateOptions ? { opacity: 0, scale: reducedMotion ? 1 : 0.9 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
              transition={transition}
              type="button"
              $size={size}
              $active={isActive}
              $fitContent={indicatorSize === "content"}
              $theme={theme}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
            >
              <SegmentedLabel data-segmented-label $fitContent={indicatorSize === "content"}>{option.label}</SegmentedLabel>
            </SegmentedButton>
          );
        })}
      </AnimatePresence>
    </SegmentedRoot>
  );
}

const SegmentedRoot = styled.div<{
  $size: SegmentedSize;
  $fullWidth: boolean;
  $fitContent: boolean;
  $theme: "dark" | "light";
}>`
  display: flex;
  align-items: center;
  ${({ $fitContent }) => $fitContent && "justify-content: space-between;"}
  gap: 0;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "fit-content")};
  padding: 4px;
  border-radius: 9999px;
  background: ${({ $theme }) =>
    $theme === "dark" ? "rgba(255, 255, 255, 0.07)" : "rgba(33, 33, 33, 0.07)"};
  position: relative;
`;

const SlidingTrack = styled.span`
  position: absolute;
  inset: 4px;
  pointer-events: none;
`;

const SlidingBackground = styled(motion.span)`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 1px 5px rgba(0, 0, 0, 0.08);
  pointer-events: none;
`;

const SegmentedButton = styled(motion.button)<{
  $size: SegmentedSize;
  $active: boolean;
  $fitContent: boolean;
  $theme: "dark" | "light";
}>`
  flex: ${({ $fitContent }) => $fitContent ? "0 0 auto" : "1"};
  ${({ $fitContent, $size }) => $fitContent && css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: ${$size === "sm" ? "2rem" : "2.5rem"};
  `}
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  z-index: 1;
  color: ${({ $active, $theme }) =>
    $active
      ? "#212121"
      : $theme === "dark"
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(33, 33, 33, 1)"};

  ${({ $size }) =>
    $size === "sm"
      ? css`
          min-height: 1.5rem;
          padding: 0.25rem 0.625rem;
          font-size: 0.875rem;
        `
      : css`
          min-height: 2rem;
          padding: 0.375rem 0.875rem;
          font-size: 1rem;
        `}

  ${({ $size }) =>
    $size === "sm"
      ? css`
          min-height: 2rem;
        `
      : css`
          min-height: 2.5rem;
        `}
        span {
    ${({ $size }) =>
      $size === "sm"
        ? css`
            font-weight: 900;
          `
        : css`
            font-weight: 800;
          `}
  }
`;

const SegmentedLabel = styled.span<{ $fitContent: boolean }>`
  ${({ $fitContent }) => $fitContent && "display: inline-flex; align-items: center; justify-content: center;"}
  position: relative;
  z-index: 1;
  /* font-weight: 900; */
  letter-spacing: -1%;
  line-height: 1;
`;
