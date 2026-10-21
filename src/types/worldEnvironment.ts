/** One full day/night loop, shared by world presets and the time controls. */
export const WORLD_DAY_SECONDS = 180;

/** World-authored settings; runtime values never enter the saved game. */
export interface WorldEnvironmentConfig {
  dayNight?: {
    durationSeconds: number;
    /** Lock only the sky/light phase: 0 is noon, .5 is midnight. Animation time continues. */
    fixedPhase?: number;
    nightSky: [string, string, string];
    nightAmbient: number;
    nightDirectional: number;
  };
  nightLight?: "fire" | "street" | "moon";
  rain?: { drySeconds: number; wetSeconds: number; transitionSeconds: number };
}

export type WorldSoundCondition = "always" | "rain" | "dry" | "day" | "night";
export interface WorldSoundExcerpt {
  startSeconds: number;
  durationSeconds: number;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}
export interface EnvironmentSoundLayer {
  soundId: string;
  volume: number;
  mode: "loop" | "random";
  /** Seconds between accent opportunities; active clips never overlap themselves. */
  intervalSeconds?: [number, number];
  condition?: WorldSoundCondition;
  fadeSeconds?: number;
  /** Optional natural-end envelope for random accents, in seconds. */
  accentFade?: { inSeconds: number; outSeconds: number };
  /** Randomly choose a timestamp/duration in the layer's source file. */
  excerpts?: WorldSoundExcerpt[];
}
export interface EnvironmentAudioConfig {
  music?: { soundId: string; volume?: number };
  layers: EnvironmentSoundLayer[];
}

/** Compatibility names for world-authored catalogues. Objects use the same contract. */
export type WorldSoundLayer = EnvironmentSoundLayer;
export type WorldAudioConfig = EnvironmentAudioConfig;

export interface WorldEnvironmentState {
  elapsed: number;
  daylight: number;
  rain: number;
  wind: number;
}

const smooth = (t: number) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };

export function worldDayPhase(elapsed: number, config?: WorldEnvironmentConfig) {
  const cycle = config?.dayNight;
  return cycle?.fixedPhase ?? elapsed / Math.max(1, cycle?.durationSeconds ?? WORLD_DAY_SECONDS);
}

/** Starts in daylight and calm weather; wraps continuously at both boundaries. */
export function sampleWorldEnvironment(elapsed: number, config?: WorldEnvironmentConfig): WorldEnvironmentState {
  const cycle = config?.dayNight;
  const daylight = cycle
    ? smooth((Math.cos(worldDayPhase(elapsed, config) * Math.PI * 2) + 0.25) / 0.65)
    : 1;
  let rain = 0;
  if (config?.rain) {
    const { drySeconds, wetSeconds, transitionSeconds } = config.rain;
    const duration = Math.max(1, drySeconds + wetSeconds);
    const phase = ((elapsed % duration) + duration) % duration;
    const fade = Math.max(0.001, Math.min(transitionSeconds, wetSeconds / 2));
    rain = smooth((phase - drySeconds) / fade) * (1 - smooth((phase - (duration - fade)) / fade));
  }
  return { elapsed, daylight, rain, wind: 0.35 + rain * 0.65 };
}

export function worldSoundGain(condition: WorldSoundCondition = "always", state: WorldEnvironmentState) {
  switch (condition) {
    case "rain": return state.rain;
    case "dry": return 1 - state.rain;
    case "day": return state.daylight * (1 - state.rain * 0.85);
    case "night": return 1 - state.daylight;
    default: return 1;
  }
}
