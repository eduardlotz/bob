import { motion } from "motion/react";
import styled from "styled-components";

export const LoadingSpinner = styled(motion.span)<{ color?: string }>`
  width: 24px;
  height: 24px;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    width: 80%;
    height: 80%;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: auto;

    border: 3px solid #0000;
    border-color: ${(p) => (p.color ? `${p.color} ${p.color}` : "#fff #fff")}
      #0000 #0000;
    border-radius: 50%;

    animation: rotate 2s cubic-bezier(0.2, 0.5, 0.2, 0.6) infinite;
    transform: rotate(-260deg);
    transform-origin: center;
  }

  @keyframes rotate {
    0% {
      transform: rotate(-260deg);
    }
    50% {
      transform: rotate(-200deg);
    }
    100% {
      transform: rotate(-260deg);
    }
  }
`;
