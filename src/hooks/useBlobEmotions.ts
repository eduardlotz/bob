import { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { useAppStore, ROUTE_PATHS } from "@/store";
import { useSoundSystem } from "./useSoundSystem";
import { isEnabled, resumeAudioContext } from "@/utils/soundSystem";

export type EmotionState = "normal" | "happy" | "dizzy" | "mad";

export interface BlobEmotionData {
  currentEmotion: EmotionState;
  tapCount: number;
  lastEmotionTime: number;
}

const EMOTION_DURATIONS = {
  happy: 800, // Brief happiness after each tap
  dizzy: 4000, // Dizzy animation duration
  mad: 5000, // Mad state after dizzy
};

const COOLDOWN_DURATION = 1000; // Cooldown between emotional state changes

export function useBlobEmotions() {
  const [emotionState, setEmotionState] = useState<EmotionState>("normal");
  const [tapCount, setTapCount] = useState(0);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
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
    console.log("handleTap: Function called");
    const now = Date.now();

    // Ensure audio context is resumed on first interaction
    resumeAudioContext().catch(() => {});

    // Only increment tap count on home route
    if (currentRoute === ROUTE_PATHS.HOME) {
      console.log("handleTap: On home route, processing tap");
      setTapCount((prev) => prev + 1);

      // Add tap to game store
      const gameStore = useGameStore.getState();
      gameStore.addManualTap();

      // Play tap sound
      console.log("handleTap: Playing tap sound...");
      console.log("handleTap: Sound system enabled:", isEnabled());
      playTapSound();
      console.log("handleTap: Tap sound called");
    }

    // Increment dizzy counter (separate from persistent tap count)
    setDizzyCounter((prev) => prev + 1);

    // Check if we hit the dizzy threshold (every 10 taps)
    const shouldTriggerDizzy = dizzyCounter + 1 >= 10;

    // Handle dizzy trigger (this overrides cooldown for dizzy state)
    if (shouldTriggerDizzy) {
      // Reset dizzy counter after triggering
      setDizzyCounter(0);

      // Trigger dizzy -> mad sequence
      setEmotionWithTimeout("dizzy", EMOTION_DURATIONS.dizzy);

      // After dizzy, go to mad
      setTimeout(() => {
        setEmotionWithTimeout("mad", EMOTION_DURATIONS.mad);
      }, EMOTION_DURATIONS.dizzy);

      // Set cooldown after the entire sequence
      cooldownRef.current =
        now + EMOTION_DURATIONS.dizzy + EMOTION_DURATIONS.mad;

      return; // Exit early, don't process normal emotion changes
    }

    // If not triggering dizzy, just show brief happiness (only if currently normal)
    if (emotionState === "normal") {
      setEmotionWithTimeout("happy", EMOTION_DURATIONS.happy);
    }
  }, [emotionState, setEmotionWithTimeout]);

  const getEmotionIcon = useCallback((emotion: EmotionState): string => {
    switch (emotion) {
      case "happy":
        return "😊";
      case "mad":
        return "😠";
      case "dizzy":
        return "😵";
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
    // resetTapCount,
    isInCooldown: Date.now() - cooldownRef.current < COOLDOWN_DURATION,
  };
}
