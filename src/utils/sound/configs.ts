import { DEFAULT_TAP_SOUND, DEFAULT_WORLD_MUSIC } from "./defaults";
import { SoundConfig } from "./types";

export const DEFAULT_SOUND_CONFIGS: SoundConfig[] = [
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
    fadeIn: 300,
    fadeOut: 400,
  },
];

// Curated library for world music selection at runtime
export const MUSIC_TRACKS = [
  {
    id: DEFAULT_WORLD_MUSIC.id,
    name: "Lo-Fi Ambient",
    filePath: DEFAULT_WORLD_MUSIC.filePath,
    icon: "🎵",
  },
  // Add more tracks here as you add files to public/audio
  // { id: "world-lofi-2", name: "Lo-Fi Calm", filePath: "/audio/lofi-2.mp3", icon: "🎶" },
];

export const getMusicTrackById = (id: string) =>
  MUSIC_TRACKS.find((t) => t.id === id) || MUSIC_TRACKS[0];

// Optional mapping from tap effect to tap sound id; defaults to DEFAULT_TAP_SOUND
export const getTapSoundIdForEffect = (effectId?: string): string => {
  // Extend this map to vary tap sounds per visual effect
  const map: Record<string, string> = {
    // example: "tap_effect_confetti": "tap-bing-bong",
  };
  return map[effectId || ""] || DEFAULT_TAP_SOUND.id;
};
