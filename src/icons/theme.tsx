import { IconProps } from "./types";

export const ThemeIcon = ({ color }: IconProps) => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7C21 5.9 20.1 5 19 5H17V7H19V9H17V11H19V13H17V15H19V17H17V19H19C20.1 19 21 18.1 21 17V15H19V13H21V11H19V9H21ZM12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8ZM12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14ZM5 5H7V7H5V9H7V11H5V13H7V15H5V17H7V19H5C3.9 19 3 18.1 3 17V7C3 5.9 3.9 5 5 5Z"
        stroke={color ?? "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
