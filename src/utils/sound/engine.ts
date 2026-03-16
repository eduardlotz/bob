import { Howl, Howler } from "howler";
import type * as THREE from "three";
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
import {
  NormalizedSoundConfig,
  SoundConfig,
  SoundInstance,
  SoundPlaybackConfig,
  SoundSystemState,
  SoundType,
} from "./types";

const WORLD_MENU_ATTENUATION = 0.3;

const DEFAULT_PLAYBACK_BY_TYPE: Record<
  SoundType,
  Required<SoundPlaybackConfig>
> = {
  tap: {
    group: "",
    overlap: "layer",
    maxConcurrent: 6,
    limitBehavior: "stop-oldest",
  },
  world: {
    group: "",
    overlap: "restart",
    maxConcurrent: 1,
    limitBehavior: "stop-oldest",
  },
  ui: {
    group: "",
    overlap: "restart",
    maxConcurrent: 2,
    limitBehavior: "stop-oldest",
  },
  text: {
    group: "",
    overlap: "layer",
    maxConcurrent: 12,
    limitBehavior: "stop-oldest",
  },
};

const configs = new Map<string, NormalizedSoundConfig>();
const howls = new Map<string, Howl>();
const instances = new Map<string, SoundInstance>();
const instancesBySoundId = new Map<string, Set<string>>();
const instancesByGroup = new Map<string, Set<string>>();

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
let currentWorldMusicId = DEFAULT_WORLD_MUSIC.id;
let currentWorldMusicFilePath = DEFAULT_WORLD_MUSIC.filePath;
let currentTapSoundId = DEFAULT_TAP_SOUND.id;
let isWorldMenuOpen = false;

const toFinite = (value: unknown, fallback = 0): number =>
  Number.isFinite(value) ? (value as number) : fallback;

const clamp01 = (value: unknown): number => {
  const safe = toFinite(value, 0);
  return Math.max(0, Math.min(1, safe));
};

const getTypeVolume = (type: SoundType): number => {
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

const isTypeEnabled = (type: SoundType): boolean => {
  if (type === "tap") return state.tapEnabled !== false;
  if (type === "world") return state.worldEnabled !== false;
  return true;
};

const normalizeSoundConfig = (config: SoundConfig): NormalizedSoundConfig => {
  const defaults = DEFAULT_PLAYBACK_BY_TYPE[config.type];
  const overlap =
    config.playback?.overlap ??
    (config.layerable ? "layer" : undefined) ??
    (config.stopPrevious ? "restart" : undefined) ??
    defaults.overlap;
  const maxConcurrent =
    config.playback?.maxConcurrent ??
    (overlap === "replace-group" ? 1 : defaults.maxConcurrent);
  const pool = Math.max(
    Math.ceil(toFinite(config.pool, 0)),
    Math.ceil(maxConcurrent) + 2,
    6,
  );

  return {
    ...config,
    src: Array.isArray(config.src)
      ? config.src
      : [config.src ?? config.filePath].filter(Boolean),
    category: config.category ?? config.type,
    loop: !!config.loop,
    preload: !!config.preload,
    html5: !!config.html5,
    pool,
    fadeIn: Math.max(0, toFinite(config.fadeIn, 0)),
    fadeOut: Math.max(0, toFinite(config.fadeOut, 0)),
    distanceAttenuation: !!config.distanceAttenuation,
    playback: {
      group: config.playback?.group ?? defaults.group,
      overlap,
      maxConcurrent: Math.max(1, Math.ceil(maxConcurrent)),
      limitBehavior: config.playback?.limitBehavior ?? defaults.limitBehavior,
    },
    volume: clamp01(config.volume),
  };
};

const mergeSoundConfig = (
  base: NormalizedSoundConfig,
  overrides?: Partial<SoundConfig>,
): NormalizedSoundConfig => {
  if (!overrides) return base;

  return normalizeSoundConfig({
    ...base,
    ...overrides,
    src: overrides.src ?? base.src,
    playback: {
      ...base.playback,
      ...overrides.playback,
    },
  });
};

const compareSrc = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const getOrCreateHowl = (config: NormalizedSoundConfig): Howl => {
  const cached = howls.get(config.id);
  if (cached) return cached;

  const howl = new Howl({
    src: config.src,
    loop: config.loop,
    preload: config.preload,
    html5: config.html5,
    pool: config.pool,
    volume: 1,
    onloaderror: (_, error) => {
      console.error(`Failed to load sound "${config.id}"`, error);
    },
    onplayerror: async () => {
      try {
        await resumeAudioContext();
      } catch {}
    },
  });

  howls.set(config.id, howl);
  return howl;
};

const preloadHowl = async (soundId: string): Promise<void> => {
  const config = configs.get(soundId);
  if (!config) return;

  const howl = getOrCreateHowl(config);
  if (howl.state() === "loaded") return;

  await new Promise<void>((resolve) => {
    const finish = () => resolve();
    howl.once("load", finish);
    howl.once("loaderror", finish);
    howl.load();
  });
};

const ensureDefaultConfigs = () => {
  for (const config of DEFAULT_SOUND_CONFIGS) {
    addSoundConfig(config);
  }
};

const getRandomPlaybackRate = (config: NormalizedSoundConfig) => {
  if (!config.detune?.enabled) return 1;

  const semitones =
    Math.random() *
      (config.detune.maxSemitones - config.detune.minSemitones) +
    config.detune.minSemitones;
  return Math.pow(2, semitones / 12);
};

const getAttenuation = (config: NormalizedSoundConfig) =>
  config.type === "world" && config.distanceAttenuation && isWorldMenuOpen
    ? WORLD_MENU_ATTENUATION
    : 1;

const calculateFinalVolume = (
  config: NormalizedSoundConfig,
  attenuation = 1,
): number => {
  if (!state.enabled) return 0;
  if (!isTypeEnabled(config.type)) return 0;
  return (
    clamp01(config.volume) *
    clamp01(getTypeVolume(config.type)) *
    clamp01(state.masterVolume) *
    clamp01(attenuation)
  );
};

const addToIndex = (map: Map<string, Set<string>>, key: string, instanceId: string) => {
  if (!key) return;
  const set = map.get(key) ?? new Set<string>();
  set.add(instanceId);
  map.set(key, set);
};

const removeFromIndex = (
  map: Map<string, Set<string>>,
  key: string,
  instanceId: string,
) => {
  if (!key) return;
  const set = map.get(key);
  if (!set) return;
  set.delete(instanceId);
  if (set.size === 0) {
    map.delete(key);
  }
};

const cleanupInstance = (instanceId: string) => {
  const instance = instances.get(instanceId);
  if (!instance) return;

  instances.delete(instanceId);
  removeFromIndex(instancesBySoundId, instance.soundId, instanceId);
  removeFromIndex(instancesByGroup, instance.config.playback.group, instanceId);
};

const getInstancesForSound = (soundId: string) =>
  Array.from(instancesBySoundId.get(soundId) ?? [])
    .map((instanceId) => instances.get(instanceId))
    .filter((instance): instance is SoundInstance => !!instance);

const getInstancesForGroup = (group: string) =>
  Array.from(instancesByGroup.get(group) ?? [])
    .map((instanceId) => instances.get(instanceId))
    .filter((instance): instance is SoundInstance => !!instance);

const updateInstanceVolume = (instance: SoundInstance) => {
  const howl = howls.get(instance.soundId);
  if (!howl) return;
  const volume = calculateFinalVolume(instance.config, instance.attenuation);
  howl.volume(volume, instance.howlId);
};

const stopSoundInternal = (instanceId: string, fadeOutMs?: number) => {
  const instance = instances.get(instanceId);
  if (!instance) return;

  const howl = howls.get(instance.soundId);
  if (!howl) {
    cleanupInstance(instanceId);
    return;
  }

  const fadeOut = Math.max(0, toFinite(fadeOutMs, instance.config.fadeOut));
  if (fadeOut > 0 && howl.playing(instance.howlId)) {
    const currentVolume = toFinite(howl.volume(instance.howlId), 0);
    howl.fade(currentVolume, 0, fadeOut, instance.howlId);
    globalThis.setTimeout(() => {
      try {
        howl.stop(instance.howlId);
      } catch {}
      cleanupInstance(instanceId);
    }, fadeOut + 20);
    return;
  }

  try {
    howl.stop(instance.howlId);
  } catch {}
  cleanupInstance(instanceId);
};

const enforcePlaybackRules = (config: NormalizedSoundConfig): boolean => {
  const sameSoundInstances = getInstancesForSound(config.id);
  const groupInstances = config.playback.group
    ? getInstancesForGroup(config.playback.group)
    : [];

  switch (config.playback.overlap) {
    case "restart":
      sameSoundInstances.forEach((instance) => stopSoundInternal(instance.id));
      break;
    case "ignore":
      if (sameSoundInstances.length > 0) return false;
      break;
    case "replace-group":
      groupInstances.forEach((instance) => stopSoundInternal(instance.id));
      break;
    case "layer":
    default:
      break;
  }

  const trackedInstances =
    config.playback.overlap === "replace-group" && config.playback.group
      ? getInstancesForGroup(config.playback.group)
      : getInstancesForSound(config.id);

  if (trackedInstances.length < config.playback.maxConcurrent) {
    return true;
  }

  if (config.playback.limitBehavior === "skip-new") {
    return false;
  }

  trackedInstances
    .sort((left, right) => left.startedAt - right.startedAt)
    .slice(0, trackedInstances.length - config.playback.maxConcurrent + 1)
    .forEach((instance) => stopSoundInternal(instance.id));

  return true;
};

const registerInstance = (instance: SoundInstance) => {
  instances.set(instance.id, instance);
  addToIndex(instancesBySoundId, instance.soundId, instance.id);
  addToIndex(instancesByGroup, instance.config.playback.group, instance.id);
};

export const resumeAudioContext = async () => {
  const ctx = (Howler as any).ctx as AudioContext | undefined;
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
};

export const unlockAudioContext = async () => {
  const ctx = (Howler as any).ctx as AudioContext | undefined;
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
};

export const suspendAudioContext = async () => {
  const ctx = (Howler as any).ctx as AudioContext | undefined;
  if (!ctx) return;
  if (ctx.state === "running") {
    await ctx.suspend();
  }
};

export const getAudioContextState = (): string | null => {
  try {
    return ((Howler as any).ctx as AudioContext | undefined)?.state ?? null;
  } catch {
    return null;
  }
};

export const isAudioContextRunning = (): boolean =>
  getAudioContextState() === "running";

export const getAudioListener = (): THREE.AudioListener | null => {
  return null;
};

export const attachListenerToCamera = (_camera: THREE.Camera): void => {};

export const playSound = (soundId: string, options?: Partial<SoundConfig>): void => {
  ensureDefaultConfigs();

  const baseConfig = configs.get(soundId);
  if (!baseConfig) {
    console.warn(`Sound config not found: ${soundId}`);
    return;
  }

  const config = mergeSoundConfig(baseConfig, options);
  if (!state.enabled || state.masterVolume <= 0 || !isTypeEnabled(config.type)) {
    return;
  }

  if (!enforcePlaybackRules(config)) {
    return;
  }

  const howl = getOrCreateHowl(config);
  const howlId = howl.play();
  if (typeof howlId !== "number") return;

  howl.loop(config.loop, howlId);
  howl.rate(getRandomPlaybackRate(config), howlId);

  const instance: SoundInstance = {
    id: `${config.id}:${Date.now()}:${howlId}`,
    soundId: config.id,
    howlId,
    config,
    startedAt: Date.now(),
    attenuation: getAttenuation(config),
  };

  registerInstance(instance);

  const targetVolume = calculateFinalVolume(config, instance.attenuation);
  if (config.fadeIn > 0) {
    howl.volume(0, howlId);
    howl.fade(0, targetVolume, config.fadeIn, howlId);
  } else {
    howl.volume(targetVolume, howlId);
  }

  howl.once("end", () => cleanupInstance(instance.id), howlId);
  howl.once("loaderror", () => cleanupInstance(instance.id), howlId);
};

export const stopSound = (instanceId: string): void => {
  stopSoundInternal(instanceId);
};

export const stopSoundsByType = (type: SoundType): void => {
  Array.from(instances.values())
    .filter((instance) => instance.config.type === type)
    .forEach((instance) => stopSoundInternal(instance.id));
};

export const stopAllSounds = (): void => {
  Array.from(instances.keys()).forEach((instanceId) => stopSoundInternal(instanceId));
};

export const forceStopAllSounds = (): void => {
  Array.from(instances.values()).forEach((instance) => {
    try {
      howls.get(instance.soundId)?.stop(instance.howlId);
    } catch {}
  });

  instances.clear();
  instancesBySoundId.clear();
  instancesByGroup.clear();
};

const updateAllVolumes = () => {
  Array.from(instances.values()).forEach(updateInstanceVolume);
};

export const setMasterVolume = (volume: number): void => {
  state.masterVolume = clamp01(volume);
  if (state.masterVolume > 0) {
    lastNonZeroMasterVolume = state.masterVolume;
  }
  updateAllVolumes();
};

export const setTypeVolume = (type: SoundType, volume: number): void => {
  const next = clamp01(volume);
  switch (type) {
    case "tap":
      state.tapVolume = next;
      break;
    case "world":
      state.worldVolume = next;
      break;
    case "ui":
      state.uiVolume = next;
      break;
    case "text":
      state.textVolume = next;
      break;
  }
  updateAllVolumes();
};

export const addSoundConfig = (config: SoundConfig): void => {
  const normalized = normalizeSoundConfig(config);
  const existing = configs.get(normalized.id);
  configs.set(normalized.id, normalized);

  if (
    existing &&
    (!compareSrc(existing.src, normalized.src) ||
      existing.html5 !== normalized.html5 ||
      existing.pool !== normalized.pool)
  ) {
    const howl = howls.get(normalized.id);
    howl?.unload();
    howls.delete(normalized.id);
  }
};

export const removeSoundConfig = (soundId: string): void => {
  stopSoundsById(soundId);
  configs.delete(soundId);
  const howl = howls.get(soundId);
  howl?.unload();
  howls.delete(soundId);
};

export const getSoundConfig = (soundId: string): NormalizedSoundConfig | undefined => {
  ensureDefaultConfigs();
  return configs.get(soundId);
};

export const enable = (): void => {
  state.enabled = true;
  updateAllVolumes();
  resumeAudioContext().catch(() => {});
};

export const disable = (): void => {
  state.enabled = false;
  updateAllVolumes();
};

export const start = enable;
export const stop = disable;

export const isEnabled = (): boolean => state.enabled;

export const getState = (): SoundSystemState => ({ ...state });

export const updateWorldSoundVolumes = (isMenuOpen: boolean): void => {
  isWorldMenuOpen = isMenuOpen;
  Array.from(instances.values())
    .filter((instance) => instance.config.type === "world")
    .forEach((instance) => {
      instance.attenuation = getAttenuation(instance.config);
      updateInstanceVolume(instance);
    });
};

export const initializeSoundSystem = async () => {
  ensureDefaultConfigs();
  await Promise.all(DEFAULT_SOUND_CONFIGS.map((config) => preloadHowl(config.id)));
  if (DEBUG_LOGS) {
    console.log("Howler sound system initialized", Array.from(configs.keys()));
  }
};

export const playTapSound = (soundId: string = currentTapSoundId) => {
  if (state.tapEnabled === false) return;
  playSound(soundId);
};

export const playWorldSound = (soundId: string, options?: Partial<SoundConfig>) => {
  if (state.worldEnabled === false) return;
  playSound(soundId, {
    loop: true,
    fadeIn: 2500,
    fadeOut: 1200,
    ...options,
  });
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
  getInstancesForSound(soundConfigId).forEach((instance) => stopSoundInternal(instance.id));
};

export const setTapVolume = (volume: number) => {
  setTypeVolume("tap", volume);
};

export const setWorldVolume = (volume: number) => {
  setTypeVolume("world", volume);
};

export const stopBackgroundMusic = (): void => {
  getInstancesForGroup("world-music").forEach((instance) => stopSoundInternal(instance.id));
};

export const mute = (): void => {
  if (state.masterVolume > 0) {
    lastNonZeroMasterVolume = state.masterVolume;
  }
  setMasterVolume(0);
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
  if (!state.tapEnabled) {
    stopAllTapSounds();
  }
  updateAllVolumes();
};

export const setWorldEnabled = (enabled: boolean): void => {
  state.worldEnabled = !!enabled;
  if (!state.worldEnabled) {
    stopAllWorldSounds();
  }
  updateAllVolumes();
};

export const setWorldMusic = (filePath: string, id: string): void => {
  currentWorldMusicId = id;
  currentWorldMusicFilePath = filePath;
  addSoundConfig({
    id,
    filePath,
    type: "world",
    category: "background",
    volume: DEFAULT_WORLD_VOLUME,
    loop: true,
    fadeIn: 2500,
    fadeOut: 1200,
    playback: {
      group: "world-music",
      overlap: "replace-group",
      maxConcurrent: 1,
      limitBehavior: "stop-oldest",
    },
  });
};

export const setCurrentTapSound = (id: string, filePath?: string): void => {
  currentTapSoundId = id;
  if (!filePath) return;

  addSoundConfig({
    id,
    filePath,
    type: "tap",
    category: "tap",
    volume: state.tapVolume,
    pool: 12,
    detune: { enabled: true, minSemitones: -2, maxSemitones: 2 },
    playback: {
      overlap: "layer",
      maxConcurrent: 6,
      limitBehavior: "stop-oldest",
    },
  });
};

export const testSoundSystem = () => {
  console.group("Howler sound system test");
  console.log("Sound system state:", getState());
  console.log("Current world music:", currentWorldMusicId, currentWorldMusicFilePath);
  console.log("Registered configs:", Array.from(configs.keys()));
  console.log("Active instances:", Array.from(instances.keys()));
  console.groupEnd();

  try {
    playUISound();
  } catch (error) {
    console.error("Test sound failed:", error);
  }
};

export const debugSoundSystem = () => {
  console.group("=== Howler Sound System Debug ===");
  console.log("State:", state);
  console.log("Current world music:", currentWorldMusicId, currentWorldMusicFilePath);
  console.log("Configs:", Array.from(configs.entries()));
  console.log("Howls:", Array.from(howls.keys()));
  console.log("Instances:", Array.from(instances.values()));
  console.log("Howler context:", getAudioContextState());
  console.groupEnd();
};

ensureDefaultConfigs();
