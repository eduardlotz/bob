import { useCallback, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";

const EPSILON = 0.000001;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const snapToStep = (value: number, min: number, max: number, step: number) => {
  const next = min + Math.round((value - min) / step) * step;
  return clamp(Number(next.toFixed(6)), min, max);
};

export function formatSegmentedSliderValue(
  value: number,
  digits = 2,
): string {
  return Number(value).toFixed(digits).replace(/\.?0+$/, "");
}

interface SegmentedValueSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

export function SegmentedValueSlider({
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (next) => formatSegmentedSliderValue(next),
  disabled = false,
}: SegmentedValueSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const normalizedValue = useMemo(() => {
    if (max <= min) return 0;
    return clamp((value - min) / (max - min), 0, 1);
  }, [max, min, value]);

  const canDecrease = value > min + EPSILON;
  const canIncrease = value < max - EPSILON;

  const commitValue = useCallback(
    (next: number) => {
      if (disabled) return;
      const snapped = snapToStep(next, min, max, step);
      if (Math.abs(snapped - value) < EPSILON) return;
      onChange(snapped);
    },
    [disabled, max, min, onChange, step, value],
  );

  const commitFromClientX = useCallback(
    (clientX: number) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      commitValue(min + ratio * (max - min));
    },
    [commitValue, disabled, max, min],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      commitFromClientX(event.clientX);
    };

    const stopDragging = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [commitFromClientX]);

  return (
    <SliderShell ref={trackRef} $disabled={disabled}>
      <StepButton
        type="button"
        $flex={normalizedValue}
        $visible={canDecrease}
        $variant="decrease"
        disabled={disabled || !canDecrease}
        onClick={() => commitValue(value - step)}
      >
        <MinusIcon />
      </StepButton>

      <HandleButton
        type="button"
        disabled={disabled}
        onPointerDown={(event) => {
          if (disabled) return;
          draggingRef.current = true;
          commitFromClientX(event.clientX);
        }}
      >
        <ValuePill>{formatValue(value)}</ValuePill>
      </HandleButton>

      <StepButton
        type="button"
        $flex={1 - normalizedValue}
        $visible={canIncrease}
        $variant="increase"
        disabled={disabled || !canIncrease}
        onClick={() => commitValue(value + step)}
      >
        <PlusIcon />
      </StepButton>
    </SliderShell>
  );
}

const SliderShell = styled.div<{ $disabled: boolean }>`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const StepButton = styled.button<{
  $flex: number;
  $visible: boolean;
  $variant: "decrease" | "increase";
}>`
  flex: ${({ $flex }) => $flex};
  min-width: 0;
  height: 2.2rem;
  border-radius: 999px;
  border: none;
  background: ${({ $variant }) =>
    $variant === "decrease" ? "rgba(33,33,33,0.1)" : "#1a1a1a"};
  color: ${({ $variant }) => ($variant === "decrease" ? "#212121" : "#ffffff")};
  font-size: 1.1rem;
  font-weight: 400;
  cursor: pointer;
  display: ${({ $visible }) => ($visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: flex 0.2s ease;
  overflow: hidden;

  svg {
    min-width: 1rem;
    min-height: 1rem;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    opacity: 0.7;
    transform: scale(0.93);
  }
`;

const HandleButton = styled.button`
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`;

const ValuePill = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #212121;
  background-color: rgba(33, 33, 33, 0.05);
`;

const MinusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.00781 7.99512L12.0078 7.99512"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 12V4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.00781 7.99512L12.0078 7.99512"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
