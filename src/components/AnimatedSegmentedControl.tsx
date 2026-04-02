import { type CSSProperties, type ReactNode, useMemo } from "react";
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
  className,
  style,
  theme = "light",
}: AnimatedSegmentedControlProps<T>) {
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    [options, value],
  );
  const optionCount = Math.max(1, options.length);

  return (
    <SegmentedRoot
      className={className}
      style={style}
      $size={size}
      $fullWidth={fullWidth}
      $theme={theme}
      data-layout-id={_layoutId}
    >
      <SlidingTrack>
        <SlidingBackground
          style={{
            width: `${100 / optionCount}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      </SlidingTrack>

      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <SegmentedButton
            key={option.value}
            type="button"
            $size={size}
            $active={isActive}
            $theme={theme}
            onClick={() => onChange(option.value)}
          >
            <SegmentedLabel>{option.label}</SegmentedLabel>
          </SegmentedButton>
        );
      })}
    </SegmentedRoot>
  );
}

const SegmentedRoot = styled.div<{
  $size: SegmentedSize;
  $fullWidth: boolean;
  $theme: "dark" | "light";
}>`
  display: flex;
  align-items: center;
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

const SlidingBackground = styled.span`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 1px 5px rgba(0, 0, 0, 0.08);
  pointer-events: none;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
`;

const SegmentedButton = styled.button<{
  $size: SegmentedSize;
  $active: boolean;
  $theme: "dark" | "light";
}>`
  flex: 1;
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
`;

const SegmentedLabel = styled.span`
  position: relative;
  z-index: 1;
  font-weight: 700;
  line-height: 1;
`;
