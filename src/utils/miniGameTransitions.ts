import { useMiniGameStore } from "@/store/minigames";
import { transitionScreen } from "@/store/screenTransition";
import { getGameTransition } from "@/styles/screenTransitions";
import { stopAllWorldSounds } from "@/utils/soundSystem";

/** All game exit controls share the same cover/change/reveal sequence. */
export function exitMiniGame() {
  const game = useMiniGameStore.getState().activeGame;
  if (game === "LOBBY") return false;
  return transitionScreen(() => {
    stopAllWorldSounds();
    useMiniGameStore.getState().finishGame();
  }, undefined, { appearance: getGameTransition(game) });
}
