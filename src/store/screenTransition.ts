import { create } from "zustand";
import { PAGE_TRANSITION, type TransitionAppearance } from "@/styles/screenTransitions";
import type { MenuTransitionBubble } from "@/utils/menuTransitionBubbles";

export const INITIAL_REVEAL_SECONDS = 1.8 / 1.15;
export const SCREEN_TRANSITION_SECONDS = 0.9;
export const MINIMUM_TRANSITION_HOLD_MS = 180;

export type ScreenTransitionPhase = "loading" | "idle" | "closing" | "covered" | "opening";
export type ScreenTransitionAction = () => void | Promise<void>;

interface TransitionRequest {
  id: number;
  initial: boolean;
  appearance: TransitionAppearance;
  keepBobVisible: boolean;
  menuBubbles?: MenuTransitionBubble[];
  action?: ScreenTransitionAction;
  onRevealed?: () => void;
  onFinished?: () => void;
}

interface ScreenTransitionState {
  phase: ScreenTransitionPhase;
  request: TransitionRequest | null;
  reveal: (onRevealed?: () => void) => boolean;
  run: (action: ScreenTransitionAction, onRevealed?: () => void, options?: { appearance?: TransitionAppearance; keepBobVisible?: boolean; menuBubbles?: MenuTransitionBubble[]; onFinished?: () => void }) => boolean;
  advance: (id: number, phase: ScreenTransitionPhase) => void;
  complete: (id: number, succeeded?: boolean) => void;
}

// Transient UI state: never persist a closed curtain across page loads.
export const useScreenTransition = create<ScreenTransitionState>((set, get) => {
  let nextId = 0;
  return {
    phase: "loading",
    request: null,
    reveal: (onRevealed) => {
      if (get().phase !== "loading") return false;
      set({ phase: "opening", request: { id: ++nextId, initial: true, appearance: PAGE_TRANSITION, keepBobVisible: false, onRevealed } });
      return true;
    },
    run: (action, onRevealed, options) => {
      if (get().phase !== "idle") return false;
      set({ phase: "closing", request: {
        id: ++nextId, initial: false, action, onRevealed,
        appearance: options?.appearance ?? PAGE_TRANSITION,
        keepBobVisible: options?.keepBobVisible ?? false,
        menuBubbles: options?.menuBubbles,
        onFinished: options?.onFinished,
      } });
      return true;
    },
    advance: (id, phase) => {
      if (get().request?.id === id) set({ phase });
    },
    complete: (id, succeeded = true) => {
      const request = get().request;
      if (request?.id !== id) return;
      set({ phase: "idle", request: null });
      request.onFinished?.();
      if (succeeded) request.onRevealed?.();
    },
  };
});

/** Change the scene only once the circle has closed; resume play after it opens. */
export const transitionScreen = (...args: Parameters<ScreenTransitionState["run"]>) =>
  useScreenTransition.getState().run(...args);
