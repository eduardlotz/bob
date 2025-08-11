import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { match } from "ts-pattern";
import { ROUTE_PATHS } from "@/store/routeConfig";
import { useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";

// Subscribes to route changes and triggers configured messages.
export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const { showMessage, pauseSystem, resumeSystem, systemPaused } =
    useMessageStore();
  const lastRouteRef = useRef<string | null>(null);
  const { manualTaps } = useGameStore();
  const hasShownFirstTapRef = useRef(false);
  const prevTapRef = useRef(0);
  const routeShownRef = useRef<Record<string, boolean>>({});
  const routeChangeTimeoutRef = useRef<NodeJS.Timeout>();
  // capture persisted welcome flag at mount to distinguish first-ever visit
  const welcomedPersistAtMountRef = useRef(
    !!useMessageStore.getState().repeatFlags["welcome_home"]
  );

  // Debounced route change handler to prevent rapid message showing
  const handleRouteChange = useCallback(
    (route: string) => {
      if (routeChangeTimeoutRef.current) {
        clearTimeout(routeChangeTimeoutRef.current);
      }

      routeChangeTimeoutRef.current = setTimeout(() => {
        match(route)
          .with(ROUTE_PATHS.HOME, () => {
            if (routeShownRef.current[ROUTE_PATHS.HOME]) return;
            routeShownRef.current[ROUTE_PATHS.HOME] = true;

            if (!welcomedPersistAtMountRef.current) {
              // First-ever session: stagger messages with delays
              showMessage("welcome_home");
              setTimeout(() => showMessage("home_features"), 3000);
            } else {
              // Returning session: single greeting
              const randomGreeting = (Math.floor(Math.random() * 10) % 3) + 1;
              showMessage(`return_greeting_${randomGreeting}`);
            }
          })
          .with(ROUTE_PATHS.ABOUT, () => {
            if (routeShownRef.current[ROUTE_PATHS.ABOUT]) return;
            routeShownRef.current[ROUTE_PATHS.ABOUT] = true;
            showMessage("about_welcome");
          })
          .otherwise(() => {});
      }, 100); // Small debounce delay
    },
    [showMessage]
  );

  useEffect(() => {
    if (!currentRoute) return;
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
  }, [currentRoute, handleRouteChange]);

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
