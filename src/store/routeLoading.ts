import { create } from "zustand";

export type RouteLoadingPart = "page" | "scene" | "shell" | "bob-attached" | "bob-detached";

interface RouteLoadingState {
  ready: Partial<Record<RouteLoadingPart, string>>;
  markReady: (part: RouteLoadingPart, route: string) => void;
  clearReady: (part: RouteLoadingPart, route: string) => void;
}

/** Readiness belongs to the mounted route, independently of cached downloads. */
export const useRouteLoading = create<RouteLoadingState>((set) => ({
  ready: {},
  markReady: (part, route) => set(state => state.ready[part] === route
    ? state
    : { ready: { ...state.ready, [part]: route } }),
  clearReady: (part, route) => set(state => state.ready[part] !== route
    ? state
    : { ready: { ...state.ready, [part]: undefined } }),
}));

export const isRouteReady = (
  route: string,
  state = useRouteLoading.getState(),
) => state.ready.page === route && state.ready.scene === route && state.ready.shell === "shared";

export const isInitialRouteReady = (
  route: string,
  attachedKey: string,
  detachedKey: string,
  state = useRouteLoading.getState(),
) => isRouteReady(route, state) && state.ready["bob-attached"] === attachedKey && state.ready["bob-detached"] === detachedKey;
