import { create } from "zustand";
import { sampleWorldEnvironment, WORLD_DAY_SECONDS, type WorldEnvironmentConfig } from "@/types/worldEnvironment";

export { WORLD_DAY_SECONDS };
export type WeatherOverride = "auto" | "clear" | "rain";
/** Runtime only: world selection and saved progress never own this clock. */
export const worldClock = { elapsed: 0 };
export const useWorldEnvironmentStore = create<{
  running: boolean;
  weather: WeatherOverride;
  seek: (seconds: number) => void;
  setRunning: (running: boolean) => void;
  setWeather: (weather: WeatherOverride) => void;
}>((set) => ({
  running: true,
  weather: "auto",
  seek: (seconds) => { if (Number.isFinite(seconds)) worldClock.elapsed = Math.max(0, seconds); },
  setRunning: (running) => set({ running }),
  setWeather: (weather) => set({ weather }),
}));

/** Every world samples the same time while retaining its own climate support. */
export function sampleGlobalWorldEnvironment(config?: WorldEnvironmentConfig) {
  const state = sampleWorldEnvironment(worldClock.elapsed, config);
  const weather = useWorldEnvironmentStore.getState().weather;
  if (config?.rain && weather !== "auto") {
    state.rain = weather === "rain" ? 1 : 0;
    state.wind = 0.35 + state.rain * 0.65;
  }
  return state;
}
