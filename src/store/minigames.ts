import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type MiniGameType = "LOBBY" | "FOOTBALL" | "PING_PONG";

interface MiniGameState {
  // Navigation
  activeGame: MiniGameType;
  setActiveGame: (game: MiniGameType) => void;

  // Persistent Highscores (Saved to LocalStorage)
  highScores: {
    FOOTBALL: number;
    PING_PONG: number;
  };

  // Temporary Session Data (Reset when game starts/ends)
  session: {
    score: number;
  };

  // Actions
  incrementScore: () => void;
  resetScore: () => void;
  finishGame: () => void; // Saves highscore and resets session
}

export const useMiniGameStore = create<MiniGameState>()(
  persist(
    immer((set, get) => ({
      activeGame: "LOBBY",

      highScores: {
        FOOTBALL: 0,
        PING_PONG: 0,
      },

      session: {
        score: 0,
      },

      setActiveGame: (game) =>
        set((state) => {
          state.activeGame = game;
          state.session.score = 0; // Reset session whenever we switch games
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

          // Check if current session beat the persistent highscore
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
      // Only persist highScores, not the current session or active game
      partialize: (state) => ({ highScores: state.highScores }),
    },
  ),
);
