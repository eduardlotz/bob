import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { match } from "ts-pattern";
import { ROUTE_PATHS } from "@/store/config/routes";
import { useIsHydrated, useMessageStore } from "@/store/messageStore";
import { useCoreStore } from "@/store/core/store";

export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const isHydrated = useIsHydrated();
  const { showMessage, showMessages, systemPaused } = useMessageStore();
  const lastRouteRef = useRef<string | null>(null);
  const { manualTaps } = useCoreStore();
  const prevTapRef = useRef(0);
  const routeShownRef = useRef<Record<string, boolean>>({});
  const routeChangeTimeoutRef = useRef<NodeJS.Timeout>();

  // show welcome message for every route on first visit
  // show random greeting on home re-visit
  // TODO: refactor for scalability
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
              return showMessages(["welcome_home"]).then((results) => {
                if (results.some(Boolean)) {
                  routeShownRef.current[ROUTE_PATHS.HOME] = true;
                }
              });
            } else {
              // returning visit: random greeting
              const randomGreeting = (Math.floor(Math.random() * 10) % 4) + 1;
              return showMessage(`return_greeting_${randomGreeting}`).then(
                (ok) => {
                  if (ok) routeShownRef.current[ROUTE_PATHS.HOME] = true;
                },
              );
            }
          })
          .with(ROUTE_PATHS.ABOUT, () => {
            if (routeShownRef.current[ROUTE_PATHS.ABOUT]) return;
            return showMessage("about_welcome").then((ok) => {
              if (ok) routeShownRef.current[ROUTE_PATHS.ABOUT] = true;
            });
          })
          .with(ROUTE_PATHS.PORTFOLIO, () => {
            if (routeShownRef.current[ROUTE_PATHS.PORTFOLIO]) return;
            return showMessage("portfolio_welcome").then((ok) => {
              if (ok) routeShownRef.current[ROUTE_PATHS.PORTFOLIO] = true;
            });
          })
          .with(ROUTE_PATHS.MINIGAMES, () => {
            if (routeShownRef.current[ROUTE_PATHS.MINIGAMES]) return;
            const returning =
              !!useMessageStore.getState().repeatFlags["minigames_welcome"];

            if (!returning) {
              // first visit: minigames welcome
              return showMessage("minigames_welcome").then((ok) => {
                if (ok) {
                  routeShownRef.current[ROUTE_PATHS.MINIGAMES] = true;
                }
              });
            } else {
              // returning visit: not ready message
              // return showMessage("minigames_not_ready").then((ok) => {
              //   if (ok) routeShownRef.current[ROUTE_PATHS.MINIGAMES] = true;
              // });
            }
          })
          .otherwise(() => Promise.resolve());
      }, 2000);
    },
    [showMessage, showMessages, isHydrated],
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

  const autoTapHintThreshold = 7;
  // tap related messages
  useEffect(() => {
    if (manualTaps >= autoTapHintThreshold) {
      showMessage("first_tap_hint");
    }
  }, [manualTaps]);
}
