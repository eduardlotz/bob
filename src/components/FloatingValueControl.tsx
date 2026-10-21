import type { ReactNode } from "react";
import styled, { css } from "styled-components";
import { FloatingActionButton, floatingActionButtonStyles, type FloatingButtonStyleProps } from "./FloatingActionButton";

interface FloatingValueControlProps {
  spread?: boolean;
  variant?: FloatingButtonStyleProps["$variant"];
  label: string;
  icon: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

/** Discrete scene controls: no slider track, drag handle, or surrounding card. */
export function FloatingValueControl({ spread = false, variant = "blue", label, icon, value, min, max, step, onChange }: FloatingValueControlProps) {
  const change = (direction: number) => {
    const next = Number((value + direction * step).toFixed(6));
    onChange(Math.max(min, Math.min(max, next)));
  };

  return (
    <ControlGroup role="group" aria-label={label} $spread={spread} data-spread={spread}>
      <StepButton $variant={variant} type="button" aria-label={`${label} −`} disabled={value <= min + 0.000001}
        onClick={() => change(-1)} data-ui-sound-id="ui-tap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </StepButton>
      <Value $variant={variant} aria-label={`${label}: ${Number(value.toFixed(2))}`} title={label} aria-live="polite">
        {icon}<span>{Number(value.toFixed(2))}</span>
      </Value>
      <StepButton $variant={variant} type="button" aria-label={`${label} +`} disabled={value >= max - 0.000001}
        onClick={() => change(1)} data-ui-sound-id="ui-tap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </StepButton>
    </ControlGroup>
  );
}

const ControlGroup = styled.div<{ $spread: boolean }>`
  display: grid;
  grid-template-columns: 44px 60px 44px;
  gap: 6px;
  width: fit-content;
  align-items: center;
  pointer-events: none;
  ${({ $spread }) => $spread && css`
    @media (min-width: 721px) {
      grid-template-columns: subgrid;
      width: 100%;
      > button:first-child { grid-column: 1; grid-row: 1; justify-self: end; width: 44px; }
      > button:last-child { grid-column: 3; grid-row: 1; justify-self: start; width: 44px; }
      > output { grid-column: 2; grid-row: 2; justify-self: center; width: 60px; margin-top: 64px; }
    }
  `}
  @media (max-width: 380px) {
    grid-template-columns: 36px 50px 36px;
    gap: 4px;
  }
`;
const StepButton = styled(FloatingActionButton)`
  width: 100%;
  height: 48px;
  padding: 0;
  border-radius: 18px;
  svg { flex-shrink: 0; }
  @media (max-width: 600px) and (max-height: 740px) { height: 36px; }
`;
const Value = styled.output<FloatingButtonStyleProps>`
  ${floatingActionButtonStyles}
  width: 100%;
  height: 52px;
  padding: 4px;
  flex-direction: column;
  gap: 1px;
  border-radius: 18px;
  font-size: 0.8rem;
  line-height: 1;
  svg { flex-shrink: 0; }
  @media (max-width: 600px) and (max-height: 740px) {
    height: 40px;
    font-size: 0.7rem;
    svg { width: 16px; height: 16px; }
  }
`;
