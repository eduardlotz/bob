import { createElement, type ReactNode } from "react";

type QuestTrophyIconProps = {
  emoji?: string;
  color?: string;
  size?: number;
  muted?: boolean;
};

export const QuestTrophyIcon = ({
  emoji = "🏆",
  color = "#8A4CAB",
  size = 24,
  muted = false,
}: QuestTrophyIconProps) => {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: muted ? 0.66 : 1,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 41 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g style={{ filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.15))" }}>
          <path
            d="M16.1882 4.85904C15.1653 5.73077 13.8934 6.25759 12.5537 6.3645C9.4273 6.61399 6.94471 9.09658 6.69522 12.223C6.58831 13.5627 6.06149 14.8345 5.18976 15.8575C3.1555 18.2446 3.1555 21.7555 5.18976 24.1426C6.06149 25.1655 6.58831 26.4373 6.69522 27.7771C6.94471 30.9034 9.4273 33.386 12.5537 33.6355C13.8934 33.7424 15.1653 34.2692 16.1882 35.141C18.5753 37.1752 22.0862 37.1752 24.4733 35.141C25.4962 34.2692 26.7681 33.7424 28.1078 33.6355C31.2342 33.386 33.7168 30.9034 33.9662 27.7771C34.0731 26.4373 34.6 25.1655 35.4717 24.1426C37.506 21.7555 37.506 18.2446 35.4717 15.8575C34.6 14.8345 34.0731 13.5627 33.9662 12.223C33.7168 9.09658 31.2342 6.61399 28.1078 6.3645C26.7681 6.25759 25.4962 5.73077 24.4733 4.85904C22.0862 2.82478 18.5753 2.82478 16.1882 4.85904Z"
            fill={color}
            stroke="white"
            strokeWidth="3.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateY(-1px)",
          fontSize: Math.max(8, size * 0.4),
          lineHeight: 1,
          color: "#212121",
        }}
      >
        {emoji}
      </span>
    </div>
  );
};

export const createQuestToastIcon = (
  questId: string,
  color?: string,
  emoji?: string,
): ReactNode =>
  createElement(QuestTrophyIcon, {
    emoji,
    color,
    size: 18,
  });
