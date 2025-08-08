import * as THREE from "three";
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_TAP_VOLUME,
  DEFAULT_WORLD_VOLUME,
  DEFAULT_UI_VOLUME,
  DEBUG_LOGS,
  DEFAULT_WORLD_MUSIC,
  DEFAULT_TAP_SOUND,
} from "./defaults";
import { DEFAULT_SOUND_CONFIGS } from "./configs";
import { SoundConfig, SoundInstance, SoundSystemState } from "./types";

// global state
let sounds = new Map<string, SoundInstance>();
let configs = new Map<string, SoundConfig>();
let audioBuffers = new Map<string, AudioBuffer>(); // preloaded audio buffers
// track instance ids by sound id for fast stopPrevious handling
const instancesBySoundId = new Map<string, Set<string>>();
let state: SoundSystemState = {
  enabled: true,
  masterVolume: DEFAULT_MASTER_VOLUME,
  tapVolume: DEFAULT_TAP_VOLUME,
  worldVolume: DEFAULT_WORLD_VOLUME,
  uiVolume: DEFAULT_UI_VOLUME,
  tapEnabled: true,
  worldEnabled: true,
};

// Track last non-zero master volume to support proper unmute behavior
let lastNonZeroMasterVolume = state.masterVolume > 0 ? state.masterVolume : 1;

// Three.js Audio Listener (singleton)
let audioListener: THREE.AudioListener | null = null;
let listenerAttachedToCamera = false;

// Current default sound selections (runtime switchable)
let currentWorldMusicId: string = DEFAULT_WORLD_MUSIC.id;
let currentWorldMusicFilePath: string = DEFAULT_WORLD_MUSIC.filePath;
let currentTapSoundId: string = DEFAULT_TAP_SOUND.id;
let isStartingBackgroundMusic = false;

// Ensure audio context is resumed (required for browser autoplay policies)
export const resumeAudioContext = async () => {
  if (!audioListener?.context) {
    console.log("No audio context available");
    return;
  }

  if (audioListener.context.state === "suspended") {
    console.log("Resuming suspended audio context...");
    try {
      await audioListener.context.resume();
      console.log("Audio context resumed successfully");
    } catch (error) {
      console.error("Failed to resume audio context:", error);
    }
  }
};

export const suspendAudioContext = async () => {
  if (!audioListener?.context) return;
  try {
    if (audioListener.context.state === "running") {
      await audioListener.context.suspend();
      if (DEBUG_LOGS) console.log("Audio context suspended");
    }
  } catch (error) {
    console.error("Failed to suspend audio context:", error);
  }
};

// Runtime status helpers for consumers
export const getAudioContextState = (): string | null => {
  try {
    return audioListener?.context?.state ?? null;
  } catch {
    return null;
  }
};

export const isAudioContextRunning = (): boolean => {
  try {
    return audioListener?.context?.state === "running";
  } catch {
    return false;
  }
};

// Preload all audio files
const preloadAudioFiles = async () => {
  const listener = initializeAudioListener();
  if (!listener) return;

  const audioLoader = new THREE.AudioLoader();

  await Promise.all(
    DEFAULT_SOUND_CONFIGS.map(
      (config) =>
        new Promise<void>((resolve) => {
          audioLoader.load(
            config.filePath,
            (buffer) => {
              audioBuffers.set(config.id, buffer as AudioBuffer);
              if (DEBUG_LOGS)
                console.log(`Preloaded: ${config.id} (${config.filePath})`);
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to preload ${config.id}:`, error);
              resolve();
            }
          );
        })
    )
  );

  if (DEBUG_LOGS)
    console.log(
      "Audio preloading complete. Loaded buffers:",
      Array.from(audioBuffers.keys())
    );
};

// Initialize Three.js audio listener
const initializeAudioListener = () => {
  if (audioListener) return audioListener;

  try {
    audioListener = new THREE.AudioListener();

    // Load default configs
    DEFAULT_SOUND_CONFIGS.forEach((config) => {
      configs.set(config.id, config);
    });

    if (DEBUG_LOGS) {
      console.log(
        "Three.js Audio Listener initialized, configs loaded:",
        Array.from(configs.keys())
      );
    }
    return audioListener;
  } catch (error) {
    console.warn("Three.js Audio not supported, sound system disabled");
    state.enabled = false;
    return null;
  }
};

// Public API to access/attach the AudioListener
export const getAudioListener = (): THREE.AudioListener | null => {
  return initializeAudioListener();
};

export const attachListenerToCamera = (camera: THREE.Camera): void => {
  const listener = initializeAudioListener();
  if (!listener || !camera) return;
  if (listenerAttachedToCamera) return;
  try {
    const parent = (listener as any).parent as THREE.Object3D | undefined;
    if (!parent) {
      (camera as any).add(listener);
      listenerAttachedToCamera = true;
      if (DEBUG_LOGS) console.log("AudioListener attached to camera");
    }
  } catch (e) {
    try {
      (camera as any).add(listener);
      listenerAttachedToCamera = true;
    } catch {}
  }
};

// Get random detune value
const getRandomDetune = (
  detuneConfig: NonNullable<SoundConfig["detune"]>
): number => {
  return (
    Math.random() * (detuneConfig.maxSemitones - detuneConfig.minSemitones) +
    detuneConfig.minSemitones
  );
};

// Get volume for sound type
const getTypeVolume = (type: SoundConfig["type"]): number => {
  switch (type) {
    case "tap":
      return state.tapVolume;
    case "world":
      return state.worldVolume;
    case "ui":
      return state.uiVolume;
    default:
      return 1.0;
  }
};

// Calculate final volume (safe against non-finite values)
const toFinite = (n: any, fallback = 0): number =>
  Number.isFinite(n) ? (n as number) : fallback;

const clamp01Safe = (n: any): number => {
  const v = toFinite(n, 0);
  return Math.max(0, Math.min(1, v));
};

const calculateFinalVolume = (config: SoundConfig): number => {
  const baseVolume = clamp01Safe((config as any).volume);
  const typeVolume = clamp01Safe(getTypeVolume(config.type));
  const master = clamp01Safe(state.masterVolume);
  // Respect per-type enable flags by zeroing volume when disabled
  const typeEnabled =
    config.type === "world"
      ? state.worldEnabled !== false
      : config.type === "tap"
      ? state.tapEnabled !== false
      : true;
  const v = baseVolume * typeVolume * master * (typeEnabled ? 1 : 0);
  return Number.isFinite(v) ? v : 0;
};

// Apply volume without smoothing to avoid perceived delay
const applyVolumeImmediate = (audio: any, volume: number) => {
  try {
    const v = Number.isFinite(volume) ? volume : 0;
    // Try to set via underlying GainNode for immediate effect
    const gainParam: any = (audio as any)?.gain?.gain as any;
    const ctx: AudioContext | undefined = (audio as any)?.context;
    if (gainParam && ctx) {
      try {
        if (typeof gainParam.cancelScheduledValues === "function") {
          gainParam.cancelScheduledValues(ctx.currentTime);
        }
        if (typeof gainParam.setValueAtTime === "function") {
          gainParam.setValueAtTime(v, ctx.currentTime);
          return;
        }
      } catch {}
    }
  } catch {}
  // Fallback to Three.js API (may smooth slightly)
  try {
    audio.setVolume(volume);
  } catch {}
};

// Clean up sound instance
const cleanupSound = (instanceId: string): void => {
  const instance = sounds.get(instanceId);
  if (instance) {
    try {
      const anySound = instance.sound as any;
      if (anySound?.source) {
        try {
          anySound.source.onended = null;
        } catch {}
        try {
          anySound.source.stop(0);
        } catch {}
        try {
          anySound.source.disconnect();
        } catch {}
        anySound.source = null;
      }
      try {
        instance.sound.setLoop(false);
      } catch {}
      try {
        instance.sound.stop();
      } catch {}
    } finally {
      // Remove instance id index
      const byId = instancesBySoundId.get(instance.config.id);
      if (byId) {
        byId.delete(instanceId);
        if (byId.size === 0) instancesBySoundId.delete(instance.config.id);
      }
    }
  }
  sounds.delete(instanceId);
};

// Helper to fetch buffer from cache or load on demand
const getOrLoadBuffer = async (
  cfg: SoundConfig
): Promise<AudioBuffer | null> => {
  const cached = audioBuffers.get(cfg.id);
  if (cached) return cached;
  return new Promise<AudioBuffer | null>((resolve) => {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(
      cfg.filePath,
      (buffer) => {
        audioBuffers.set(cfg.id, buffer as AudioBuffer);
        resolve(buffer as AudioBuffer);
      },
      undefined,
      (error) => {
        console.error(`Failed to load audio file: ${cfg.filePath}`, error);
        resolve(null);
      }
    );
  });
};

// Core sound management functions
export const playSound = async (
  soundId: string,
  options?: Partial<SoundConfig>
): Promise<void> => {
  if (!state.enabled || state.masterVolume <= 0) {
    if (DEBUG_LOGS)
      console.warn("Sound muted or system disabled; skipping play");
    return;
  }

  const listener = initializeAudioListener();
  if (!listener) {
    console.warn("Audio listener not available");
    return;
  }

  // Ensure audio context is resumed on first user interaction
  if (listener.context.state === "suspended") {
    console.log("Resuming audio context on first user interaction...");
    await listener.context.resume();
  }

  const config = configs.get(soundId);
  if (!config) {
    console.warn(`Sound config not found: ${soundId}`);
    console.log("Available configs:", Array.from(configs.keys()));
    return;
  }

  // Merge options with base config
  const finalConfig = { ...config, ...options };

  try {
    // Stop previous instance(s) if requested
    if (finalConfig.stopPrevious) {
      const existing = instancesBySoundId.get(finalConfig.id);
      if (existing) {
        existing.forEach((instanceId) => stopSound(instanceId));
      }
    }

    // Create Three.js Audio
    const sound = new THREE.Audio(listener);

    // Fetch buffer (cache or load)
    const buffer = await getOrLoadBuffer(finalConfig);
    if (!buffer) return;

    // Configure sound node
    sound.setBuffer(buffer);
    if (finalConfig.detune?.enabled) {
      const detune = getRandomDetune(finalConfig.detune);
      sound.setPlaybackRate(Math.pow(2, detune / 12));
    }

    const finalVolume = calculateFinalVolume(finalConfig);
    if (!(finalVolume > 0)) return; // avoid work when muted or invalid

    // Apply volume, supporting optional fadeIn
    const anySound = sound as any;
    const ctx: AudioContext | undefined = anySound?.context;
    const gainParam: any = anySound?.gain?.gain;
    const fadeInMs = Math.max(0, (finalConfig as any).fadeIn || 0);
    if (
      fadeInMs > 0 &&
      ctx &&
      gainParam &&
      typeof gainParam.setValueAtTime === "function"
    ) {
      try {
        gainParam.cancelScheduledValues(ctx.currentTime);
        gainParam.setValueAtTime(0, ctx.currentTime);
        gainParam.linearRampToValueAtTime(
          finalVolume,
          ctx.currentTime + fadeInMs / 1000
        );
      } catch {
        applyVolumeImmediate(anySound, finalVolume);
      }
    } else {
      applyVolumeImmediate(anySound, finalVolume);
    }
    if (finalConfig.loop) sound.setLoop(true);

    // Track instance
    const instance: SoundInstance = {
      id: `${soundId}-${Date.now()}`,
      listener,
      sound,
      config: finalConfig,
      startTime: Date.now(),
      volume: finalVolume,
      detune: finalConfig.detune?.enabled
        ? getRandomDetune(finalConfig.detune!)
        : 0,
    };

    sounds.set(instance.id, instance);
    let setForId = instancesBySoundId.get(finalConfig.id);
    if (!setForId) {
      setForId = new Set<string>();
      instancesBySoundId.set(finalConfig.id, setForId);
    }
    setForId.add(instance.id);

    // Play and auto-cleanup
    sound.play();
    if (anySound.source) {
      anySound.source.onended = () => cleanupSound(instance.id);
    } else {
      setTimeout(() => {
        if (anySound.source) {
          anySound.source.onended = () => cleanupSound(instance.id);
        }
      }, 0);
    }
  } catch (error) {
    console.error(`Failed to play sound ${soundId}:`, error);
  }
};

const stopSoundInternal = (instanceId: string, fadeOutMs?: number): void => {
  const instance = sounds.get(instanceId);
  if (!instance) return;

  try {
    const anySound = instance.sound as any;
    // Optional fade-out before stopping
    const fadeMs = Math.max(
      0,
      fadeOutMs || (instance.config as any).fadeOut || 0
    );
    const ctx: AudioContext | undefined = anySound?.context;
    const gainParam: any = anySound?.gain?.gain;
    if (
      fadeMs > 0 &&
      ctx &&
      gainParam &&
      typeof gainParam.setValueAtTime === "function"
    ) {
      try {
        const currentTime = ctx.currentTime;
        // Capture current gain if possible, then ramp to 0
        gainParam.cancelScheduledValues(currentTime);
        const currentValue = ((): number => {
          try {
            return typeof gainParam.value === "number" ? gainParam.value : 0;
          } catch {
            return 0;
          }
        })();
        gainParam.setValueAtTime(currentValue, currentTime);
        gainParam.linearRampToValueAtTime(0, currentTime + fadeMs / 1000);
      } catch {}
      // Stop the buffer a bit after fade completes
      try {
        if (anySound?.source?.stop) {
          anySound.source.stop(ctx.currentTime + fadeMs / 1000 + 0.01);
        }
      } catch {}
    }
    if (anySound?.source) {
      try {
        anySound.source.onended = null;
      } catch {}
      try {
        anySound.source.stop(0);
      } catch {}
      try {
        anySound.source.disconnect();
      } catch {}
      anySound.source = null;
    }
    try {
      instance.sound.setLoop(false);
    } catch {}
    try {
      instance.sound.stop();
    } catch {}
  } finally {
    cleanupSound(instanceId);
  }
};

export const stopSound = (instanceId: string): void => {
  stopSoundInternal(instanceId);
};

export const stopSoundsByType = (type: SoundConfig["type"]): void => {
  const soundsToStop = Array.from(sounds).filter(
    ([_, instance]) => instance.config.type === type
  );

  for (const [instanceId] of soundsToStop) {
    stopSound(instanceId);
  }
};

export const stopAllSounds = (): void => {
  for (const instanceId of Array.from(sounds.keys())) {
    stopSound(instanceId);
  }
};

// aggressive stop that ensures all WebAudio nodes are disconnected and maps cleared
export const forceStopAllSounds = (): void => {
  for (const [instanceId, instance] of Array.from(sounds)) {
    try {
      const anySound = instance.sound as any;
      if (anySound?.source) {
        try {
          anySound.source.onended = null;
        } catch {}
        try {
          anySound.source.stop(0);
        } catch {}
        try {
          anySound.source.disconnect();
        } catch {}
        anySound.source = null;
      }
      try {
        instance.sound.setLoop(false);
      } catch {}
      try {
        instance.sound.stop();
      } catch {}
    } finally {
      cleanupSound(instanceId);
    }
  }
  sounds.clear();
  instancesBySoundId.clear();
};

// Aggressive stop by type
const forceStopSoundsByType = (type: SoundConfig["type"]): void => {
  for (const [instanceId, instance] of Array.from(sounds)) {
    if (instance.config.type !== type) continue;
    try {
      const anySound = instance.sound as any;
      if (anySound?.source) {
        try {
          anySound.source.onended = null;
        } catch {}
        try {
          anySound.source.stop(0);
        } catch {}
        try {
          anySound.source.disconnect();
        } catch {}
        anySound.source = null;
      }
      try {
        instance.sound.setLoop(false);
      } catch {}
      try {
        instance.sound.stop();
      } catch {}
    } finally {
      cleanupSound(instanceId);
    }
  }
};

// Volume control functions
export const setMasterVolume = (volume: number): void => {
  const safe = clamp01Safe(volume);
  state.masterVolume = safe;
  if (state.masterVolume > 0) {
    lastNonZeroMasterVolume = state.masterVolume;
  }
  // Also apply to the global AudioListener master gain for immediate effect
  try {
    const listener = getAudioListener();
    if (listener && typeof (listener as any).setMasterVolume === "function") {
      (listener as any).setMasterVolume(safe);
    } else if ((listener as any)?.gain?.gain) {
      // Fallback in case setMasterVolume API differs in this three version
      const ctx: AudioContext | undefined = (listener as any)?.context;
      const gainParam: any = (listener as any)?.gain?.gain;
      if (ctx && gainParam?.setValueAtTime) {
        gainParam.setValueAtTime(safe, ctx.currentTime);
      }
    }
  } catch {}
  updateAllVolumes();
};

export const setTypeVolume = (
  type: SoundConfig["type"],
  volume: number
): void => {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  const safe = clamp01Safe(clampedVolume);

  switch (type) {
    case "tap":
      state.tapVolume = safe;
      break;
    case "world":
      state.worldVolume = safe;
      break;
    case "ui":
      state.uiVolume = safe;
      break;
  }

  updateAllVolumes();
};

const updateAllVolumes = (): void => {
  for (const [_, instance] of Array.from(sounds)) {
    const newVolume = calculateFinalVolume(instance.config);
    applyVolumeImmediate(
      instance.sound as any,
      Number.isFinite(newVolume) ? newVolume : 0
    );
  }
};

// Configuration functions
export const addSoundConfig = (config: SoundConfig): void => {
  configs.set(config.id, config);
};

export const removeSoundConfig = (soundId: string): void => {
  configs.delete(soundId);
};

export const getSoundConfig = (soundId: string): SoundConfig | undefined => {
  return configs.get(soundId);
};

// State management functions
export const enable = (): void => {
  state.enabled = true;
  // If enabling, resume context but do not auto-start any music; UI decides what to play
  resumeAudioContext().catch(() => {});
};

export const disable = (): void => {
  state.enabled = false;
  // Use a hard stop to guarantee looped background music is silenced
  forceStopAllSounds();
};

// Start/Stop aliases for clarity (keep contexts running; just stop sounds)
export const start = enable;
export const stop = disable;

export const isEnabled = (): boolean => {
  return state.enabled;
};

export const getState = (): SoundSystemState => {
  return { ...state };
};

// Distance attenuation for world sounds (when menu is open/closed)
export const updateWorldSoundVolumes = (isMenuOpen: boolean): void => {
  for (const [_, instance] of Array.from(sounds)) {
    if (
      instance.config.type === "world" &&
      instance.config.distanceAttenuation
    ) {
      const baseVolume = calculateFinalVolume(instance.config);
      const attenuatedVolume = isMenuOpen ? baseVolume * 0.3 : baseVolume;
      applyVolumeImmediate(instance.sound as any, attenuatedVolume);
    }
  }
};

// Initialize sound system early
export const initializeSoundSystemAsync = async () => {
  const listener = initializeAudioListener();
  if (listener) {
    console.log("Three.js sound system initialized successfully");
    await preloadAudioFiles();
  } else {
    console.error("Failed to initialize Three.js sound system");
  }
};

// Convenience functions for common use cases
export const playTapSound = (soundId: string = currentTapSoundId) => {
  if (state.tapEnabled === false) return;
  playSound(soundId);
};

export const playWorldSound = (
  soundId: string,
  options?: Partial<SoundConfig>
) => {
  if (state.worldEnabled === false) return;
  // Allow layered world sounds: do not enforce stopPrevious unless requested
  playSound(soundId, { loop: true, fadeIn: 5000, fadeOut: 5000, ...options });
};

export const stopAllTapSounds = () => {
  stopSoundsByType("tap");
};

export const stopAllWorldSounds = () => {
  stopSoundsByType("world");
};

// Stop all instances for a specific sound config id (e.g., layered world sounds)
export const stopSoundsById = (soundConfigId: string): void => {
  const setForId = instancesBySoundId.get(soundConfigId);
  if (!setForId || setForId.size === 0) return;
  for (const instanceId of Array.from(setForId)) {
    stopSound(instanceId);
  }
};

export const setTapVolume = (volume: number) => {
  setTypeVolume("tap", volume);
};

export const setWorldVolume = (volume: number) => {
  setTypeVolume("world", volume);
  // Ensure immediate gain update for any active world instances
  try {
    for (const [_, instance] of Array.from(sounds)) {
      if (instance.config.type !== "world") continue;
      const newVolume = calculateFinalVolume(instance.config);
      applyVolumeImmediate(
        instance.sound as any,
        Number.isFinite(newVolume) ? newVolume : 0
      );
    }
  } catch {}
};

const isSoundActive = (soundId: string): boolean => {
  const setForId = instancesBySoundId.get(soundId);
  if (!setForId || setForId.size === 0) return false;
  let active = false;
  setForId.forEach((id) => {
    if (active) return;
    const instance = sounds.get(id);
    if (!instance) return;
    const anySound = instance.sound as any;
    // consider active if the internal source node still exists or isPlaying is true
    if (anySound?.source || anySound?.isPlaying) active = true;
  });
  return active;
};

export const startBackgroundMusic = async (): Promise<void> => {
  if (!state.enabled || state.worldEnabled === false) return;
  // respect user gesture policies
  await resumeAudioContext();
  if (isStartingBackgroundMusic) return;
  // Ensure any prior world instances are fully stopped to avoid layering
  try {
    stopBackgroundMusic();
  } catch {}
  // ensure config exists even if DEFAULT_SOUND_CONFIGS changed
  if (!configs.get(currentWorldMusicId)) {
    addSoundConfig({
      id: currentWorldMusicId,
      filePath: currentWorldMusicFilePath,
      type: "world",
      volume: DEFAULT_WORLD_VOLUME,
      loop: true,
      stopPrevious: false,
      distanceAttenuation: false,
      detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
      fadeIn: 5000,
      fadeOut: 5000,
    });
  }
  // If there is no active instance for the selected background id already, start it.
  isStartingBackgroundMusic = true;
  try {
    await playSound(currentWorldMusicId, {
      loop: true,
      stopPrevious: false,
      fadeIn: 5000,
      fadeOut: 5000,
    });
  } finally {
    isStartingBackgroundMusic = false;
  }
};

export const stopBackgroundMusic = (): void => {
  const setForId = instancesBySoundId.get(currentWorldMusicId);
  if (!setForId || setForId.size === 0) return;
  for (const instanceId of Array.from(setForId)) {
    // Use a gentle fade-out for music to avoid artifacts
    stopSoundInternal(instanceId, 400);
  }
};

// Mute/Unmute controls (preferred for frontend use)
export const mute = (): void => {
  if (state.masterVolume > 0) {
    lastNonZeroMasterVolume = state.masterVolume;
  }
  // Volume-only approach: keep instances alive, just zero final output
  setMasterVolume(0);
  // Explicitly stop ALL world sounds (primary + layered) while muted to avoid stale instances
  try {
    stopAllWorldSounds();
  } catch {}
};

export const unmute = (): void => {
  const restore = lastNonZeroMasterVolume > 0 ? lastNonZeroMasterVolume : 1;
  setMasterVolume(restore);
  // Do not auto-start background music on unmute; let explicit enable/gesture logic handle it
};

export const toggleMute = (): void => {
  if (state.masterVolume > 0) {
    mute();
  } else {
    unmute();
  }
};

// Per-type enable/disable
export const setTapEnabled = (enabled: boolean): void => {
  state.tapEnabled = !!enabled;
  if (!state.tapEnabled) stopAllTapSounds();
};

export const setWorldEnabled = (enabled: boolean): void => {
  state.worldEnabled = !!enabled;
  if (!state.worldEnabled) {
    try {
      stopBackgroundMusic();
    } catch {
      forceStopSoundsByType("world");
    }
  } else {
    // Do not auto-start here to avoid double-start on the same user gesture.
    // The UI can call setWorldMusic or a gesture handler can start it.
  }
};

// Runtime selection
export const setWorldMusic = (
  filePath: string,
  id: string = DEFAULT_WORLD_MUSIC.id
): void => {
  currentWorldMusicId = id;
  currentWorldMusicFilePath = filePath;
  addSoundConfig({
    id,
    filePath,
    type: "world",
    volume: DEFAULT_WORLD_VOLUME,
    loop: true,
    stopPrevious: false,
    distanceAttenuation: false,
    detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
  });
  // Do not auto-start here; caller can choose to startBackgroundMusic if desired
};

export const setCurrentTapSound = (id: string, filePath?: string): void => {
  currentTapSoundId = id;
  if (filePath) {
    addSoundConfig({
      id,
      filePath,
      type: "tap",
      volume: state.tapVolume,
      stopPrevious: true,
      detune: { enabled: true, minSemitones: -2, maxSemitones: 2 },
    });
  }
};

let autoStartBound = false;
export const scheduleBackgroundMusicAutoStart = () => {
  if (autoStartBound) return;
  autoStartBound = true;

  const maybeStart = async () => {
    // Only ensure audio context is resumed on first gesture; do NOT auto-start music
    try {
      await resumeAudioContext();
    } finally {
      window.removeEventListener("pointerdown", maybeStart);
      window.removeEventListener("keydown", maybeStart);
      window.removeEventListener("touchstart", maybeStart);
    }
  };

  window.addEventListener("pointerdown", maybeStart);
  window.addEventListener("keydown", maybeStart);
  window.addEventListener("touchstart", maybeStart);
};

// play a simple beep sound using threejs oscillator
export const testSoundSystem = () => {
  console.group("Three.js sound system test");
  console.log("Sound system state:", getState());
  console.log("Audio listener:", audioListener);
  console.log("Audio context state:", audioListener?.context?.state);
  console.log("Preloaded buffers:", Array.from(audioBuffers.keys()));

  try {
    if (audioListener) {
      const audioContext = audioListener.context;

      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      osc.start();
      osc.stop(audioContext.currentTime + 0.1);

      console.log("Test beep played successfully");
    } else {
      console.error("Audio listener not available");
    }
  } catch (error) {
    console.error("Test beep failed:", error);
  } finally {
    console.groupEnd();
  }
};

export const debugSoundSystem = () => {
  console.group("=== Three.js Sound System Debug ===");
  console.log("State:", state);
  console.log("Audio Listener:", audioListener);
  console.log("Audio Context State:", audioListener?.context?.state);
  console.log("Audio Context Sample Rate:", audioListener?.context?.sampleRate);
  console.log("Preloaded Buffers:", Array.from(audioBuffers.keys()));
  console.log("Configs:", Array.from(configs.keys()));
  console.log("Sounds:", Array.from(sounds.keys()));
  console.groupEnd();
};
