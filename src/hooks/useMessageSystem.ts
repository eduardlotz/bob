import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { match } from "ts-pattern";
import { ROUTE_PATHS } from "@/store/routeConfig";
import { useIsHydrated, useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";

// Subscribes to route changes and triggers configured messages.
export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const isHydrated = useIsHydrated();
  const { showMessage, showMessages, pauseSystem, resumeSystem, systemPaused } =
    useMessageStore();
  const lastRouteRef = useRef<string | null>(null);
  const { manualTaps } = useGameStore();
  const hasShownFirstTapRef = useRef(false);
  const prevTapRef = useRef(0);
  const routeShownRef = useRef<Record<string, boolean>>({});
  const routeChangeTimeoutRef = useRef<NodeJS.Timeout>();
  // note: determine returning vs first visit only after hydration

  // Debounced route change handler to prevent rapid message showing
  const handleRouteChange = useCallback(
    async (route: string) => {
      if (routeChangeTimeoutRef.current) {
        clearTimeout(routeChangeTimeoutRef.current);
      }

      routeChangeTimeoutRef.current = setTimeout(async () => {
        if (!isHydrated) return;

        await match(route)
          .with(ROUTE_PATHS.HOME, () => {
            if (routeShownRef.current[ROUTE_PATHS.HOME]) return;

            const returning =
              !!useMessageStore.getState().repeatFlags["welcome_home"];

            if (!returning) {
              // first visit: queue both in order
              return showMessages(["welcome_home", "home_features"]).then(
                (results) => {
                  if (results.some(Boolean)) {
                    routeShownRef.current[ROUTE_PATHS.HOME] = true;
                  }
                }
              );
            } else {
              // returning visit: random greeting
              const randomGreeting = (Math.floor(Math.random() * 10) % 4) + 1;
              return showMessage(`return_greeting_${randomGreeting}`).then(
                (ok) => {
                  if (ok) routeShownRef.current[ROUTE_PATHS.HOME] = true;
                }
              );
            }
          })
          .with(ROUTE_PATHS.ABOUT, () => {
            if (routeShownRef.current[ROUTE_PATHS.ABOUT]) return;
            return showMessage("about_welcome").then((ok) => {
              if (ok) routeShownRef.current[ROUTE_PATHS.ABOUT] = true;
            });
          })
          .otherwise(() => Promise.resolve());
      }, 100); // Small debounce delay
    },
    [showMessage, showMessages, isHydrated]
  );

  useEffect(() => {
    if (!currentRoute || !isHydrated) return;
    if (
      currentRoute === lastRouteRef.current &&
      routeShownRef.current[currentRoute]
    ) {
      return;
    }
    lastRouteRef.current = currentRoute;
    handleRouteChange(currentRoute);

    return () => {
      if (routeChangeTimeoutRef.current) {
        clearTimeout(routeChangeTimeoutRef.current);
      }
    };
  }, [currentRoute, isHydrated, handleRouteChange]);

  // Enhanced tap milestone tracking
  useEffect(() => {
    const prev = prevTapRef.current;
    prevTapRef.current = manualTaps;

    if (hasShownFirstTapRef.current || systemPaused) return;

    const threshold = 10;
    if (prev < threshold && manualTaps >= threshold) {
      hasShownFirstTapRef.current = true;
      // Add slight delay to avoid conflicting with route messages
      setTimeout(() => showMessage("first_tap_hint"), 1500);
    }
  }, [manualTaps, showMessage, systemPaused]);

  // Listen for final reset completion to re-trigger message logic
  useEffect(() => {
    const handleFinalResetComplete = (event: CustomEvent) => {
      console.log(
        "[MESSAGE SYSTEM] Final reset completed, re-checking messages for route:",
        event.detail?.route
      );
      // clear the route shown flag and directly trigger welcome messages
      if (event.detail?.route === ROUTE_PATHS.HOME) {
        routeShownRef.current = {};
        lastRouteRef.current = null;

        // directly trigger welcome messages since we know repeatFlags are cleared
        console.log(
          "[MESSAGE SYSTEM] Directly triggering welcome messages after final reset"
        );
        showMessages(["welcome_home", "home_features"]).then((results) => {
          if (results.some(Boolean)) {
            routeShownRef.current[ROUTE_PATHS.HOME] = true;
          }
        });
      } else if (event.detail?.route) {
        // for other routes, use normal flow
        routeShownRef.current = {};
        lastRouteRef.current = null;
        handleRouteChange(event.detail.route);
      }
    };

    window.addEventListener(
      "finalResetComplete",
      handleFinalResetComplete as EventListener
    );
    return () => {
      window.removeEventListener(
        "finalResetComplete",
        handleFinalResetComplete as EventListener
      );
    };
  }, [handleRouteChange, showMessages]);

  // Pause system during critical interactions
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.hidden) {
  //       pauseSystem();
  //     } else {
  //       resumeSystem();
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   return () =>
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  // }, [pauseSystem, resumeSystem]);
}
