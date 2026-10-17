import { createContext, useContext, useRef, useLayoutEffect, type PropsWithChildren } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store";
import { sampleWorldEnvironment, type WorldEnvironmentConfig, type WorldEnvironmentState } from "@/types/worldEnvironment";

const calm = { current: sampleWorldEnvironment(0) };
const Context = createContext<{ current: WorldEnvironmentState }>(calm);
export function useWorldEnvironment() {
  const environment = useContext(Context);
  // Reusable vegetation also animates when a consumer has no world provider.
  useFrame(({ clock }) => { if (environment === calm) calm.current.elapsed = clock.elapsedTime; }, -100);
  return environment;
}

/** One clock drives sky, plants, lighting, precipitation, and audio. No frame-level React updates. */
export function WorldEnvironment({ config, children }: PropsWithChildren<{ config?: WorldEnvironmentConfig }>) {
  const environment = useRef(sampleWorldEnvironment(0, config));
  useLayoutEffect(() => {
 environment.current = sampleWorldEnvironment(0, config);
 const seek = (e: Event) => { environment.current = sampleWorldEnvironment((e as CustomEvent).detail, config); };
 window.addEventListener("qaTime", seek);
 return () => window.removeEventListener("qaTime", seek);
 }, [config]);
  useFrame((_, delta) => {
    if (useCoreStore.getState().isPaused || document.hidden) return;
    environment.current = sampleWorldEnvironment(environment.current.elapsed + Math.min(delta, 0.1), config);
  }, -100);
  return <Context.Provider value={environment}>{children}</Context.Provider>;
}
