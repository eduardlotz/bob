import * as THREE from "three";

// Sound System Configuration and Types
export interface SoundConfig {
  id: string;
  filePath: string;
  type: "tap" | "world" | "ui";
  volume: number;
  detune?: {
    enabled: boolean;
    minSemitones: number;
    maxSemitones: number;
  };
  stopPrevious?: boolean; // For tap sounds that should stop previous instances
  layerable?: boolean; // For world sounds that can be layered
  distanceAttenuation?: boolean; // For world sounds that get quieter when zoomed out
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
}

// Default sound configurations
export const DEFAULT_SOUND_CONFIGS: SoundConfig[] = [
  {
    id: "tap-bing-bong",
    filePath: "/audio/bing-bong.mp3",
    type: "tap",
    volume: 0.7,
    detune: {
      enabled: true,
      minSemitones: -2,
      maxSemitones: 2,
    },
    stopPrevious: true,
  },
  {
    id: "tap-bongs",
    filePath: "/audio/bongs.wav",
    type: "tap",
    volume: 0.7,
    detune: {
      enabled: false,
      minSemitones: 0,
      maxSemitones: 0,
    },
    stopPrevious: true,
  },
];

// Global state
let sounds = new Map<string, SoundInstance>();
let configs = new Map<string, SoundConfig>();
let audioBuffers = new Map<string, AudioBuffer>(); // Preloaded audio buffers
// Track instance ids by sound id for fast stopPrevious handling
const instancesBySoundId = new Map<string, Set<string>>();
// Internal debug flag
const DEBUG_LOGS = false;
let state: SoundSystemState = {
  enabled: true,
  masterVolume: 1.0,
  tapVolume: 1.0,
  worldVolume: 1.0,
  uiVolume: 1.0,
};

// Three.js Audio Listener (singleton)
let audioListener: THREE.AudioListener | null = null;
let listenerAttachedToCamera = false;

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

// Calculate final volume
const calculateFinalVolume = (config: SoundConfig): number => {
  const baseVolume = config.volume;
  const typeVolume = getTypeVolume(config.type);
  return baseVolume * typeVolume * state.masterVolume;
};

// Clean up sound instance
const cleanupSound = (instanceId: string): void => {
  const instance = sounds.get(instanceId);
  if (instance) {
    instance.sound.stop();
    // Remove instance id index
    const byId = instancesBySoundId.get(instance.config.id);
    if (byId) {
      byId.delete(instanceId);
      if (byId.size === 0) instancesBySoundId.delete(instance.config.id);
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
  console.log(`playSound called with soundId: ${soundId}`);

  if (!state.enabled) {
    console.warn("Sound system is disabled");
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

  console.log(`Playing sound: ${soundId}`, config);

  // Merge options with base config
  const finalConfig = { ...config, ...options };

  try {
    // Stop previous instance(s) if requested
    if (finalConfig.stopPrevious) {
      const existing = instancesBySoundId.get(finalConfig.id);
      if (existing) {
        for (const instanceId of Array.from(existing)) {
          stopSound(instanceId);
        }
      }
    }

    // Create Three.js Audio
    const sound = new THREE.Audio(listener);
    console.log(`Created THREE.Audio for ${soundId}`);

    // Fetch buffer (cache or load)
    const buffer = await getOrLoadBuffer(finalConfig);
    if (!buffer) return;

    // Configure sound node
    sound.setBuffer(buffer);
    if (finalConfig.detune?.enabled) {
      const detune = getRandomDetune(finalConfig.detune);
      sound.setPlaybackRate(Math.pow(2, detune / 12));
      console.log(`Detune applied for ${soundId}:`, detune);
    }

    const finalVolume = calculateFinalVolume(finalConfig);
    if (finalVolume <= 0) return; // avoid work when muted
    sound.setVolume(finalVolume);
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
    const anySound = sound as any;
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

export const stopSound = (instanceId: string): void => {
  const instance = sounds.get(instanceId);
  if (!instance) return;

  console.log(`Stopping sound instance: ${instanceId}`);
  instance.sound.stop();
  cleanupSound(instanceId);
};

export const stopSoundsByType = (type: SoundConfig["type"]): void => {
  console.log(`Stopping all sounds of type: ${type}`);
  const soundsToStop = Array.from(sounds).filter(
    ([_, instance]) => instance.config.type === type
  );
  console.log(`Found ${soundsToStop.length} sounds to stop`);

  for (const [instanceId, instance] of soundsToStop) {
    stopSound(instanceId);
  }

  console.log(`Finished stopping ${type} sounds`);
};

export const stopAllSounds = (): void => {
  for (const instanceId of Array.from(sounds.keys())) {
    stopSound(instanceId);
  }
};

// Volume control functions
export const setMasterVolume = (volume: number): void => {
  state.masterVolume = Math.max(0, Math.min(1, volume));
  updateAllVolumes();
};

export const setTypeVolume = (
  type: SoundConfig["type"],
  volume: number
): void => {
  const clampedVolume = Math.max(0, Math.min(1, volume));

  switch (type) {
    case "tap":
      state.tapVolume = clampedVolume;
      break;
    case "world":
      state.worldVolume = clampedVolume;
      break;
    case "ui":
      state.uiVolume = clampedVolume;
      break;
  }

  updateAllVolumes();
};

const updateAllVolumes = (): void => {
  for (const [instanceId, instance] of Array.from(sounds)) {
    const newVolume = calculateFinalVolume(instance.config);
    instance.sound.setVolume(newVolume);
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
};

export const disable = (): void => {
  state.enabled = false;
  stopAllSounds();
};

export const isEnabled = (): boolean => {
  return state.enabled;
};

export const getState = (): SoundSystemState => {
  return { ...state };
};

// Distance attenuation for world sounds (when menu is open/closed)
export const updateWorldSoundVolumes = (isMenuOpen: boolean): void => {
  for (const [instanceId, instance] of Array.from(sounds)) {
    if (
      instance.config.type === "world" &&
      instance.config.distanceAttenuation
    ) {
      const baseVolume = calculateFinalVolume(instance.config);
      const attenuatedVolume = isMenuOpen ? baseVolume * 0.3 : baseVolume;
      instance.sound.setVolume(attenuatedVolume);
    }
  }
};

// Initialize sound system early
export const initializeSoundSystemAsync = async () => {
  console.log("Initializing Three.js sound system...");
  const listener = initializeAudioListener();
  if (listener) {
    console.log("Three.js sound system initialized successfully");
    console.log("Preloading audio files...");
    await preloadAudioFiles();
  } else {
    console.error("Failed to initialize Three.js sound system");
  }
};

// Convenience functions for common use cases
export const playTapSound = (soundId: string = "tap-bing-bong") => {
  console.log("playTapSound called with soundId:", soundId);
  playSound(soundId);
};

export const playWorldSound = (
  soundId: string,
  options?: Partial<SoundConfig>
) => {
  playSound(soundId, options);
};

export const stopAllTapSounds = () => {
  stopSoundsByType("tap");
};

export const stopAllWorldSounds = () => {
  stopSoundsByType("world");
};

export const setTapVolume = (volume: number) => {
  setTypeVolume("tap", volume);
};

export const setWorldVolume = (volume: number) => {
  setTypeVolume("world", volume);
};

// Test function to verify sound system is working
export const testSoundSystem = () => {
  console.log("Testing Three.js sound system...");
  console.log("Sound system state:", getState());
  console.log("Audio listener:", audioListener);
  console.log("Audio context state:", audioListener?.context?.state);
  console.log("Preloaded buffers:", Array.from(audioBuffers.keys()));

  // Try to play a simple beep using oscillator
  try {
    if (audioListener) {
      const oscillator = new THREE.Audio(audioListener);
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
  }
};

// Debug function to check current state
export const debugSoundSystem = () => {
  console.log("=== Three.js Sound System Debug ===");
  console.log("State:", state);
  console.log("Audio Listener:", audioListener);
  console.log("Audio Context State:", audioListener?.context?.state);
  console.log("Audio Context Sample Rate:", audioListener?.context?.sampleRate);
  console.log("Preloaded Buffers:", Array.from(audioBuffers.keys()));
  console.log("Configs:", Array.from(configs.keys()));
  console.log("Sounds:", Array.from(sounds.keys()));
  console.log("========================");
};
