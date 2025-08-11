import { IconProps } from "./types";

export const DecorationIcon = ({ color }: IconProps) => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={color ?? "currentColor"}>
        <defs />
        <path
          className="a"
          d="M8 18.25H1.25a.375.375 0 0 1-.3-.6l3.6-4.8a.375.375 0 0 0-.3-.6h-1.5a.375.375 0 0 1-.3-.6l3.6-4.8a.375.375 0 0 0-.3-.6h-.771a.374.374 0 0 1-.3-.593L7.7 1.427a.375.375 0 0 1 .61 0l3.021 4.23a.374.374 0 0 1-.3.593h-.781a.375.375 0 0 0-.3.6l2.907 3.875"
          fill="none"
          stroke={color ?? "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5px"
        />
        <path
          className="a"
          d="M8 18.25v4.5"
          fill="none"
          stroke={color ?? "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5px"
        />
        <path
          className="a"
          d="M12.5 19.75v-4.5a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v4.5"
          fill="none"
          stroke={color ?? "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5px"
        />
        <path
          className="a"
          d="M11 19.75h12"
          fill="none"
          stroke={color ?? "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5px"
        />
        <path
          className="a"
          d="M14 19.75v3"
          fill="none"
          stroke={color ?? "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5px"
        />
        <path
          className="a"
          d="M20 19.75v3"
          fill="none"
          stroke={color ?? "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5px"
        />
      </g>
    </svg>
  );
};
