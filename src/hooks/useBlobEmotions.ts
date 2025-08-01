import { useState, useEffect, useRef, useCallback } from "react";

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
const CLICK_WINDOW = 800; // Time window for rapid clicks
const CLICKS_FOR_DIZZY = 5; // Number of clicks to trigger dizzy

export function useBlobEmotions() {
  const [emotionState, setEmotionState] = useState<EmotionState>("normal");
  const [tapCount, setTapCount] = useState(0);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<number>(0);
  const lastEmotionTimeRef = useRef<number>(0);

  // Load tap count from localStorage on mount
  useEffect(() => {
    const savedTapCount = localStorage.getItem("bobTapCount");
    console.log("Loading tap count from localStorage:", savedTapCount);
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

  // Debug: Log emotion state changes
  useEffect(() => {
    console.log(`🎭 Emotion state changed to: ${emotionState}`);
  }, [emotionState]);

  const clearEmotionTimeout = useCallback(() => {
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current);
      emotionTimeoutRef.current = null;
    }
  }, []);

  const setEmotionWithTimeout = useCallback(
    (emotion: EmotionState, duration: number) => {
      console.log(`🎭 Setting emotion to: ${emotion} for ${duration}ms`);
      clearEmotionTimeout();
      setEmotionState(emotion);
      lastEmotionTimeRef.current = Date.now();

      emotionTimeoutRef.current = setTimeout(() => {
        console.log(
          `🎭 Emotion timeout reached, reverting to normal from: ${emotion}`
        );
        setEmotionState("normal");
        emotionTimeoutRef.current = null;
      }, duration);
    },
    [clearEmotionTimeout]
  );

  const handleTap = useCallback(() => {
    const now = Date.now();

    // Always increment tap count, regardless of emotion state or cooldown
    setTapCount((prev) => prev + 1);
    console.log(
      "🔥 Tap registered, incrementing counter. Current emotion:",
      emotionState
    );

    // Update click timestamps for rapid click detection FIRST (before cooldown check)
    // This ensures rapid clicks can still accumulate for dizzy trigger even during cooldown
    let shouldTriggerDizzy = false;
    setClickTimestamps((prev) => {
      const recentClicks = prev.filter(
        (timestamp) => now - timestamp < CLICK_WINDOW
      );
      const updatedClicks = [...recentClicks, now];

      console.log(
        `⏱️ Recent clicks in ${CLICK_WINDOW}ms window:`,
        updatedClicks.length,
        "/",
        CLICKS_FOR_DIZZY
      );
      console.log(
        "Click timestamps:",
        updatedClicks.map((t) => t - now)
      );

      // Check if we hit the dizzy threshold
      if (updatedClicks.length >= CLICKS_FOR_DIZZY) {
        shouldTriggerDizzy = true;
        console.log("🎯 DIZZY THRESHOLD HIT! Triggering dizzy sequence");
        return []; // Reset clicks after triggering dizzy
      }

      return updatedClicks;
    });

    // Handle dizzy trigger (this overrides cooldown for dizzy state)
    if (shouldTriggerDizzy) {
      console.log("😵 TRIGGERING DIZZY SEQUENCE from rapid clicks");
      // Trigger dizzy -> mad sequence
      setEmotionWithTimeout("dizzy", EMOTION_DURATIONS.dizzy);

      // After dizzy, go to mad
      setTimeout(() => {
        console.log("😠 TRIGGERING MAD SEQUENCE after dizzy");
        setEmotionWithTimeout("mad", EMOTION_DURATIONS.mad);
      }, EMOTION_DURATIONS.dizzy);

      // Set cooldown after the entire sequence
      cooldownRef.current =
        now + EMOTION_DURATIONS.dizzy + EMOTION_DURATIONS.mad;

      console.log("⏰ Set cooldown until:", new Date(cooldownRef.current));

      return; // Exit early, don't process normal emotion changes
    }

    // Check if we're in cooldown for normal emotion changes (after dizzy check)
    if (now - cooldownRef.current < COOLDOWN_DURATION) {
      console.log("❄️ In cooldown, skipping normal emotion changes");
      return;
    }

    // If not triggering dizzy, just show brief happiness (only if currently normal)
    if (emotionState === "normal") {
      console.log("😊 Triggering happy emotion");
      setEmotionWithTimeout("happy", EMOTION_DURATIONS.happy);
    } else {
      console.log(
        `🚫 Not triggering happy - current emotion is: ${emotionState}`
      );
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

  const resetTapCount = useCallback(() => {
    setTapCount(0);
    localStorage.removeItem("bobTapCount");
  }, []);

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
    resetTapCount,
    isInCooldown: Date.now() - cooldownRef.current < COOLDOWN_DURATION,
  };
}
