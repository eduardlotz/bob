import { IconProps } from "./types";

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
      d="M19 12H5M5 12L10.25 17M5 12L10.25 7"
    />
  </svg>
);
