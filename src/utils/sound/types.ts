export type SoundType = "tap" | "world" | "ui" | "text";

export type SoundCategory =
  | "tap"
  | "action"
  | "effect"
  | "background"
  | "ambient"
  | "ui"
  | "text"
  | (string & {});

export type SoundOverlapMode =
  | "layer"
  | "restart"
  | "ignore"
  | "replace-group";

export type SoundLimitBehavior = "stop-oldest" | "skip-new";

export interface SoundDetuneConfig {
  enabled: boolean;
  minSemitones: number;
  maxSemitones: number;
}

export interface SoundPlaybackConfig {
  group?: string;
  overlap?: SoundOverlapMode;
  maxConcurrent?: number;
  limitBehavior?: SoundLimitBehavior;
}

export interface SoundConfig {
  id: string;
  filePath: string;
  src?: string | string[];
  type: SoundType;
  category?: SoundCategory;
  volume: number;
  loop?: boolean;
  preload?: boolean;
  html5?: boolean;
  pool?: number;
  fadeIn?: number;
  fadeOut?: number;
  distanceAttenuation?: boolean;
  detune?: SoundDetuneConfig;
  playback?: SoundPlaybackConfig;
  stopPrevious?: boolean;
  layerable?: boolean;
}

export interface NormalizedSoundConfig
  extends Omit<SoundConfig, "src" | "playback"> {
  src: string[];
  category: SoundCategory;
  loop: boolean;
  preload: boolean;
  html5: boolean;
  pool: number;
  fadeIn: number;
  fadeOut: number;
  distanceAttenuation: boolean;
  detune?: SoundDetuneConfig;
  playback: Required<SoundPlaybackConfig>;
}

export interface SoundInstance {
  id: string;
  soundId: string;
  howlId: number;
  config: NormalizedSoundConfig;
  startedAt: number;
  attenuation: number;
}

export interface SoundSystemState {
  enabled: boolean;
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;
  uiVolume: number;
  textVolume: number;
  tapEnabled?: boolean;
  worldEnabled?: boolean;
}
