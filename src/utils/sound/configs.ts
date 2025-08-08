import { DEFAULT_TAP_SOUND, DEFAULT_WORLD_MUSIC } from "./defaults";
import { SoundConfig } from "./types";

export const DEFAULT_SOUND_CONFIGS: SoundConfig[] = [
  // Defaults only
  {
    id: DEFAULT_TAP_SOUND.id,
    filePath: DEFAULT_TAP_SOUND.filePath,
    type: "tap",
    volume: 0.4,
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
    volume: 0.1,
    loop: true,
    stopPrevious: true,
    distanceAttenuation: false,
    detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
    fadeIn: 5000,
    fadeOut: 5000,
  },
];

// Curated library for world music selection at runtime
// Catalogs for selectable sounds (UI + engine resolution)
export const WORLD_SOUNDS = [
  {
    id: DEFAULT_WORLD_MUSIC.id,
    name: "Lo-Fi Ambient",
    filePath: DEFAULT_WORLD_MUSIC.filePath,
    icon: "🎵",
  },
  {
    id: "world-rain",
    name: "Rain",
    filePath: "/audio/rain.wav",
    icon: "🌧️",
  },
];

export const getWorldSoundById = (id: string) =>
  WORLD_SOUNDS.find((t) => t.id === id) || WORLD_SOUNDS[0];

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

// Mapping from tap effect upgrade ids to default tap audio ids
export const TAP_EFFECT_TO_DEFAULT_TAP_SOUND: Record<string, string> = {
  tap_effect_default: DEFAULT_TAP_SOUND.id,
  tap_effect_confetti: "tap-pop",
  tap_effect_hearts: DEFAULT_TAP_SOUND.id,
  tap_effect_stars: DEFAULT_TAP_SOUND.id,
};

// Resolve which tap sound to use for a given effect upgrade id, optionally overridden
export const resolveTapSoundForEffect = (
  effectUpgradeId: string,
  overrideTapAudioId?: string
) => {
  const resolvedId =
    overrideTapAudioId ||
    TAP_EFFECT_TO_DEFAULT_TAP_SOUND[effectUpgradeId] ||
    DEFAULT_TAP_SOUND.id;
  const cfg = getTapSoundById(resolvedId);
  return cfg;
};
