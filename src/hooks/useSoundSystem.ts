import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  playTapSound as playTapSoundUtil,
  playWorldSound as playWorldSoundUtil,
  stopAllTapSounds,
  stopAllWorldSounds,
  isEnabled,
  enable,
  disable,
  setMasterVolume,
  setTypeVolume,
  updateWorldSoundVolumes,
  mute as engineMute,
  unmute as engineUnmute,
  resumeAudioContext,
  unlockAudioContext,
  setTapEnabled as engineSetTapEnabled,
  setWorldEnabled as engineSetWorldEnabled,
  playUISound as enginePlayUISound,
} from "../utils/soundSystem";
import { getWorldSoundById } from "@/utils/sound/configs";
import {
  addSoundConfig as engineAddSoundConfig,
  playWorldSound as enginePlayWorldSound,
  stopSoundsById as engineStopSoundsById,
} from "@/utils/soundSystem";
import { useGameStore } from "../store/gameStore";
import { match } from "ts-pattern";
import { toast } from "sonner";

// global flag to prevent music reinitialization across hook instances
let globalMusicInitialized = false;

// TODO: refactooooor ⚽️
// ** GPT-5 Review **
// Maintainability
// 	•	You’ve mixed static configuration (DEFAULT_SOUND_CONFIGS, WORLD_SOUNDS, TAP_SOUNDS) with your hook logic in the same file. That works now, but makes the hook harder to scan and change without risking unrelated edits.
// 	•	The hook is dense—useEffect for syncing, several useCallbacks for every action, and game state matching all live here. This is cohesive but long, so cognitive load is high for someone new.

// Flexibility
// 	•	Config arrays are easily extendable—WORLD_SOUNDS and TAP_SOUNDS are simple to add to.
// 	•	Hardcoding type: "ui" as any and type: "text" as any suggests your type system isn’t fully reflecting the supported sound types. This is friction for extension; you’ll keep sprinkling as any unless you expand your SoundConfig type.
// 	•	TAP_EFFECT_TO_DEFAULT_TAP_SOUND is a static mapping—if you add effects often, consider making it data-driven from the configs themselves.

// Extensibility
// 	•	The sound engine interaction is all funneled through imported engine functions—good separation. If you swap out the sound engine later, you only rewrite soundSystem utils.
// 	•	However, resumeSelectedWorldLayers knows exactly how to add configs and play sounds—this is internal engine knowledge leaking into the hook. That will require refactoring if the engine changes.
// 	•	Volume control is already abstracted well; adding another sound type would require adding only one more set<SoundType>Volume function.

// Complexity
// 	•	You’re guarding against multiple states (isPaused, isEnabled, masterVolume, etc.) in many callbacks. This is correct, but the duplication is high—there’s no single canPlay(type) check to centralize this.
// 	•	lastNonZeroMasterVolumeRef and lastMasterVolumeRef logic is good for mute/unmute, but it’s scattered. If you ever add a “solo” or “ducking” feature, this pattern will multiply and get hairy.
// 	•	Some engine calls are wrapped in try { } catch {} with empty catches. That hides actual errors if the sound system misbehaves—debugging will be painful.

export interface SoundSystemHook {
  // Core sound functions
  playTapSound: (soundId?: string) => void;
  playWorldSound: (soundId: string, options?: any) => void;
  playUISound: (soundId?: string) => void;
  stopAllTapSounds: () => void;
  stopAllWorldSounds: () => void;

  // Volume control
  setMasterVolume: (volume: number) => void;
  setTapVolume: (volume: number) => void;
  setWorldVolume: (volume: number) => void;
  setUIVolume: (volume: number) => void;
  setTextVolume?: (volume: number) => void;

  // State
  isEnabled: boolean;
  isMuted: boolean;
  audioStatus: "playing" | "muted" | "stopped";
  isActive: boolean;
  masterVolume: number;
  tapVolume: number;
  worldVolume: number;
  uiVolume: number;
  textVolume?: number;

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
  const soundSystem = useGameStore((state) => state.soundSystem);
  const routes = useGameStore((state) => state.routes);
  const audioSelections = useGameStore((state) => state.audioSelections);
  const lastMenuStateRef = useRef<boolean>(false);
  const lastNonZeroMasterVolumeRef = useRef<number>(
    soundSystem.masterVolume > 0 ? soundSystem.masterVolume : 1
  );
  const lastMasterVolumeRef = useRef<number>(soundSystem.masterVolume);

  // Sound system is initialized in SceneWithLoader before scene loads

  // Get current menu state from game store
  const isMenuOpen = routes.some(
    (route) =>
      route.id === "settings" ||
      route.id === "upgrades" ||
      route.id === "themes"
  );

  // Sync sound system with game store
  useEffect(() => {
    setMasterVolume(soundSystem.masterVolume);
    setTypeVolume("tap", soundSystem.tapVolume);
    setTypeVolume("world", soundSystem.worldVolume);
    setTypeVolume("ui", soundSystem.uiVolume);
    setTypeVolume("text", soundSystem.textVolume);

    // Call engine enable/disable directly, not the hook callbacks
    if (soundSystem.enabled) {
      enable(); // engine enable, not hook enableCallback
    } else {
      disable(); // engine disable, not hook disableCallback
    }

    // Keep engine per-type enable flags in sync
    try {
      engineSetTapEnabled(!!soundSystem.tapEnabled);
      engineSetWorldEnabled(!!soundSystem.worldEnabled);
    } catch {}
  }, [soundSystem]);

  // Resume world layers on initial mount if conditions are met
  useEffect(() => {
    // Only run once on mount, not on every gameStore change
    if (
      !globalMusicInitialized &&
      soundSystem.enabled &&
      soundSystem.masterVolume > 0 &&
      soundSystem.worldEnabled !== false &&
      audioSelections.worldSoundIds &&
      audioSelections.worldSoundIds.length > 0
    ) {
      // small delay to ensure audio context is ready
      setTimeout(() => {
        resumeSelectedWorldLayers();
        globalMusicInitialized = true;
      }, 500);
    }
  }, []); // empty dependency array means this runs only once on mount

  // Helper: resume all selected world layers based on current store
  const resumeSelectedWorldLayers = useCallback(() => {
    const s = useGameStore.getState();
    if (!s.soundSystem.enabled) return;
    if (s.soundSystem.masterVolume <= 0) return;
    if (s.soundSystem.worldEnabled === false) return;
    const ids = s.audioSelections.worldSoundIds || [];
    if (!ids.length) return;

    // force stop all existing world sounds first to prevent doubling
    try {
      stopAllWorldSounds();
    } catch {}

    // small delay to ensure cleanup is complete
    setTimeout(() => {
      ids.forEach((id) => {
        try {
          const track = getWorldSoundById(id);
          if (!track) return;
          engineAddSoundConfig({
            id: track.id,
            filePath: track.filePath,
            type: "world",
            volume: 0.1, // match shop volume to prevent volume conflicts
            loop: true,
            stopPrevious: true, // ensure no duplicates
            distanceAttenuation: false,
            detune: { enabled: false, minSemitones: 0, maxSemitones: 0 },
          } as any);
          // ensure no stale instance, then play the layer
          try {
            engineStopSoundsById(track.id);
          } catch {}
          enginePlayWorldSound(track.id, { loop: true, stopPrevious: true });
        } catch {}
      });
    }, 100);
  }, []);

  // Enhanced tap sound function that integrates with game state
  const playTapSoundWithGameIntegration = useCallback((soundId?: string) => {
    const gameState = useGameStore.getState();
    // Only play tap sounds when game is not paused
    if (gameState.isPaused) return;

    // Use pattern matching to determine if we should play the sound
    const shouldPlaySound = match({
      isPaused: gameState.isPaused,
      soundEnabled: isEnabled(),
    })
      .with({ isPaused: false, soundEnabled: true }, () => true)
      .otherwise(() => false);

    if (!shouldPlaySound) return;
    if (typeof soundId === "string") {
      playTapSoundUtil(soundId);
    } else {
      // Let engine use its currentTapSoundId selection
      (playTapSoundUtil as any)();
    }
  }, []);

  // Enhanced world sound function
  const playWorldSoundWithOptions = useCallback(
    (soundId: string, options?: any) => {
      const gameState = useGameStore.getState();
      if (!isEnabled() || gameState.isPaused) return;

      playWorldSoundUtil(soundId, options);
    },
    []
  );

  // Volume control functions
  const setMasterVolumeCallback = useCallback(
    (volume: number) => {
      // Attempt to resume on any user-driven volume change
      try {
        // best effort; engine handles missing listener
        (window as any).requestIdleCallback?.(() => {});
      } catch {}
      const clamped = Math.max(0, Math.min(1, volume));
      setMasterVolume(clamped);
      // Do not persist master volume per requirements; local store update is okay
      useGameStore.getState().setMasterVolume(clamped);
      // If this is a 0 -> >0 transition, resume selected world layers
      const prev = lastMasterVolumeRef.current;
      lastMasterVolumeRef.current = clamped;
      if (prev === 0 && clamped > 0 && !globalMusicInitialized) {
        resumeSelectedWorldLayers();
        globalMusicInitialized = true;
      }
    },
    [resumeSelectedWorldLayers]
  );

  const setTapVolumeCallback = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setTypeVolume("tap", clamped);
    useGameStore.getState().setTapVolume(clamped);
  }, []);

  const setWorldVolumeCallback = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setTypeVolume("world", clamped);
    useGameStore.getState().setWorldVolume(clamped);
    // Ensure engine reapplies gain to active world instances immediately
    try {
      updateWorldSoundVolumes(false);
    } catch {}
  }, []);

  const setUIVolumeCallback = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setTypeVolume("ui" as any, clamped);
    useGameStore.getState().setUIVolume(clamped);
  }, []);

  const setTextVolumeCallback = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setTypeVolume("text" as any, clamped);
    useGameStore.getState().setTextVolume(clamped);
  }, []);

  // System control functions
  const enableCallback = useCallback(() => {
    useGameStore.getState().setSoundEnabled(true);
    // Only resume layers on explicit user enable action if music hasn't been initialized yet
    const s = useGameStore.getState();
    if (
      !globalMusicInitialized &&
      s.soundSystem.masterVolume > 0 &&
      s.soundSystem.worldEnabled !== false &&
      s.audioSelections.worldSoundIds &&
      s.audioSelections.worldSoundIds.length > 0
    ) {
      resumeSelectedWorldLayers();
      globalMusicInitialized = true;
    }
  }, [resumeSelectedWorldLayers]);

  const disableCallback = useCallback(() => {
    useGameStore.getState().setSoundEnabled(false);
  }, []);

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

  const unmuteCallback = useCallback(async () => {
    const restore =
      lastNonZeroMasterVolumeRef.current > 0
        ? lastNonZeroMasterVolumeRef.current
        : 1;
    // Always resume audio context after unmute (fixes iOS policies)
    try {
      await resumeAudioContext();
      await unlockAudioContext();
    } catch {}
    engineUnmute();
    useGameStore.getState().setMasterVolume(restore);
    // Resume selected layers on unmute
    lastMasterVolumeRef.current = restore;
    resumeSelectedWorldLayers();
    globalMusicInitialized = true;
  }, [resumeSelectedWorldLayers]);

  const toggleMuteCallback = useCallback(async () => {
    const gamestore = useGameStore.getState();
    const currentMasterVolume = gamestore.soundSystem.masterVolume;

    if (currentMasterVolume > 0) {
      lastNonZeroMasterVolumeRef.current = currentMasterVolume;
      engineMute();

      gamestore.setMasterVolume(0);
      gamestore.setSoundEnabled(false);
    } else {
      const restore =
        lastNonZeroMasterVolumeRef.current > 0
          ? lastNonZeroMasterVolumeRef.current
          : 1;
      gamestore.setSoundEnabled(true);

      // Always resume audio context after unmute (fixes iOS policies)
      try {
        await resumeAudioContext();
        await unlockAudioContext();
      } catch (error) {
        console.error("Error unlocking audio context:", error);
      }
      engineUnmute();
      gamestore.setMasterVolume(restore);
      // Ensure previously selected world layers resume on unmute
      resumeSelectedWorldLayers();
      globalMusicInitialized = true;
    }
  }, [resumeSelectedWorldLayers]);

  // Effect to handle menu state changes for world sound attenuation
  useEffect(() => {
    if (lastMenuStateRef.current !== isMenuOpen) {
      updateWorldSoundVolumes(isMenuOpen);
      lastMenuStateRef.current = isMenuOpen;
    }
  }, [isMenuOpen]);

  // Effect to handle game pause state
  const isPaused = useGameStore((state) => state.isPaused);
  useEffect(() => {
    if (isPaused) {
      // Optionally stop all sounds when game is paused
      // Uncomment the next line if you want sounds to stop when paused
      // stopAllSounds();
    }
  }, [isPaused]);

  const isActive = useMemo(() => {
    return soundSystem.enabled && soundSystem.masterVolume > 0;
  }, [soundSystem.enabled, soundSystem.masterVolume]);

  return {
    playTapSound: playTapSoundWithGameIntegration,
    playWorldSound: playWorldSoundWithOptions,
    playUISound: (soundId?: string) => {
      if (soundId) {
        enginePlayUISound(soundId);
      } else {
        enginePlayUISound();
      }
    },
    stopAllTapSounds,
    stopAllWorldSounds,
    setMasterVolume: setMasterVolumeCallback,
    setTapVolume: setTapVolumeCallback,
    setWorldVolume: setWorldVolumeCallback,
    setUIVolume: setUIVolumeCallback,
    setTextVolume: setTextVolumeCallback,
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
