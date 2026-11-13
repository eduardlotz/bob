import { useLayoutEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useAppStore, useCoreStore, useMiniGameStore } from "@/store";
import { transitionScreen, useScreenTransition } from "@/store/screenTransition";
import { getPageTransition } from "@/styles/screenTransitions";
import { useViewStore } from "@/store/viewStore";

/** Includes menu navigation, redirects, and browser back/forward. */
export function RouteScreenTransitions() {
  const phase = useScreenTransition(state => state.phase);
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    useCoreStore.getState().isReady && currentLocation.pathname !== nextLocation.pathname,
  );
  const latestBlocker = useRef(blocker);
  latestBlocker.current = blocker;

  useLayoutEffect(() => {
    if (blocker.state !== "blocked" || phase !== "idle") return;
    const accepted = transitionScreen(() => {
      // A second history action during the close can replace the destination.
      const pending = latestBlocker.current;
      if (pending.state === "blocked") {
        if (useMiniGameStore.getState().activeGame !== "LOBBY") useMiniGameStore.getState().finishGame();
        pending.proceed();
      }
    }, undefined, {
      keepBobVisible: true, appearance: getPageTransition(blocker.location.pathname),
      onFinished: () => useViewStore.getState().finishLoadingCamera(useAppStore.getState().currentRoute),
    });
    if (accepted) void useViewStore.getState().beginLoadingCamera();
  }, [blocker, phase]);

  return null;
}
