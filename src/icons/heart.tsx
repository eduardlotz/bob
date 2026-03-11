import { IconProps } from "./types";

export const HeartIcon = ({ color, style }: IconProps) => {
  return (
    <svg
      style={style}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.00399 12.6682L3.23606 8.34942C0.644804 5.75816 4.45396 0.782938 8.00399 4.80803C11.554 0.782938 15.3459 5.77544 12.7719 8.34942L8.00399 12.6682Z"
        fill={color ?? "#D54141"}
      />
      <path
        d="M8.00399 12.6682L3.23606 8.34942C0.644804 5.75816 4.45396 0.782938 8.00399 4.80803C11.554 0.782938 15.3459 5.77544 12.7719 8.34942L8.00399 12.6682Z"
        stroke={color ?? "#D54141"}
        strokeWidth="1.14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
