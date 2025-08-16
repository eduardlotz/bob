import { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { useAppStore, ROUTE_PATHS } from "@/store";
import { useSoundSystem } from "./useSoundSystem";
import { isEnabled, resumeAudioContext } from "@/utils/soundSystem";
import { resolveTapSoundForEffect } from "@/utils/sound/configs";

export type EmotionState =
  | "normal"
  | "happy"
  | "dizzy"
  | "mad"
  | "thinking"
  | "suspicious";

export interface BlobEmotionData {
  currentEmotion: EmotionState;
  tapCount: number;
  lastEmotionTime: number;
}

const EMOTION_DURATIONS: Record<EmotionState, number> = {
  normal: 0,
  happy: 1000,
  dizzy: 4000,
  mad: 5000,
  thinking: 2500,
  suspicious: 1800,
};

const COOLDOWN_DURATION = 1000; // Cooldown between emotional state changes

export function useBlobEmotions() {
  const [emotionState, setEmotionState] = useState<EmotionState>("normal");
  const [tapCount, setTapCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dizzyCounter, setDizzyCounter] = useState(0); // Separate counter for dizzy detection
  const { currentRoute } = useAppStore();
  const { playTapSound } = useSoundSystem();

  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<number>(0);
  const lastEmotionTimeRef = useRef<number>(0);

  // Load tap count from localStorage on mount
  useEffect(() => {
    const savedTapCount = localStorage.getItem("bobTapCount");
    if (savedTapCount) {
      const count = parseInt(savedTapCount, 10);
      setTapCount(count);
    }
    setIsInitialized(true);
  }, []);

  // Save tap count to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("bobTapCount", tapCount.toString());
    }
  }, [tapCount, isInitialized]);

  const clearEmotionTimeout = useCallback(() => {
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current);
      emotionTimeoutRef.current = null;
    }
  }, []);

  const setEmotionWithTimeout = useCallback(
    (emotion: EmotionState, duration: number) => {
      clearEmotionTimeout();
      setEmotionState(emotion);
      lastEmotionTimeRef.current = Date.now();

      emotionTimeoutRef.current = setTimeout(() => {
        setEmotionState("normal");
        emotionTimeoutRef.current = null;
      }, duration);
    },
    [clearEmotionTimeout]
  );

  const handleTap = useCallback(() => {
    const now = Date.now();

    // ensure audio context is resumed on first interaction
    // resumeAudioContext().catch(() => {});

    // get the correct tap sound ID from game store
    const gameStore = useGameStore.getState();
    const selectedTapEffect = gameStore.upgrades.find(
      (u) => u.category === "tapEffects" && u.selected
    );
    const tapEffectId = selectedTapEffect?.id || "tap_effect_default";

    // resolve the actual sound ID using the resolver
    const soundConfig = resolveTapSoundForEffect(
      tapEffectId,
      gameStore.audioSelections.tapEffectAudioId
    );

    if (soundConfig?.id) {
      playTapSound(soundConfig.id);
    } else {
      playTapSound(); // fallback to default
    }

    // only increment tap count on home route
    if (currentRoute === ROUTE_PATHS.HOME) {
      setTapCount((prev) => prev + 1);
      const gameStore = useGameStore.getState();
      gameStore.addManualTap();
    }

    // Increment dizzy counter (separate from persistent tap count)
    setDizzyCounter((prev) => prev + 1);

    // check dizzy threshold every 10 taps
    const shouldTriggerDizzy = dizzyCounter + 1 >= 10;

    // handle dizzy trigger
    if (shouldTriggerDizzy) {
      setDizzyCounter(0);

      // trigger dizzy -> mad sequence
      setEmotionWithTimeout("dizzy", EMOTION_DURATIONS.dizzy);
      setTimeout(() => {
        setEmotionWithTimeout("mad", EMOTION_DURATIONS.mad);
      }, EMOTION_DURATIONS.dizzy);

      // set cooldown after sequence
      cooldownRef.current =
        now + EMOTION_DURATIONS.dizzy + EMOTION_DURATIONS.mad;

      return; // exit early, don't process normal emotion changes
    }

    // if normal, show short happiness animation
    if (emotionState === "normal") {
      setEmotionWithTimeout("happy", EMOTION_DURATIONS.happy);
    }
  }, [emotionState, setEmotionWithTimeout, currentRoute]);

  const triggerEmotion = useCallback(
    (emotion: EmotionState, durationMs?: number) => {
      const duration =
        typeof durationMs === "number"
          ? Math.max(200, durationMs)
          : EMOTION_DURATIONS[emotion] || 1200;
      setEmotionWithTimeout(emotion, duration);
    },
    [setEmotionWithTimeout]
  );

  const getEmotionIcon = useCallback((emotion: EmotionState): string => {
    switch (emotion) {
      case "happy":
        return "😊";
      case "mad":
        return "😠";
      case "dizzy":
        return "😵";
      case "thinking":
        return "🤔";
      case "suspicious":
        return "🧐";
      case "normal":
      default:
        return "🙂";
    }
  }, []);

  // const resetTapCount = useCallback(() => {
  //   setTapCount(0);
  //   localStorage.removeItem("bobTapCount");
  // }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEmotionTimeout();
    };
  }, [clearEmotionTimeout]);

  return {
    emotionState,
    tapCount,
    handleTap,
    getEmotionIcon,
    triggerEmotion,
    // resetTapCount,
    isInCooldown: Date.now() - cooldownRef.current < COOLDOWN_DURATION,
  };
}
