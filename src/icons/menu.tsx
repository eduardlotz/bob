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
        d="M5 16L19 16"
        stroke={color ?? "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M5 8L19 8"
        stroke={color ?? "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
};
