import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type MiniGameType = "LOBBY" | "FOOTBALL" | "PING_PONG";

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

export const useMiniGameStore = create<MiniGameState>()(
  persist(
    immer((set, get) => ({
      activeGame: "LOBBY",

      highScores: {
        LOBBY: 0,
        FOOTBALL: 0,
        PING_PONG: 0,
      },

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
          state.session.score = 0;
        }),

      finishGame: () =>
        set((state) => {
          const game = state.activeGame;
          if (game === "LOBBY") return;

          if (state.session.score > state.highScores[game]) {
            state.highScores[game] = state.session.score;
          }

          state.session.score = 0;
          state.activeGame = "LOBBY";
        }),
    })),
    {
      name: "mini-game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ highScores: state.highScores }),
    },
  ),
);
