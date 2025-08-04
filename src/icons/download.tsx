import { IconProps } from "./types";

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
