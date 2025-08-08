import { useCallback, useEffect, useRef } from "react";
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
} from "../utils/soundSystem";
import { useGameStore } from "../store/gameStore";
import { match } from "ts-pattern";

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
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;

  // System control
  enable: () => void;
  disable: () => void;
}

export function useSoundSystem(): SoundSystemHook {
  const gameStore = useGameStore();
  const lastMenuStateRef = useRef<boolean>(false);

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
  const setMasterVolumeCallback = useCallback(
    (volume: number) => {
      gameStore.setMasterVolume(volume);
    },
    [gameStore]
  );

  const setTapVolumeCallback = useCallback(
    (volume: number) => {
      gameStore.setTapVolume(volume);
    },
    [gameStore]
  );

  const setWorldVolumeCallback = useCallback(
    (volume: number) => {
      gameStore.setWorldVolume(volume);
    },
    [gameStore]
  );

  // System control functions
  const enableCallback = useCallback(() => {
    gameStore.setSoundEnabled(true);
  }, [gameStore]);

  const disableCallback = useCallback(() => {
    gameStore.setSoundEnabled(false);
  }, [gameStore]);

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

  return {
    playTapSound: playTapSoundWithGameIntegration,
    playWorldSound: playWorldSoundWithOptions,
    stopAllTapSounds,
    stopAllWorldSounds,
    setMasterVolume: setMasterVolumeCallback,
    setTapVolume: setTapVolumeCallback,
    setWorldVolume: setWorldVolumeCallback,
    isEnabled: gameStore.soundSystem.enabled,
    masterVolume: gameStore.soundSystem.masterVolume,
    tapVolume: gameStore.soundSystem.tapVolume,
    worldVolume: gameStore.soundSystem.worldVolume,
    enable: enableCallback,
    disable: disableCallback,
  };
}
