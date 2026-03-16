import { useCallback, useEffect, useMemo, useRef } from "react";
import type { SoundConfig } from "@/utils/sound/types";
import {
  addSoundConfig as engineAddSoundConfig,
  disable as engineDisable,
  enable as engineEnable,
  getSoundConfig as engineGetSoundConfig,
  isEnabled,
  mute as engineMute,
  playTapSound as playTapSoundUtil,
  playUISound as enginePlayUISound,
  playWorldSound as playWorldSoundUtil,
  resumeAudioContext,
  setMasterVolume as engineSetMasterVolume,
  setTypeVolume as engineSetTypeVolume,
  stopAllTapSounds,
  stopAllWorldSounds,
  stopSoundsById as engineStopSoundsById,
  unlockAudioContext,
  unmute as engineUnmute,
  updateWorldSoundVolumes,
} from "../utils/soundSystem";
import { tryGetWorldSoundById } from "@/utils/sound/configs";
import { useCoreStore } from "../store/core/store";

let initPerformed = false;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export interface SoundSystemHook {
  playTapSound: (soundId?: string) => void;
  playWorldSound: (soundId: string, options?: Partial<SoundConfig>) => void;
  playUISound: (soundId?: string) => void;
  stopAllTapSounds: () => void;
  stopAllWorldSounds: () => void;
  setMasterVolume: (volume: number) => void;
  setTapVolume: (volume: number) => void;
  setWorldVolume: (volume: number) => void;
  setUIVolume: (volume: number) => void;
  setTextVolume: (volume: number) => void;
  isEnabled: boolean;
  isMuted: boolean;
  audioStatus: "playing" | "muted" | "stopped";
  isActive: boolean;
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;
  uiVolume: number;
  textVolume: number;
  enable: () => void;
  disable: () => void;
  start: () => void;
  stop: () => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  toggle: () => void;
}

export function useSoundSystem(): SoundSystemHook {
  const soundSystem = useCoreStore((state) => state.soundSystem);
  const worldSoundIds = useCoreStore(
    (state) => state.audioSelections?.worldSoundIds ?? [],
  );
  const isPaused = useCoreStore((state) => state.isPaused);

  const lastNonZeroRef = useRef(
    soundSystem.masterVolume > 0 ? soundSystem.masterVolume : 1,
  );
  const syncedWorldIdsRef = useRef<string[]>([]);
  const worldPlaybackWasBlockedRef = useRef(false);

  const stopTrackedWorldLayers = useCallback((ids: string[]) => {
    ids.forEach((id) => {
      try {
        engineStopSoundsById(id);
      } catch (error) {
        console.warn(`Failed to stop world layer "${id}"`, error);
      }
    });
  }, []);

  const ensureWorldSoundConfig = useCallback((soundId: string) => {
    if (engineGetSoundConfig(soundId)) return true;

    const track = tryGetWorldSoundById(soundId);
    if (!track) return false;

    engineAddSoundConfig({
      id: track.id,
      filePath: track.filePath,
      type: "world",
      category: "ambient",
      volume: 0.2,
      loop: true,
      fadeIn: 2000,
      fadeOut: 1000,
      playback: {
        overlap: "restart",
        maxConcurrent: 1,
        limitBehavior: "stop-oldest",
      },
    });

    return true;
  }, []);

  const syncSelectedWorldLayers = useCallback(
    (forceRestart = false) => {
      const state = useCoreStore.getState();
      const nextIds = Array.from(
        new Set(state.audioSelections?.worldSoundIds ?? []),
      );
      const previousIds = syncedWorldIdsRef.current;
      const canPlayWorldLayers =
        state.soundSystem.enabled &&
        state.soundSystem.masterVolume > 0 &&
        state.soundSystem.worldEnabled !== false &&
        !state.isPaused;

      if (!canPlayWorldLayers) {
        stopTrackedWorldLayers(previousIds);
        syncedWorldIdsRef.current = nextIds;
        worldPlaybackWasBlockedRef.current = true;
        return;
      }

      const idsToStop = forceRestart
        ? previousIds
        : previousIds.filter((id) => !nextIds.includes(id));
      stopTrackedWorldLayers(idsToStop);

      const idsToPlay = forceRestart
        ? nextIds
        : nextIds.filter((id) => !previousIds.includes(id));

      idsToPlay.forEach((id) => {
        try {
          if (!ensureWorldSoundConfig(id)) return;
          playWorldSoundUtil(id, { loop: true });
        } catch (error) {
          console.error(`Failed to play world layer "${id}"`, error);
        }
      });

      syncedWorldIdsRef.current = nextIds;
      worldPlaybackWasBlockedRef.current = false;

      try {
        updateWorldSoundVolumes(false);
      } catch (error) {
        console.warn("Failed to update world sound volumes", error);
      }
    },
    [ensureWorldSoundConfig, stopTrackedWorldLayers],
  );

  const setTypeVolume = useCallback(
    (type: SoundConfig["type"], volume: number) => {
      try {
        engineSetTypeVolume(type, clamp01(volume));
      } catch (error) {
        console.error(`Failed to set ${type} volume`, error);
      }
    },
    [],
  );

  useEffect(() => {
    if (initPerformed) return;

    try {
      engineSetMasterVolume(soundSystem.masterVolume);
      engineSetTypeVolume("tap", soundSystem.tapVolume);
      engineSetTypeVolume("world", soundSystem.worldVolume);
      engineSetTypeVolume("ui", soundSystem.uiVolume);
      engineSetTypeVolume("text", soundSystem.textVolume);

      if (soundSystem.enabled) {
        engineEnable();
      } else {
        engineDisable();
      }
    } catch (error) {
      console.error("Sound system init error", error);
    }

    initPerformed = true;
  }, [
    soundSystem.enabled,
    soundSystem.masterVolume,
    soundSystem.tapVolume,
    soundSystem.textVolume,
    soundSystem.uiVolume,
    soundSystem.worldVolume,
  ]);

  useEffect(() => {
    if (soundSystem.tapEnabled === false) {
      stopAllTapSounds();
    }
  }, [soundSystem.tapEnabled]);

  useEffect(() => {
    const forceRestart = worldPlaybackWasBlockedRef.current;
    syncSelectedWorldLayers(forceRestart);
  }, [
    isPaused,
    soundSystem.enabled,
    soundSystem.masterVolume,
    soundSystem.worldEnabled,
    syncSelectedWorldLayers,
    worldSoundIds,
  ]);

  const playTapSound = useCallback((soundId?: string) => {
    const state = useCoreStore.getState();
    if (state.isPaused) return;
    if (state.soundSystem.tapEnabled === false) return;
    if (!isEnabled()) return;

    try {
      if (soundId) {
        playTapSoundUtil(soundId);
      } else {
        playTapSoundUtil();
      }
    } catch (error) {
      console.error("playTapSound failed", error);
    }
  }, []);

  const playWorldSound = useCallback(
    (soundId: string, options?: Partial<SoundConfig>) => {
      const state = useCoreStore.getState();
      if (state.isPaused) return;
      if (state.soundSystem.worldEnabled === false) return;
      if (!isEnabled()) return;

      try {
        playWorldSoundUtil(soundId, options);
      } catch (error) {
        console.error("playWorldSound failed", error);
      }
    },
    [],
  );

  const playUISound = useCallback((soundId?: string) => {
    const state = useCoreStore.getState();
    if (state.isPaused || !state.soundSystem.enabled) return;

    try {
      if (soundId) {
        enginePlayUISound(soundId);
      } else {
        enginePlayUISound();
      }
    } catch (error) {
      console.error("playUISound failed", error);
    }
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    const clamped = clamp01(volume);

    try {
      engineSetMasterVolume(clamped);
    } catch (error) {
      console.error("engineSetMasterVolume failed", error);
    }

    useCoreStore.getState().setMasterVolume(clamped);
    if (clamped > 0) {
      lastNonZeroRef.current = clamped;
    }
  }, []);

  const setTapVolume = useCallback(
    (volume: number) => {
      const clamped = clamp01(volume);
      setTypeVolume("tap", clamped);
      useCoreStore.getState().setTapVolume(clamped);
    },
    [setTypeVolume],
  );

  const setWorldVolume = useCallback(
    (volume: number) => {
      const clamped = clamp01(volume);
      setTypeVolume("world", clamped);
      useCoreStore.getState().setWorldVolume(clamped);
      updateWorldSoundVolumes(false);
    },
    [setTypeVolume],
  );

  const setUIVolume = useCallback(
    (volume: number) => {
      const clamped = clamp01(volume);
      setTypeVolume("ui", clamped);
      useCoreStore.getState().setUIVolume(clamped);
    },
    [setTypeVolume],
  );

  const setTextVolume = useCallback(
    (volume: number) => {
      const clamped = clamp01(volume);
      setTypeVolume("text", clamped);
      useCoreStore.getState().setTextVolume(clamped);
    },
    [setTypeVolume],
  );

  const enable = useCallback(() => {
    useCoreStore.getState().setSoundEnabled(true);

    try {
      engineEnable();
    } catch (error) {
      console.error("engineEnable failed", error);
    }
  }, []);

  const disable = useCallback(() => {
    useCoreStore.getState().setSoundEnabled(false);

    try {
      engineDisable();
    } catch (error) {
      console.error("engineDisable failed", error);
    }
  }, []);

  const mute = useCallback(() => {
    const store = useCoreStore.getState();
    if (store.soundSystem.masterVolume > 0) {
      lastNonZeroRef.current = store.soundSystem.masterVolume;
    }

    try {
      engineMute();
    } catch (error) {
      console.error("engineMute failed", error);
    }

    store.setMasterVolume(0);
  }, []);

  const unmute = useCallback(async () => {
    const restoreVolume = lastNonZeroRef.current > 0 ? lastNonZeroRef.current : 1;

    try {
      await resumeAudioContext();
      await unlockAudioContext();
      engineUnmute();
    } catch (error) {
      console.warn("Audio unmute sequence failed", error);
    }

    useCoreStore.getState().setMasterVolume(restoreVolume);
  }, []);

  const toggleMute = useCallback(() => {
    const currentVolume = useCoreStore.getState().soundSystem.masterVolume;
    if (currentVolume > 0) {
      mute();
    } else {
      void unmute();
    }
  }, [mute, unmute]);

  const isActive = useMemo(
    () => soundSystem.enabled && soundSystem.masterVolume > 0,
    [soundSystem.enabled, soundSystem.masterVolume],
  );

  return {
    playTapSound,
    playWorldSound,
    playUISound,
    stopAllTapSounds,
    stopAllWorldSounds,
    setMasterVolume,
    setTapVolume,
    setWorldVolume,
    setUIVolume,
    setTextVolume,
    isEnabled: soundSystem.enabled,
    isMuted: soundSystem.masterVolume === 0,
    audioStatus: !soundSystem.enabled
      ? "stopped"
      : soundSystem.masterVolume === 0
        ? "muted"
        : "playing",
    isActive,
    masterVolume: soundSystem.masterVolume,
    tapVolume: soundSystem.tapVolume,
    worldVolume: soundSystem.worldVolume,
    uiVolume: soundSystem.uiVolume,
    textVolume: soundSystem.textVolume,
    enable,
    disable,
    start: enable,
    stop: disable,
    mute,
    unmute,
    toggleMute,
    toggle: toggleMute,
  };
}
