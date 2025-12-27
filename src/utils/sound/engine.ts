import * as THREE from "three";
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_TAP_VOLUME,
  DEFAULT_WORLD_VOLUME,
  DEFAULT_UI_VOLUME,
  DEFAULT_TEXT_VOLUME,
  DEBUG_LOGS,
  DEFAULT_WORLD_MUSIC,
  DEFAULT_TAP_SOUND,
  DEFAULT_UI_SOUND,
  DEFAULT_UI_SOUND_2,
} from "./defaults";
import { DEFAULT_SOUND_CONFIGS } from "./configs";
import { SoundConfig, SoundInstance, SoundSystemState } from "./types";

// global state
let sounds = new Map<string, SoundInstance>();
let configs = new Map<string, SoundConfig>();
let audioBuffers = new Map<string, AudioBuffer>();
const instancesBySoundId = new Map<string, Set<string>>();
let state: SoundSystemState = {
  enabled: true,
  masterVolume: DEFAULT_MASTER_VOLUME,
  tapVolume: DEFAULT_TAP_VOLUME,
  worldVolume: DEFAULT_WORLD_VOLUME,
  uiVolume: DEFAULT_UI_VOLUME,
  textVolume: DEFAULT_TEXT_VOLUME,
  tapEnabled: true,
  worldEnabled: true,
};

let lastNonZeroMasterVolume = state.masterVolume > 0 ? state.masterVolume : 0.5;

let audioListener: THREE.AudioListener | null = null;
let listenerAttachedToCamera = false;

let currentWorldMusicId: string = DEFAULT_WORLD_MUSIC.id;
let currentWorldMusicFilePath: string = DEFAULT_WORLD_MUSIC.filePath;
let currentTapSoundId: string = DEFAULT_TAP_SOUND.id;
let isStartingBackgroundMusic = false;

// resume audio context (required for browser autoplay policies)
export const resumeAudioContext = async () => {
  const listener = initializeAudioListener();
  if (!listener?.context) {
    console.log("No audio context available");
    return;
  }

  if (listener.context.state === "suspended") {
    console.log("Resuming suspended audio context...");
    try {
      await listener.context.resume();
      console.log("Audio context resumed successfully");
    } catch (error) {
      console.error("Failed to resume audio context:", error);
    }
  }
};

// TODO: check if still relevant in 2026
// Some iOS versions need an actual start/stop of a source node after resume
// This plays a near-silent, extremely short tone to fully unlock playback
export const unlockAudioContext = async () => {
  const listener = initializeAudioListener();
  const ctx = listener?.context as AudioContext | undefined;
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001; // effectively silent
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
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

const preloadDefaultAudioFiles = async () => {
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

// TODO: check if really needed
const initializeAudioListener = () => {
  if (audioListener) return audioListener;

  try {
    audioListener = new THREE.AudioListener();

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

const getRandomDetune = (
  detuneConfig: NonNullable<SoundConfig["detune"]>
): number => {
  return (
    Math.random() * (detuneConfig.maxSemitones - detuneConfig.minSemitones) +
    detuneConfig.minSemitones
  );
};

const getTypeVolume = (type: SoundConfig["type"]): number => {
  switch (type) {
    case "tap":
      return state.tapVolume;
    case "world":
      return state.worldVolume;
    case "ui":
      return state.uiVolume;
    case "text":
      return state.textVolume;
    default:
      return 0.5;
  }
};

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
  const typeEnabled =
    config.type === "world"
      ? state.worldEnabled !== false
      : config.type === "tap"
      ? state.tapEnabled !== false
      : true;
  const v = baseVolume * typeVolume * master * (typeEnabled ? 0.7 : 0);
  return Number.isFinite(v) ? v : 0;
};

const applyVolumeImmediate = (audio: any, volume: number) => {
  try {
    const v = Number.isFinite(volume) ? volume : 0;
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
  try {
    audio.setVolume(volume);
  } catch {}
};

// TODO: fix cleanup
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
      const byId = instancesBySoundId.get(instance.config.id);
      if (byId) {
        byId.delete(instanceId);
        if (byId.size === 0) instancesBySoundId.delete(instance.config.id);
      }
    }
  }
  sounds.delete(instanceId);
};

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

  const finalConfig = { ...config, ...options };

  try {
    if (finalConfig.stopPrevious) {
      const existing = instancesBySoundId.get(finalConfig.id);
      if (existing) {
        existing.forEach((instanceId) => stopSound(instanceId));
      }
    }

    const sound = new THREE.Audio(listener);

    const buffer = await getOrLoadBuffer(finalConfig);
    if (!buffer) return;

    sound.setBuffer(buffer);
    if (finalConfig.detune?.enabled) {
      const detune = getRandomDetune(finalConfig.detune);
      sound.setPlaybackRate(Math.pow(2, detune / 12));
    }

    const finalVolume = calculateFinalVolume(finalConfig);
    if (!(finalVolume > 0)) return;

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

export const setMasterVolume = (volume: number): void => {
  const safe = clamp01Safe(volume);
  state.masterVolume = safe;
  if (state.masterVolume > 0) {
    lastNonZeroMasterVolume = state.masterVolume;
  }
  try {
    const listener = getAudioListener();
    if (listener && typeof (listener as any).setMasterVolume === "function") {
      (listener as any).setMasterVolume(safe);
    } else if ((listener as any)?.gain?.gain) {
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
    case "text":
      state.textVolume = safe;
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

export const addSoundConfig = (config: SoundConfig): void => {
  configs.set(config.id, config);
};

export const removeSoundConfig = (soundId: string): void => {
  configs.delete(soundId);
};

export const getSoundConfig = (soundId: string): SoundConfig | undefined => {
  return configs.get(soundId);
};

export const enable = (): void => {
  state.enabled = true;
  resumeAudioContext().catch(() => {});
};

export const disable = (): void => {
  state.enabled = false;
  forceStopAllSounds();
};

// sound actions for clarity (keep contexts running; just stop sounds)
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

// init audio listeners and preload sound
export const initializeSoundSystem = async () => {
  const listener = initializeAudioListener();
  if (listener) {
    console.log("Three.js sound system initialized successfully");
    await preloadDefaultAudioFiles();
  } else {
    console.error("Failed to initialize Three.js sound system");
  }
};

export const playTapSound = (soundId: string = currentTapSoundId) => {
  if (state.tapEnabled === false) return;
  playSound(soundId);
};

export const playWorldSound = (
  soundId: string,
  options?: Partial<SoundConfig>
) => {
  if (state.worldEnabled === false) return;
  playSound(soundId, { loop: true, fadeIn: 5000, fadeOut: 5000, ...options });
};

export const stopAllTapSounds = () => {
  stopSoundsByType("tap");
};

export const stopAllWorldSounds = () => {
  stopSoundsByType("world");
};

export const playUISound = (soundId: string = DEFAULT_UI_SOUND.id) => {
  playSound(soundId);
};

export const getDefaultUISoundId = () => DEFAULT_UI_SOUND.id;
export const getSecondaryUISoundId = () => DEFAULT_UI_SOUND_2.id;

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

export const stopBackgroundMusic = (): void => {
  const setForId = instancesBySoundId.get(currentWorldMusicId);
  if (!setForId || setForId.size === 0) return;
  for (const instanceId of Array.from(setForId)) {
    stopSoundInternal(instanceId, 400);
  }
};

export const mute = (): void => {
  if (state.masterVolume > 0) {
    lastNonZeroMasterVolume = state.masterVolume;
  }
  setMasterVolume(0);
  try {
    stopAllWorldSounds();
  } catch {}
};

export const unmute = (): void => {
  const restore = lastNonZeroMasterVolume > 0 ? lastNonZeroMasterVolume : 1;
  setMasterVolume(restore);
};

export const toggleMute = (): void => {
  if (state.masterVolume > 0) {
    mute();
  } else {
    unmute();
  }
};

export const setTapEnabled = (enabled: boolean): void => {
  state.tapEnabled = !!enabled;
  if (!state.tapEnabled) stopAllTapSounds();
};

export const setWorldMusic = (filePath: string, id: string): void => {
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
