import { motion } from "motion/react";
import styled, { css } from "styled-components";

export interface FloatingButtonStyleProps {
  $variant?: "blue" | "dark";
}

/** Shared raised button treatment for controls that float over the scene. */
export const floatingActionButtonStyles = css<FloatingButtonStyleProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: fit-content;
  padding: 12px 20px 12px 12px;
  border-radius: 24px;
  border: 3px solid ${({ $variant }) => $variant === "dark" ? "#0b0b0c" : "#2a5ee2"};
  background: ${({ $variant }) => $variant === "dark" ? "#212026" : "#4178f7"};
  box-shadow: 0 5px 0 ${({ $variant }) => $variant === "dark" ? "#0b0b0c" : "#2a5ee2"};
  color: #fff;
  font-size: 1rem;
  font-weight: 900;
  pointer-events: auto;
  &:hover:not(:disabled) { filter: brightness(1.05); }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  &:disabled { opacity: 0.35; cursor: default; }
`;

export const FloatingActionButton = styled(motion.button)<FloatingButtonStyleProps>`
  ${floatingActionButtonStyles}
`;
