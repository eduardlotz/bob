import { createElement, useId, type ReactNode } from "react";

type QuestTrophyIconProps = {
  questId: string;
  color?: string;
  size?: number;
  compact?: boolean;
  muted?: boolean;
};

type QuestIconPalette = {
  background: string;
  foreground: string;
};

const hashQuestId = (questId: string): number => {
  let hash = 0;

  for (let index = 0; index < questId.length; index += 1) {
    hash = (hash << 5) - hash + questId.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const QUEST_ICON_PALETTES: QuestIconPalette[] = [
  {
    background: "#E8D8F1",
    foreground: "#8A4CAB",
  },
  {
    background: "#E4F0DA",
    foreground: "#3D8A58",
  },
  {
    background: "#DCE7F7",
    foreground: "#3D66A8",
  },
  {
    background: "#F4E4D5",
    foreground: "#B7773B",
  },
];

const pickQuestPalette = (questId: string): QuestIconPalette => {
  const hash = hashQuestId(questId);
  return QUEST_ICON_PALETTES[hash % QUEST_ICON_PALETTES.length];
};

const pickQuestShape = (questId: string): "circle" | "square" | "triangle" => {
  const hash = hashQuestId(questId);
  const shapeIndex = hash % 3;
  if (shapeIndex === 0) return "circle";
  if (shapeIndex === 1) return "square";
  return "triangle";
};

const withAlpha = (hexColor: string, alpha: number): string => {
  const hex = hexColor.replace("#", "");
  const value = hex.length === 3
    ? hex
        .split("")
        .map((char) => char + char)
        .join("")
    : hex;

  if (value.length !== 6) {
    return hexColor;
  }

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const QuestTrophyIcon = ({
  questId,
  color,
  size = 30,
  compact = false,
  muted = false,
}: QuestTrophyIconProps) => {
  const palette = pickQuestPalette(questId);
  const foreground = color ?? palette.foreground;
  const background = color ? withAlpha(color, compact ? 0.28 : 0.22) : palette.background;
  const shape = pickQuestShape(questId);
  const uid = useId().replaceAll(":", "");
  const squircleId = `${uid}-squircle`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{
        display: "block",
        opacity: muted ? 0.58 : 1,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={squircleId} x1="5" y1="5" x2="27" y2="27">
          <stop offset="0" stopColor={background} stopOpacity="0.98" />
          <stop offset="1" stopColor={background} stopOpacity="0.84" />
        </linearGradient>
      </defs>

      <rect
        x={3}
        y={3}
        width={26}
        height={26}
        rx={compact ? 8 : 9}
        fill={`url(#${squircleId})`}
      />

      {shape === "circle" && <circle cx={16} cy={16} r={compact ? 4.2 : 4.8} fill={foreground} />}
      {shape === "square" && (
        <rect
          x={compact ? 11.7 : 11.1}
          y={compact ? 11.7 : 11.1}
          width={compact ? 8.6 : 9.8}
          height={compact ? 8.6 : 9.8}
          rx={1.7}
          fill={foreground}
        />
      )}
      {shape === "triangle" && (
        <path
          d={
            compact
              ? "M16 10.7L21.5 20.5H10.5L16 10.7Z"
              : "M16 10.1L22.3 21.3H9.7L16 10.1Z"
          }
          fill={foreground}
        />
      )}
    </svg>
  );
};

export const createQuestToastIcon = (
  questId: string,
  color?: string,
): ReactNode =>
  createElement(QuestTrophyIcon, {
    questId,
    color,
    size: 15,
    compact: true,
  });
