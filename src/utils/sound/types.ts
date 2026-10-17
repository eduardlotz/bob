import type { SoundDefinition, VoiceHandle } from "@web-kits/audio";

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
  filePath?: string;
  /** Synthesized UI cues use the package's shared UI output bus. */
  synthesis?: SoundDefinition;
  src?: string | string[];
  /** Named excerpts in milliseconds, passed to Howler's sprite playback. */
  sprite?: Record<string, [number, number]>;
  spriteName?: string;
  /** Fade to silence before a non-looping recording or excerpt reaches its end. */
  fadeOutAtEnd?: boolean;
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
  howlId?: number;
  synth?: {
    voice: VoiceHandle;
    endsAt: number;
    cleanupTimer?: ReturnType<typeof setTimeout>;
  };
  config: NormalizedSoundConfig;
  startedAt: number;
  attenuation: number;
  stopping?: boolean;
  endFadeTimer?: ReturnType<typeof setTimeout>;
  stopTimer?: ReturnType<typeof setTimeout>;
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
