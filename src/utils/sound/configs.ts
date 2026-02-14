import {
  DEFAULT_TAP_SOUND,
  DEFAULT_WORLD_MUSIC,
  DEFAULT_TEXT_SOUND,
  DEFAULT_UI_SOUND,
  DEFAULT_UI_SOUND_2,
  DEFAULT_UI_SOUND_ALT,
  DEFAULT_PINK_NOISE,
} from "./defaults";
import { SoundConfig } from "./types";

export const DEFAULT_SOUND_CONFIGS: SoundConfig[] = [
  {
    id: DEFAULT_TAP_SOUND.id,
    filePath: DEFAULT_TAP_SOUND.filePath,
    type: "tap",
    volume: 0.3,
    detune: {
      enabled: true,
      minSemitones: -2,
      maxSemitones: 2,
    },
    stopPrevious: true,
  },
  {
    id: DEFAULT_WORLD_MUSIC.id,
    filePath: DEFAULT_WORLD_MUSIC.filePath,
    type: "world",
    volume: 0.2,
    loop: true,
    stopPrevious: true,
    distanceAttenuation: false,
    detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
    fadeIn: 5000,
    fadeOut: 5000,
  },
  {
    id: DEFAULT_PINK_NOISE.id,
    filePath: DEFAULT_PINK_NOISE.filePath,
    type: "world",
    volume: 0.5,
    loop: true,
    stopPrevious: false,
    distanceAttenuation: true,
    detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
    fadeIn: 5000,
    fadeOut: 5000,
  },
  // {
  //   id: DEFAULT_TEXT_SOUND.id,
  //   filePath: DEFAULT_TEXT_SOUND.filePath,
  //   type: "text",
  //   volume: 0.6,
  //   detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
  //   stopPrevious: false,
  //   layerable: true,
  // },
  {
    id: DEFAULT_UI_SOUND.id,
    filePath: DEFAULT_UI_SOUND.filePath,
    type: "ui",
    volume: 0.3,
    detune: { enabled: true, minSemitones: 0, maxSemitones: 1 },
    stopPrevious: true,
  },
  {
    id: DEFAULT_UI_SOUND_2.id,
    filePath: DEFAULT_UI_SOUND_2.filePath,
    type: "ui",
    volume: 0.35,
    detune: { enabled: true, minSemitones: 0, maxSemitones: 1 },
    stopPrevious: true,
  },
  {
    // somehow this import is not working?
    // id: DEFAULT_UI_SOUND_ALT.id,
    // filePath: DEFAULT_UI_SOUND_ALT.filePath,
    id: "ui-tap-close",
    filePath: "/audio/ui_click_sound_close.ogg",
    type: "ui",
    volume: 0.35,
    detune: { enabled: true, minSemitones: 0, maxSemitones: 1 },
    stopPrevious: true,
  },
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
