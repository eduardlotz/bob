import { motion } from "motion/react";
import { IconProps } from "./types";

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
