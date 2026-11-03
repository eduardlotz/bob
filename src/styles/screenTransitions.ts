import type { MiniGameType } from "@/store/minigames";

export type TransitionShape = "bob" | "circle" | "rounded-rectangle" | "oval" | {
  /** A closed path centered at 0,0, contained within -1..1 on each axis. */
  path: string;
  /** Radius of the largest centered circle contained by the path. */
  innerRadius: number;
  aspectRatio?: number;
};

export interface TransitionAppearance {
  shape: TransitionShape;
  loadingDots?: boolean;
  fill: { kind: "solid"; color: string } | {
    kind: "checkerboard";
    colors: [string, string];
    squareSize: number;
    duration: number;
  };
}

export const PAGE_TRANSITION: TransitionAppearance = {
  shape: "bob",
  fill: { kind: "solid", color: "#000000" },
};

export const GAME_TRANSITION: TransitionAppearance = {
  shape: "bob",
  loadingDots: false,
  fill: { kind: "checkerboard", colors: ["#0b0b0b", "#151515"], squareSize: 80, duration: 3 },
};

// Override shape and/or fill here for an individual destination or game.
export const PAGE_TRANSITIONS: Record<string, Partial<TransitionAppearance>> = {};
export const GAME_TRANSITIONS: Partial<Record<MiniGameType, Partial<TransitionAppearance>>> = {};

export const getPageTransition = (path: string): TransitionAppearance => ({
  ...PAGE_TRANSITION, ...PAGE_TRANSITIONS[path],
});
export const getGameTransition = (game: MiniGameType): TransitionAppearance => ({
  ...GAME_TRANSITION, ...GAME_TRANSITIONS[game],
});
