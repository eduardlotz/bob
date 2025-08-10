import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { match } from "ts-pattern";
import { ROUTE_PATHS } from "@/store/routeConfig";
import { useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";

// Subscribes to route changes and triggers configured messages.
export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const { showMessage } = useMessageStore();
  const lastRouteRef = useRef<string | null>(null);
  const { manualTaps } = useGameStore();
  const hasShownFirstTapRef = useRef(false);
  const prevTapRef = useRef(0);
  const routeShownRef = useRef<Record<string, boolean>>({});
  // capture persisted welcome flag at mount to distinguish first-ever visit
  const welcomedPersistAtMountRef = useRef(
    !!useMessageStore.getState().repeatFlags["welcome_home"]
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

    match(currentRoute)
      .with(ROUTE_PATHS.HOME, () => {
        if (routeShownRef.current[ROUTE_PATHS.HOME]) return;
        routeShownRef.current[ROUTE_PATHS.HOME] = true;

        if (!welcomedPersistAtMountRef.current) {
          // first-ever session: only welcome and features
          showMessage("welcome_home");
          showMessage("home_features");
        } else {
          // returning session: a single randomized greeting
          const randomGreeting = (Math.floor(Math.random() * 10) % 3) + 1;
          showMessage(`return_greeting_${randomGreeting}`);
        }
      })
      .otherwise(() => {});
  }, [currentRoute, showMessage]);

  // trigger a quest/guide message on first meaningful tap milestone
  useEffect(() => {
    const prev = prevTapRef.current;
    prevTapRef.current = manualTaps;
    if (hasShownFirstTapRef.current) return;
    // only trigger when crossing threshold from below to above
    const threshold = 10;
    if (prev < threshold && manualTaps >= threshold) {
      hasShownFirstTapRef.current = true;
      showMessage("first_tap_hint");
    }
  }, [manualTaps, showMessage]);
}
