import { motion } from "framer-motion";
import styled from "styled-components";

interface IconProps {
  color?: string;
}

export const LockIcon = ({ color }: IconProps) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/motion.svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill={color ?? "currentColor"}
      fillRule="evenodd"
      d="M18.28 8.28v1.25c2.8.35 3.72 1.77 3.72 5.26v1.86c0 4.1-1.25 5.35-5.35 5.35h-9.3C3.25 22 2 20.75 2 16.65v-1.86c0-3.49.92-4.91 3.72-5.26V8.28C5.72 5.58 6.37 2 12 2s6.28 3.58 6.28 6.28zM7.12 9.44h.23v.01H16.88V8.28c0-2.93-.83-4.88-4.88-4.88S7.12 5.35 7.12 8.28v1.16zM10 15a2 2 0 112.969 1.75c.02.08.031.164.031.25v1a1 1 0 11-2 0v-1c0-.086.01-.17.031-.25A2 2 0 0110 15z"
      clipRule="evenodd"
    />
  </motion.svg>
);

export const UnlockedIcon = ({ color }: IconProps) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/motion.svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill={color ?? "currentColor"}
      fillRule="evenodd"
      d="M7.12 9.44H16.65c4.1 0 5.35 1.25 5.35 5.35v1.86c0 4.1-1.25 5.35-5.35 5.35h-9.3C3.25 22 2 20.75 2 16.65v-1.86c0-3.49.92-4.91 3.72-5.26V8.28C5.72 5.58 6.37 2 12 2c4.17 0 6.28 1.8 6.28 5.35 0 .39-.31.7-.7.7-.39 0-.7-.31-.7-.7 0-1.84-.55-3.95-4.88-3.95-4.05 0-4.88 1.95-4.88 4.88v1.16zM10 15a2 2 0 112.969 1.75c.02.08.031.164.031.25v1a1 1 0 11-2 0v-1c0-.086.01-.17.031-.25A2 2 0 0110 15z"
      clipRule="evenodd"
    />
  </motion.svg>
);

export const CheckmarkIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill={color ?? "currentColor"}
      fillRule="evenodd"
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm4.707-11.293a1 1 0 00-1.414-1.414L11 13.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5z"
      clipRule="evenodd"
    />
  </svg>
);

export const DownloadIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke={color ?? "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 19h14M12 5v8.167m-3.5-2.334l3.5 3.5 3.5-3.5"
    />
  </svg>
);

export const ArrowRightIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke={color ?? "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 12h14m0 0l-5.25 5M19 12l-5.25-5"
    />
  </svg>
);

export const ArrowLeftIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke={color ?? "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12H5m0 0l6-6m-6 6l6 6"
    />
  </svg>
);

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
