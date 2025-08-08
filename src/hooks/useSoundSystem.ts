import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  playTapSound as playTapSoundUtil,
  playWorldSound as playWorldSoundUtil,
  stopAllTapSounds,
  stopAllWorldSounds,
  isEnabled,
  getState,
  enable,
  disable,
  setMasterVolume,
  setTypeVolume,
  updateWorldSoundVolumes,
  initializeSoundSystemAsync,
  mute as engineMute,
  unmute as engineUnmute,
  toggleMute as engineToggleMute,
  isAudioContextRunning,
  setTapEnabled as engineSetTapEnabled,
  setWorldEnabled as engineSetWorldEnabled,
  setWorldMusic as engineSetWorldMusic,
  setCurrentTapSound as engineSetCurrentTapSound,
} from "../utils/soundSystem";
import { useGameStore } from "../store/gameStore";
import { match } from "ts-pattern";
import { toast } from "sonner";

export interface SoundSystemHook {
  // Core sound functions
  playTapSound: (soundId?: string) => void;
  playWorldSound: (soundId: string, options?: any) => void;
  stopAllTapSounds: () => void;
  stopAllWorldSounds: () => void;

  // Volume control
  setMasterVolume: (volume: number) => void;
  setTapVolume: (volume: number) => void;
  setWorldVolume: (volume: number) => void;

  // State
  isEnabled: boolean;
  isMuted: boolean;
  audioStatus: "playing" | "muted" | "stopped";
  isActive: boolean;
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;

  // System control
  enable: () => void;
  disable: () => void;
  start: () => void; // alias for enable
  stop: () => void; // alias for disable

  // Mute control
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  toggle: () => void; // alias for toggleMute for UI consumption
}

export function useSoundSystem(): SoundSystemHook {
  const gameStore = useGameStore();
  const lastMenuStateRef = useRef<boolean>(false);
  const lastNonZeroMasterVolumeRef = useRef<number>(
    gameStore.soundSystem.masterVolume > 0
      ? gameStore.soundSystem.masterVolume
      : 1
  );

  // Sound system is initialized in SceneWithLoader before scene loads

  // Get current menu state from game store
  const isMenuOpen = gameStore.routes.some(
    (route) =>
      route.id === "settings" ||
      route.id === "upgrades" ||
      route.id === "themes"
  );

  // Sync sound system with game store
  useEffect(() => {
    setMasterVolume(gameStore.soundSystem.masterVolume);
    setTypeVolume("tap", gameStore.soundSystem.tapVolume);
    setTypeVolume("world", gameStore.soundSystem.worldVolume);
    setTypeVolume("ui", gameStore.soundSystem.uiVolume);

    if (gameStore.soundSystem.enabled) {
      enable();
    } else {
      disable();
    }
  }, [gameStore.soundSystem]);

  // Enhanced tap sound function that integrates with game state
  const playTapSoundWithGameIntegration = useCallback(
    (soundId: string = "tap-bing-bong") => {
      // Only play tap sounds when game is not paused
      if (gameStore.isPaused) return;

      // Use pattern matching to determine if we should play the sound
      const shouldPlaySound = match({
        isPaused: gameStore.isPaused,
        soundEnabled: isEnabled(),
      })
        .with({ isPaused: false, soundEnabled: true }, () => true)
        .otherwise(() => false);

      if (shouldPlaySound) {
        playTapSoundUtil(soundId);
      }
    },
    [gameStore.isPaused, gameStore.routes]
  );

  // Enhanced world sound function
  const playWorldSoundWithOptions = useCallback(
    (soundId: string, options?: any) => {
      if (!isEnabled() || gameStore.isPaused) return;

      playWorldSoundUtil(soundId, options);
    },
    [gameStore.isPaused]
  );

  // Volume control functions
  const setMasterVolumeCallback = useCallback((volume: number) => {
    // Attempt to resume on any user-driven volume change
    try {
      // best effort; engine handles missing listener
      (window as any).requestIdleCallback?.(() => {});
    } catch {}
    const clamped = Math.max(0, Math.min(1, volume));
    setMasterVolume(clamped);
    // Do not persist master volume per requirements; local store update is okay
    useGameStore.getState().setMasterVolume(clamped);
  }, []);

  const setTapVolumeCallback = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setTypeVolume("tap", clamped);
    useGameStore.getState().setTapVolume(clamped);
  }, []);

  const setWorldVolumeCallback = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setTypeVolume("world", clamped);
    useGameStore.getState().setWorldVolume(clamped);
  }, []);

  // System control functions
  const enableCallback = useCallback(() => {
    gameStore.setSoundEnabled(true);
  }, [gameStore]);

  const disableCallback = useCallback(() => {
    gameStore.setSoundEnabled(false);
  }, [gameStore]);

  // Mute control functions work by changing master volume while leaving the system enabled
  const muteCallback = useCallback(() => {
    const current = useGameStore.getState().soundSystem.masterVolume;
    if (current > 0) {
      lastNonZeroMasterVolumeRef.current = current;
    }
    // Apply immediately to engine and persist
    engineMute();
    useGameStore.getState().setMasterVolume(0);
  }, []);

  const unmuteCallback = useCallback(() => {
    const restore =
      lastNonZeroMasterVolumeRef.current > 0
        ? lastNonZeroMasterVolumeRef.current
        : 1;
    engineUnmute();
    useGameStore.getState().setMasterVolume(restore);
  }, []);

  const toggleMuteCallback = useCallback(() => {
    const current = useGameStore.getState().soundSystem.masterVolume;
    if (current > 0) {
      lastNonZeroMasterVolumeRef.current = current;
      engineMute();
      useGameStore.getState().setMasterVolume(0);
    } else {
      const restore =
        lastNonZeroMasterVolumeRef.current > 0
          ? lastNonZeroMasterVolumeRef.current
          : 1;
      engineUnmute();
      useGameStore.getState().setMasterVolume(restore);
    }
  }, []);

  // Effect to handle menu state changes for world sound attenuation
  useEffect(() => {
    if (lastMenuStateRef.current !== isMenuOpen) {
      updateWorldSoundVolumes(isMenuOpen);
      lastMenuStateRef.current = isMenuOpen;
    }
  }, [isMenuOpen]);

  // Effect to handle game pause state
  useEffect(() => {
    if (gameStore.isPaused) {
      // Optionally stop all sounds when game is paused
      // Uncomment the next line if you want sounds to stop when paused
      // stopAllSounds();
    }
  }, [gameStore.isPaused]);

  const isActive = useMemo(() => {
    return (
      gameStore.soundSystem.enabled && gameStore.soundSystem.masterVolume > 0
    );
  }, [gameStore.soundSystem.enabled, gameStore.soundSystem.masterVolume]);

  return {
    playTapSound: playTapSoundWithGameIntegration,
    playWorldSound: playWorldSoundWithOptions,
    stopAllTapSounds,
    stopAllWorldSounds,
    setMasterVolume: setMasterVolumeCallback,
    setTapVolume: setTapVolumeCallback,
    setWorldVolume: setWorldVolumeCallback,
    isEnabled: gameStore.soundSystem.enabled,
    isMuted: gameStore.soundSystem.masterVolume === 0,
    audioStatus: !gameStore.soundSystem.enabled
      ? "stopped"
      : gameStore.soundSystem.masterVolume === 0
      ? "muted"
      : "playing",
    isActive,
    masterVolume: gameStore.soundSystem.masterVolume,
    tapVolume: gameStore.soundSystem.tapVolume,
    worldVolume: gameStore.soundSystem.worldVolume,
    enable: enableCallback,
    disable: disableCallback,
    start: enableCallback,
    stop: disableCallback,
    mute: muteCallback,
    unmute: unmuteCallback,
    toggleMute: toggleMuteCallback,
    toggle: toggleMuteCallback,
  };
}
