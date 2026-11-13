import { Suspense, useLayoutEffect, type ReactNode } from "react";
import { useRouteLoading } from "@/store/routeLoading";

function PageReady({ route }: { route: string }) {
  useLayoutEffect(() => {
    useRouteLoading.getState().markReady("page", route);
    return () => useRouteLoading.getState().clearReady("page", route);
  }, [route]);
  return null;
}

export function RouteLoadingBoundary({ route, children }: { route: string; children: ReactNode }) {
  return <Suspense key={route} fallback={null}>
    {children}
    <PageReady route={route} />
  </Suspense>;
}
