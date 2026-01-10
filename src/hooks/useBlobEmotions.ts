import { useState, useEffect, useRef, useCallback } from "react";

import { useAppStore } from "@/store";

export type EmotionState =
  | "normal"
  | "happy"
  | "dizzy"
  | "mad"
  | "thinking"
  | "suspicious"
  | "sad";

export interface BlobEmotionData {
  currentEmotion: EmotionState;
  lastEmotionTime: number;
}

const EMOTION_DURATIONS: Record<EmotionState, number> = {
  normal: 0,
  happy: 2000,
  dizzy: 4000,
  mad: 5000,
  thinking: 2500, // TODO
  suspicious: 1800, // TODO
  sad: 4000, // TODO
};

const COOLDOWN_DURATION = 1000; // Cooldown between emotional state changes
const TAP_WINDOW = 5000; // 5s
const TAP_THRESHOLD = 30; // taps within window to trigger dizzy
// trigger dizzy/mad when hitting 6 taps/second (on average over 5s)

export function useBlobEmotions() {
  const [emotionState, setEmotionState] = useState<EmotionState>("normal");
  const tapTimesRef = useRef<number[]>([]); // recent tap timestamps
  const { currentRoute } = useAppStore();

  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<number>(0);
  const lastEmotionTimeRef = useRef<number>(0);

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

    // add current tap and remove old taps outside the time window
    tapTimesRef.current.push(now);
    tapTimesRef.current = tapTimesRef.current.filter(
      (t) => now - t <= TAP_WINDOW
    );

    // check if threshold reached
    if (tapTimesRef.current.length >= TAP_THRESHOLD) {
      tapTimesRef.current = []; // reset
      // trigger dizzy -> mad sequence
      setEmotionWithTimeout("dizzy", EMOTION_DURATIONS.dizzy);
      setTimeout(() => {
        setEmotionWithTimeout("mad", EMOTION_DURATIONS.mad);
      }, EMOTION_DURATIONS.dizzy);

      cooldownRef.current =
        now + EMOTION_DURATIONS.dizzy + EMOTION_DURATIONS.mad;

      return; // exit early
    }

    // if normal, show short happiness animation
    if (emotionState === "normal") {
      setEmotionWithTimeout("happy", EMOTION_DURATIONS.happy);
    }
  }, [emotionState, setEmotionWithTimeout, currentRoute]);

  const triggerEmotion = useCallback(
    (emotion: EmotionState, durationMs?: number) => {
      const duration = durationMs
        ? Math.max(3000, durationMs)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEmotionTimeout();
    };
  }, [clearEmotionTimeout]);

  return {
    emotionState,
    handleTap,
    getEmotionIcon,
    triggerEmotion,
    isInCooldown: Date.now() - cooldownRef.current < COOLDOWN_DURATION,
  };
}
