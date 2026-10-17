import { createContext, useContext, useRef, useLayoutEffect, type PropsWithChildren } from "react";
import { useFrame } from "@react-three/fiber";
import { worldClock, useWorldEnvironmentStore, sampleGlobalWorldEnvironment } from "@/store/worldEnvironmentStore";
import { useCoreStore } from "@/store";
import { sampleWorldEnvironment, type WorldEnvironmentConfig, type WorldEnvironmentState } from "@/types/worldEnvironment";

const calm = { current: sampleWorldEnvironment(0) };
const ConfigContext = createContext<WorldEnvironmentConfig | undefined>(undefined);
export const useWorldEnvironmentConfig = () => useContext(ConfigContext);
const Context = createContext<{ current: WorldEnvironmentState }>(calm);
export function useWorldEnvironment() {
  const environment = useContext(Context);
  // Reusable vegetation also animates when a consumer has no world provider.
  useFrame(({ clock }) => { if (environment === calm) calm.current.elapsed = clock.elapsedTime; }, -100);
  return environment;
}

/** One clock drives sky, plants, lighting, precipitation, and audio. No frame-level React updates. */
export function WorldEnvironment({ config, children }: PropsWithChildren<{ config?: WorldEnvironmentConfig }>) {
  const sample = () => sampleGlobalWorldEnvironment(config);
  const environment = useRef(sample());
  useLayoutEffect(() => {
    environment.current = sample();
    const seek = (event: Event) => useWorldEnvironmentStore.getState().seek((event as CustomEvent<number>).detail);
    window.addEventListener("qaTime", seek);
    return () => window.removeEventListener("qaTime", seek);
  }, [config]);
  useFrame((_, delta) => {
    if (!useCoreStore.getState().isPaused && !document.hidden && useWorldEnvironmentStore.getState().running) {
      worldClock.elapsed += Math.min(delta, 0.1);
    }
    environment.current = sample();
  }, -100);
  return <ConfigContext.Provider value={config}><Context.Provider value={environment}>{children}</Context.Provider></ConfigContext.Provider>;
}
