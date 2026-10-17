import type { SoundConfig } from "./types";

type WorldSoundSource = Pick<SoundConfig, "filePath" | "src" | "sprite">;
const recording = (file: string): WorldSoundSource => ({ filePath: `/audio/ambience/${file}.wav` });
/** Recorded and procedural clips share Howler's world bus, never the UI synth bus. */
export const ENVIRONMENT_AUDIO_SOURCES: Record<string, WorldSoundSource> = {
  "object-campfire": recording("campfire"),
  "ambience-garden": recording("garden"),
  "ambience-forest-wind": { filePath: "/audio/ambience/forest-base.mp3" },
  "ambience-leaves": recording("leaves"),
  "ambience-bird": { filePath: "/audio/ambience/forest-birds.mp3" },
  "ambience-cricket": recording("cricket"),
  "ambience-rain": recording("rain"),
  "ambience-city": recording("city"),
  "ambience-horn": recording("horn"),
  "ambience-car": recording("car"),
  "ambience-desert-wind": recording("desert-wind"),
  "ambience-sand": recording("sand"),
  "ambience-winter-wind": recording("winter-wind"),
  "ambience-branch": recording("branch"),
  "ambience-space": { filePath: "/audio/pink-noise.wav" },
  "ambience-beep": recording("beep"),
};

export const WORLD_AMBIENCE_SOURCES = ENVIRONMENT_AUDIO_SOURCES;
