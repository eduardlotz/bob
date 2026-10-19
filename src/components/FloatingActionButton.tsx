import { motion } from "motion/react";
import styled, { css } from "styled-components";

export interface FloatingButtonStyleProps {
  $variant?: "blue" | "dark" | "white";
}

const BUTTON_PALETTES = {
  blue: { background: "#4178f7", edge: "#2a5ee2", text: "#fff" },
  dark: { background: "#212026", edge: "#0b0b0c", text: "#fff" },
  white: { background: "#fff", edge: "#D0CEDD", text: "#212026" },
} as const;

/** Shared raised button treatment for controls that float over the scene. */
export const floatingActionButtonStyles = css<FloatingButtonStyleProps>`
  --floating-button-edge: ${({ $variant = "blue" }) => BUTTON_PALETTES[$variant].edge};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: fit-content;
  padding: 12px 20px 12px 12px;
  border-radius: 24px;
  border: 3px solid var(--floating-button-edge);
  background: ${({ $variant = "blue" }) => BUTTON_PALETTES[$variant].background};
  box-shadow: 0 5px 0 var(--floating-button-edge);
  color: ${({ $variant = "blue" }) => BUTTON_PALETTES[$variant].text};
  font-size: 1rem;
  font-weight: 900;
  pointer-events: auto;
  &:hover:not(:disabled) { filter: brightness(1.05); }
  &:focus-visible { outline: 2px solid ${({ $variant }) => $variant === "white" ? "#212026" : "#fff"}; outline-offset: 3px; }
  &:disabled { opacity: 0.35; cursor: default; }
`;

export const FloatingActionButton = styled(motion.button)<FloatingButtonStyleProps>`
  ${floatingActionButtonStyles}
`;
