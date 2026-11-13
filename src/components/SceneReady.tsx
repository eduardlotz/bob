import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useRouteLoading, type RouteLoadingPart } from "@/store/routeLoading";

/** A committed Suspense subtree must paint before its loader opens. */
export function SceneReady({ route, part = "scene" }: { route: string; part?: Exclude<RouteLoadingPart, "page"> }) {
  const frames = useRef(0);
  useLayoutEffect(() => {
    frames.current = 0;
    return () => useRouteLoading.getState().clearReady(part, route);
  }, [part, route]);
  useFrame(() => {
    if (frames.current < 2 && ++frames.current === 2) {
      useRouteLoading.getState().markReady(part, route);
    }
  });
  return null;
}
