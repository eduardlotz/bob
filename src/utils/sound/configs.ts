import {
  DEFAULT_PING_PONG_HIT_SOUND,
  DEFAULT_TAP_SOUND,
  DEFAULT_PINK_NOISE,
  DEFAULT_UI_SOUND,
  DEFAULT_UI_SOUND_2,
  DEFAULT_WORLD_MUSIC,
} from "./defaults";
import type { SoundConfig } from "./types";

const defineSound = (config: SoundConfig): SoundConfig => config;

export const DEFAULT_SOUND_CONFIGS: SoundConfig[] = [
  defineSound({
    id: DEFAULT_TAP_SOUND.id,
    filePath: DEFAULT_TAP_SOUND.filePath,
    type: "tap",
    category: "tap",
    volume: 0.3,
    pool: 12,
    detune: {
      enabled: true,
      minSemitones: -2,
      maxSemitones: 2,
    },
    playback: {
      overlap: "layer",
      maxConcurrent: 6,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    id: DEFAULT_WORLD_MUSIC.id,
    filePath: DEFAULT_WORLD_MUSIC.filePath,
    type: "world",
    category: "background",
    volume: 0.2,
    loop: true,
    pool: 4,
    distanceAttenuation: false,
    detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
    fadeIn: 2500,
    fadeOut: 1200,
    playback: {
      group: "world-music",
      overlap: "replace-group",
      maxConcurrent: 1,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    id: DEFAULT_PINK_NOISE.id,
    filePath: DEFAULT_PINK_NOISE.filePath,
    type: "world",
    category: "ambient",
    volume: 0.5,
    loop: true,
    pool: 4,
    distanceAttenuation: true,
    detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
    fadeIn: 2000,
    fadeOut: 1000,
    playback: {
      group: "world-music",
      overlap: "replace-group",
      maxConcurrent: 1,
      limitBehavior: "stop-oldest",
    },
  }),
  // {
  //   id: DEFAULT_TEXT_SOUND.id,
  //   filePath: DEFAULT_TEXT_SOUND.filePath,
  //   type: "text",
  //   volume: 0.6,
  //   detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
  //   stopPrevious: false,
  //   layerable: true,
  // },
  defineSound({
    id: DEFAULT_UI_SOUND.id,
    filePath: DEFAULT_UI_SOUND.filePath,
    type: "ui",
    category: "ui",
    volume: 0.3,
    pool: 8,
    detune: { enabled: true, minSemitones: 0, maxSemitones: 1 },
    playback: {
      overlap: "restart",
      maxConcurrent: 2,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    id: DEFAULT_PING_PONG_HIT_SOUND.id,
    filePath: DEFAULT_PING_PONG_HIT_SOUND.filePath,
    type: "ui",
    category: "effect",
    volume: 0.5,
    pool: 8,
    playback: {
      overlap: "layer",
      maxConcurrent: 3,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    id: DEFAULT_UI_SOUND_2.id,
    filePath: DEFAULT_UI_SOUND_2.filePath,
    type: "ui",
    category: "ui",
    volume: 0.35,
    pool: 8,
    detune: { enabled: true, minSemitones: 0, maxSemitones: 1 },
    playback: {
      overlap: "restart",
      maxConcurrent: 2,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    // somehow this import is not working?
    // id: DEFAULT_UI_SOUND_ALT.id,
    // filePath: DEFAULT_UI_SOUND_ALT.filePath,
    id: "ui-tap-close",
    filePath: "/audio/ui_click_sound_close.ogg",
    type: "ui",
    category: "ui",
    volume: 0.35,
    pool: 8,
    detune: { enabled: true, minSemitones: 0, maxSemitones: 1 },
    playback: {
      overlap: "restart",
      maxConcurrent: 2,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    id: "pop",
    filePath: "/audio/pop-sound.wav",
    type: "tap",
    category: "action",
    volume: 0.2,
    pool: 8,
    detune: { enabled: true, minSemitones: -2, maxSemitones: 2 },
    playback: {
      overlap: "restart",
      maxConcurrent: 3,
      limitBehavior: "stop-oldest",
    },
  }),
  defineSound({
    id: "game-background-music",
    filePath: "/audio/game_background_music.mp3",
    // filePath: DEFAULT_WORLD_MUSIC.filePath,
    type: "world",
    category: "background",
    volume: 0.35,
    pool: 4,
    // detune: { enabled: true, minSemitones: -2, maxSemitones: 2 },
    playback: {
      group: "world-music",
      overlap: "replace-group",
      maxConcurrent: 1,
      limitBehavior: "stop-oldest",
    },
  }),
];

export const WORLD_SOUNDS = [
  {
    id: DEFAULT_WORLD_MUSIC.id,
    name: "Jazz Piano Ambient",
    filePath: DEFAULT_WORLD_MUSIC.filePath,
    icon: "🎵",
    showInShop: true,
  },
  {
    id: DEFAULT_PINK_NOISE.id,
    name: "Pink Noise",
    filePath: DEFAULT_PINK_NOISE.filePath,
    icon: "💗",
    showInShop: false,
  },
  // {
  //   id: "world_rain",
  //   name: "Rain",
  //   filePath: "/audio/rain.wav",
  //   icon: "🌧️",
  // },
];

const EFFECT_SOUNDS = {
  rain: {
    id: "environment_rain",
    name: "Rain",
    filePath: "/audio/rain.wav",
    icon: "🌧️",
  },
};

export const getWeatherSoundById = (id: string) =>
  EFFECT_SOUNDS[id as keyof typeof EFFECT_SOUNDS] || EFFECT_SOUNDS["rain"];

export const tryGetWeatherSoundById = (id: string) =>
  EFFECT_SOUNDS[id as keyof typeof EFFECT_SOUNDS];

export const getWorldSoundById = (id: string) =>
  WORLD_SOUNDS.find((t) => t.id === id) || WORLD_SOUNDS[0];

export const tryGetWorldSoundById = (id: string) =>
  WORLD_SOUNDS.find((t) => t.id === id);

export const TAP_SOUNDS = [
  {
    id: DEFAULT_TAP_SOUND.id,
    name: "Default Tap",
    filePath: DEFAULT_TAP_SOUND.filePath,
    icon: "🔊",
  },
  {
    id: "tap-pop",
    name: "Pop",
    filePath: "/audio/pop-sound.wav",
    icon: "🫧",
  },
];

export const getTapSoundById = (id: string) =>
  TAP_SOUNDS.find((t) => t.id === id) || TAP_SOUNDS[0];

export const TAP_EFFECT_TO_DEFAULT_TAP_SOUND: Record<string, string> = {
  tap_effect_default: DEFAULT_TAP_SOUND.id,
  tap_effect_confetti: DEFAULT_TAP_SOUND.id,
  tap_effect_hearts: DEFAULT_TAP_SOUND.id,
  tap_effect_stars: DEFAULT_TAP_SOUND.id,
};

export const resolveTapSoundForEffect = (
  effectUpgradeId: string,
  overrideTapAudioId?: string,
) => {
  const resolvedId =
    overrideTapAudioId ||
    TAP_EFFECT_TO_DEFAULT_TAP_SOUND[effectUpgradeId] ||
    DEFAULT_TAP_SOUND.id;
  const cfg = getTapSoundById(resolvedId);
  return cfg;
};
