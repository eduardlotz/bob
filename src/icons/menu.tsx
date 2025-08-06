import { IconProps } from "./types";

export const MenuIcon = ({ color }: IconProps) => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 17L19 17"
        stroke={color ?? "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M5 7L19 7"
        stroke={color ?? "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M5 12L19 12"
        stroke={color ?? "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
};
