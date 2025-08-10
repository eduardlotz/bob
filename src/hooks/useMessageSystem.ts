import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { match } from "ts-pattern";
import { ROUTE_PATHS } from "@/store/routeConfig";
import { useMessageStore } from "@/store/messageStore";

// Subscribes to route changes and triggers configured messages.
export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const { showMessage } = useMessageStore();
  const lastRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentRoute || currentRoute === lastRouteRef.current) return;
    lastRouteRef.current = currentRoute;

    match(currentRoute)
      .with(ROUTE_PATHS.HOME, () => {
        showMessage("welcome_home");
        showMessage("home_features");
      })
      .otherwise(() => {});
  }, [currentRoute, showMessage]);
}
