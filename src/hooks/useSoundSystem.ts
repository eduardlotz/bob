import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  playTapSound as playTapSoundUtil,
  playWorldSound as playWorldSoundUtil,
  stopAllTapSounds,
  stopAllWorldSounds,
  isEnabled,
  enable as engineEnable,
  disable as engineDisable,
  setMasterVolume as engineSetMasterVolume,
  setTypeVolume as engineSetTypeVolume,
  updateWorldSoundVolumes,
  mute as engineMute,
  unmute as engineUnmute,
  resumeAudioContext,
  unlockAudioContext,
  playUISound as enginePlayUISound,
  addSoundConfig as engineAddSoundConfig,
  playWorldSound as enginePlayWorldSound,
  stopSoundsById as engineStopSoundsById,
} from "../utils/soundSystem";
import { getWorldSoundById, tryGetWorldSoundById } from "@/utils/sound/configs";
import { useGameStore } from "../store/gameStore";

let _initPerformed = false;

export interface SoundSystemHook {
  playTapSound: (soundId?: string) => void;
  playWorldSound: (soundId: string, options?: any) => void;
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
  const soundSystem = useGameStore((s) => s.soundSystem);

  const lastNonZeroRef = useRef<number>(
    soundSystem.masterVolume > 0 ? soundSystem.masterVolume : 1
  );

  useEffect(() => {
    if (_initPerformed) return;

    try {
      engineSetMasterVolume(soundSystem.masterVolume);
      engineSetTypeVolume("tap", soundSystem.tapVolume);
      engineSetTypeVolume("world", soundSystem.worldVolume);
      engineSetTypeVolume("ui", soundSystem.uiVolume);
      engineSetTypeVolume("text", soundSystem.textVolume);

      if (soundSystem.enabled) {
        try {
          engineEnable();
        } catch (err) {
          console.error("Failed to enable engine on init:", err);
        }
      } else {
        try {
          engineDisable();
        } catch (err) {
          console.error("Failed to disable engine on init:", err);
        }
      }

      if (
        soundSystem.enabled &&
        soundSystem.masterVolume > 0 &&
        soundSystem.worldEnabled !== false
      ) {
        queueMicrotask(() => {
          resumeSelectedWorldLayersSnapshot();
        });
      }
    } catch (err) {
      console.error("Sound system init error:", err);
    }

    _initPerformed = true;
  }, []);

  const setTypeVolume = useCallback((type: string, v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    try {
      engineSetTypeVolume(type as any, clamped);
    } catch (err) {
      console.error(`Failed to set ${type} volume:`, err);
    }
  }, []);

  const resumeSelectedWorldLayersSnapshot = useCallback(() => {
    const s = useGameStore.getState();
    if (!s.soundSystem.enabled) return;
    if (s.soundSystem.masterVolume <= 0) return;
    if (s.soundSystem.worldEnabled === false) return;
    const ids: string[] = s.audioSelections?.worldSoundIds ?? [];
    if (!ids.length) return;

    try {
      stopAllWorldSounds();
    } catch (err) {
      console.warn("stopAllWorldSounds failed during resume:", err);
    }

    // microtask to avoid timing issues with engine cleanup
    queueMicrotask(() => {
      ids.forEach((id) => {
        try {
          const track = tryGetWorldSoundById(id);
          if (!track) return;
          engineAddSoundConfig({
            id: track.id,
            filePath: track.filePath,
            type: "world",
            volume: 0.1,
            loop: true,
            stopPrevious: true,
            distanceAttenuation: false,
            detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
          } as any);

          try {
            engineStopSoundsById(track.id);
          } catch (err) {
            // not fatal — continue
            console.warn(`engineStopSoundsById failed for ${track.id}:`, err);
          }

          enginePlayWorldSound(track.id, { loop: true, stopPrevious: true });
        } catch (err) {
          console.error("Error while resuming world layer", id, err);
        }
      });

      try {
        updateWorldSoundVolumes(false);
      } catch (err) {
        console.warn("updateWorldSoundVolumes failed:", err);
      }
    });
  }, []);

  const playTapSound = useCallback((soundId?: string) => {
    const s = useGameStore.getState();
    if (s.isPaused) return;
    if (!isEnabled()) return;
    try {
      if (typeof soundId === "string") {
        playTapSoundUtil(soundId);
      } else {
        (playTapSoundUtil as any)();
      }
    } catch (err) {
      console.error("playTapSound failed:", err);
    }
  }, []);

  const playWorldSound = useCallback((soundId: string, options?: any) => {
    const s = useGameStore.getState();
    if (!isEnabled() || s.isPaused) return;
    try {
      playWorldSoundUtil(soundId, options);
    } catch (err) {
      console.error("playWorldSound failed:", err);
    }
  }, []);

  const setMasterVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      try {
        engineSetMasterVolume(clamped);
      } catch (err) {
        console.error("engineSetMasterVolume failed:", err);
      }

      const store = useGameStore.getState();
      store.setMasterVolume(clamped);

      if (clamped > 0) {
        lastNonZeroRef.current = clamped;
      }

      if (clamped > 0) {
        resumeSelectedWorldLayersSnapshot();
      }
    },
    [resumeSelectedWorldLayersSnapshot]
  );

  const setTapVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setTypeVolume("tap", clamped);
      useGameStore.getState().setTapVolume(clamped);
    },
    [setTypeVolume]
  );

  const setWorldVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setTypeVolume("world", clamped);
      useGameStore.getState().setWorldVolume(clamped);
      try {
        updateWorldSoundVolumes(false);
      } catch (err) {
        console.warn("updateWorldSoundVolumes failed:", err);
      }
    },
    [setTypeVolume]
  );

  const setUIVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setTypeVolume("ui", clamped);
      useGameStore.getState().setUIVolume(clamped);
    },
    [setTypeVolume]
  );

  const setTextVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setTypeVolume("text", clamped);
      useGameStore.getState().setTextVolume(clamped);
    },
    [setTypeVolume]
  );

  const enable = useCallback(() => {
    useGameStore.getState().setSoundEnabled(true);
    try {
      engineEnable();
    } catch (err) {
      console.error("engineEnable failed:", err);
    }

    const s = useGameStore.getState();
    if (
      s.soundSystem.masterVolume > 0 &&
      s.soundSystem.worldEnabled !== false &&
      Array.isArray(s.audioSelections?.worldSoundIds) &&
      s.audioSelections.worldSoundIds.length > 0
    ) {
      resumeSelectedWorldLayersSnapshot();
    }
  }, [resumeSelectedWorldLayersSnapshot]);

  const disable = useCallback(() => {
    useGameStore.getState().setSoundEnabled(false);
    try {
      engineDisable();
    } catch (err) {
      console.error("engineDisable failed:", err);
    }
  }, []);

  // volume-based, does not flip "enabled" flag
  const mute = useCallback(() => {
    const store = useGameStore.getState();
    const current = store.soundSystem.masterVolume;
    if (current > 0) {
      lastNonZeroRef.current = current;
    }

    try {
      engineMute();
    } catch (err) {
      console.error("engineMute failed:", err);
    }

    store.setMasterVolume(0);
  }, []);

  const unmute = useCallback(async () => {
    const restore = lastNonZeroRef.current > 0 ? lastNonZeroRef.current : 1;
    try {
      await resumeAudioContext();
      await unlockAudioContext();
    } catch (err) {
      console.warn("resume/unlock audio context failed:", err);
    }

    try {
      engineUnmute();
    } catch (err) {
      console.error("engineUnmute failed:", err);
    }

    useGameStore.getState().setMasterVolume(restore);
    resumeSelectedWorldLayersSnapshot();
  }, [resumeSelectedWorldLayersSnapshot]);

  const toggleMute = useCallback(() => {
    const store = useGameStore.getState();
    const current = store.soundSystem.masterVolume;
    if (current > 0) {
      mute();
    } else {
      unmute();
    }
  }, [mute, unmute]);

  const playUISound = useCallback((soundId?: string) => {
    try {
      if (soundId) enginePlayUISound(soundId);
      else enginePlayUISound();
    } catch (err) {
      console.error("playUISound failed:", err);
    }
  }, []);

  const isActive = useMemo(
    () => soundSystem.enabled && soundSystem.masterVolume > 0,
    [soundSystem.enabled, soundSystem.masterVolume]
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
    textVolume: (soundSystem as any).textVolume,
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
