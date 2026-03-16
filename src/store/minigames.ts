import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type MiniGameType =
  | "LOBBY"
  | "FOOTBALL"
  | "PING_PONG"
  | "FLAPPY_BIRD"
  | "SLOT_MACHINE";

interface MiniGameState {
  activeGame: MiniGameType;
  setActiveGame: (game: MiniGameType) => void;

  highScores: Record<MiniGameType, number>;

  session: {
    score: number;
  };

  incrementScore: () => void;
  resetScore: () => void;
  finishGame: () => void;
}

const DEFAULT_HIGH_SCORES: Record<MiniGameType, number> = {
  LOBBY: 0,
  FOOTBALL: 0,
  PING_PONG: 0,
  FLAPPY_BIRD: 0,
  SLOT_MACHINE: 0,
};

const sanitizeScore = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const commitSessionHighScore = (
  state: Pick<MiniGameState, "activeGame" | "session" | "highScores">,
) => {
  const game = state.activeGame;
  if (game === "LOBBY") return;

  const currentBest = sanitizeScore(state.highScores[game]);
  const runScore = sanitizeScore(state.session.score);
  if (runScore > currentBest) {
    state.highScores[game] = runScore;
  }
};

export const useMiniGameStore = create<MiniGameState>()(
  persist(
    immer((set) => ({
      activeGame: "LOBBY",

      highScores: { ...DEFAULT_HIGH_SCORES },

      session: {
        score: 0,
      },

      setActiveGame: (game) =>
        set((state) => {
          state.activeGame = game;
          state.session.score = 0;
        }),

      incrementScore: () =>
        set((state) => {
          state.session.score += 1;
        }),

      resetScore: () =>
        set((state) => {
          commitSessionHighScore(state);
          state.session.score = 0;
        }),

      finishGame: () =>
        set((state) => {
          commitSessionHighScore(state);
          state.session.score = 0;
          state.activeGame = "LOBBY";
        }),
    })),
    {
      name: "mini-game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ highScores: state.highScores }),
      merge: (persistedState, currentState) => {
        const persistedHighScores: Partial<Record<MiniGameType, unknown>> =
          (persistedState as Partial<MiniGameState> | undefined)?.highScores ??
          {};

        const mergedHighScores = { ...DEFAULT_HIGH_SCORES };
        (Object.keys(DEFAULT_HIGH_SCORES) as MiniGameType[]).forEach((game) => {
          mergedHighScores[game] = sanitizeScore(persistedHighScores[game]);
        });

        return {
          ...currentState,
          ...(persistedState as Partial<MiniGameState>),
          highScores: mergedHighScores,
        };
      },
    },
  ),
);
