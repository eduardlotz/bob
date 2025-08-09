import * as THREE from "three";

export interface SoundConfig {
  id: string;
  filePath: string;
  type: "tap" | "world" | "ui" | "text";
  volume: number;
  detune?: {
    enabled: boolean;
    minSemitones: number;
    maxSemitones: number;
  };
  stopPrevious?: boolean;
  layerable?: boolean;
  distanceAttenuation?: boolean;
  loop?: boolean;
  fadeIn?: number; // ms
  fadeOut?: number; // ms
}

export interface SoundInstance {
  id: string;
  listener: THREE.AudioListener;
  sound: THREE.Audio;
  config: SoundConfig;
  startTime: number;
  volume: number;
  detune: number;
}

export interface SoundSystemState {
  enabled: boolean;
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;
  uiVolume: number;
  textVolume?: number;
  // Optional per-type enable flags for runtime control
  tapEnabled?: boolean;
  worldEnabled?: boolean;
}
