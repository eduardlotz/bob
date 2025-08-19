import { Html } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { a, useSpring } from "@react-spring/three";
import { motion, AnimatePresence } from "motion/react";
import type { Variants } from "motion/react";
import { useMessageStore } from "@/store/messageStore";
import { useAppStore } from "@/store";
import { useGameStore } from "@/store/gameStore";
import { textSynth } from "@/utils/sound/textSynth";
import { resumeAudioContext, unlockAudioContext } from "@/utils/soundSystem";
import { Transitions } from "@/styles/motion";
import { MOTION_VARIANTS } from "./HeadNavigation";

// Precise timing constants - all values carefully calculated for sync
const DEFAULT_CHAR_REVEAL_MS = 28; // Slightly slower for better audio sync
const AUDIO_CHAR_DURATION_MS = 85; // How long each character sound plays
const AUDIO_LEAD_TIME_MS = 5; // Start audio slightly before visual reveal
const LINE_PAUSE_MS = 650;
const MESSAGE_TRANSITION_MS = 220;

export interface MessageBubbleProps {
  anchor?: [number, number, number];
}

interface CharacterState {
  char: string;
  index: number;
  isRevealed: boolean;
  revealTime?: number;
  audioScheduled: boolean;
  audioPlayed: boolean;
}

interface LineState {
  readonly id: string;
  readonly messageId: string;
  readonly lineIndex: number;
  readonly text: string;
  readonly timestamp: Date;
  status: "queued" | "typing" | "complete" | "removing";
  characters: CharacterState[];
  revealedChars: number;
  startTime?: number;
}

interface MessageSession {
  readonly messageId: string;
  readonly totalLines: number;
  currentLineIndex: number;
  readonly startedAt: number;
}

export const MessageBubble = memo(function MessageBubble({
  anchor = [0, 1.5, 0],
}: MessageBubbleProps) {
  const {
    activeMessage,
    dismissMessage,
    markFullyRevealed,
    markUserInteraction,
    getQueueLength,
  } = useMessageStore();
  const { requestEmotion } = useAppStore();
  const { soundSystem } = useGameStore();

  // Enhanced state management
  const [lines, setLines] = useState<LineState[]>([]);
  const [currentSession, setCurrentSession] = useState<MessageSession | null>(
    null
  );
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Refs for cleanup and precise timing control
  const timersRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const isUnmountingRef = useRef(false);
  const hardDismissTimerRef = useRef<number | null>(null);
  const linesRef = useRef<LineState[]>([]);
  const completeTypingLineRef = useRef<(line: LineState) => void>(() => {});
  const audioContextReadyRef = useRef<boolean>(false);

  // Keep refs in sync
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  // Entry/Exit animations
  const [spring, api] = useSpring(() => ({
    scale: 0,
    opacity: 0,
    config: { tension: 300, friction: 18 },
  }));

  // Enhanced cleanup helper
  const clearTimer = useCallback((timerId: number) => {
    clearTimeout(timerId);
    timersRef.current.delete(timerId);
  }, []);

  const addTimer = useCallback(
    (callback: () => void, delay: number): number => {
      const timerId = window.setTimeout(() => {
        timersRef.current.delete(timerId);
        if (!isUnmountingRef.current) {
          callback();
        }
      }, delay);
      timersRef.current.add(timerId);
      return timerId;
    },
    []
  );

  // Initialize audio context properly
  const initializeAudioContext = useCallback(async () => {
    if (audioContextReadyRef.current) return true;

    try {
      await resumeAudioContext();
      await unlockAudioContext();
      await textSynth.resume();
      audioContextReadyRef.current = true;
      return true;
    } catch (error) {
      console.warn("Failed to initialize audio context:", error);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      timersRef.current.forEach(clearTimer);
      timersRef.current.clear();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (hardDismissTimerRef.current) {
        clearTimer(hardDismissTimerRef.current);
        hardDismissTimerRef.current = null;
      }
    };
  }, [clearTimer]);

  // Parse message text into lines with character initialization
  const parseMessageLines = useCallback(
    (message: typeof activeMessage): LineState[] => {
      if (!message) return [];
      const text = message.config.text;

      let textLines: string[] = [];
      if (Array.isArray(text)) {
        textLines = text.flatMap((t) => String(t).split(/\r?\n/));
      } else if (typeof text === "string") {
        textLines = text.split(/\r?\n/);
      }

      return textLines.map((lineText, index) => ({
        id: `${message.config.id}-${index}-${Date.now()}`,
        messageId: message.config.id,
        lineIndex: index,
        text: lineText,
        timestamp: new Date(),
        status: "queued" as const,
        revealedChars: 0,
        characters: Array.from(lineText).map((char, charIndex) => ({
          char,
          index: charIndex,
          isRevealed: false,
          audioScheduled: false,
          audioPlayed: false,
        })),
      }));
    },
    []
  );

  // Calculate reading time for auto-advance
  const calculateReadingTime = useCallback(
    (text: string, options: any): number => {
      const baseDismiss = options?.baseDismissMs ?? 1000;
      const lengthFactor = options?.contentLengthFactorMs ?? 1;
      const optionBasedMs = baseDismiss + text.length * lengthFactor;

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const perWordMs = 240;
      const readingMs = Math.max(800, Math.round(words * perWordMs + 250));

      return Math.max(optionBasedMs, readingMs);
    },
    []
  );

  // Enhanced audio playback with better timing
  const playCharacterAudio = useCallback(
    async (char: string, volume: number) => {
      if (!soundSystem.enabled || soundSystem.masterVolume <= 0) return;

      try {
        if (!audioContextReadyRef.current) {
          const ready = await initializeAudioContext();
          if (!ready) return;
        }

        const duration = AUDIO_CHAR_DURATION_MS;
        const adjustedVolume = Math.max(
          0.1,
          Math.min(
            0.6,
            volume *
              (soundSystem.masterVolume || 0) *
              ((soundSystem as any).textVolume ?? 0.8)
          )
        );

        await textSynth.playCharBlip(duration, adjustedVolume);
      } catch (error) {
        console.warn("Audio playback failed:", error);
      }
    },
    [soundSystem, initializeAudioContext]
  );

  // Precise typing animation with synchronized audio and guaranteed animation
  const startTypingLine = useCallback(
    (lineState: LineState) => {
      if (isUnmountingRef.current) return;

      // Mark line as typing and initialize timing
      const startTime = performance.now();
      const typingMsPerChar = Math.max(
        10,
        activeMessage?.options?.typingSpeedMs ?? DEFAULT_CHAR_REVEAL_MS
      );

      setLines((prev) =>
        prev.map((line) =>
          line.id === lineState.id
            ? {
                ...line,
                status: "typing",
                revealedChars: 0,
                startTime,
                characters: line.characters.map((char) => ({
                  ...char,
                  isRevealed: false,
                  audioScheduled: false,
                  audioPlayed: false,
                })),
              }
            : line
        )
      );

      let lastProcessedIndex = -1;
      const characterRevealQueue: Array<{
        index: number;
        scheduleTime: number;
      }> = [];

      const typeLoop = (currentTime: number) => {
        if (isUnmountingRef.current) return;

        const elapsed = currentTime - startTime;
        const shouldBeRevealed = Math.min(
          lineState.characters.length,
          Math.floor(elapsed / typingMsPerChar)
        );

        // Queue up character reveals that need to happen
        for (let i = lastProcessedIndex + 1; i < shouldBeRevealed; i++) {
          const revealTime = startTime + i * typingMsPerChar;
          characterRevealQueue.push({ index: i, scheduleTime: revealTime });
        }
        lastProcessedIndex = Math.max(lastProcessedIndex, shouldBeRevealed - 1);

        // Process character reveals from queue with proper animation timing
        const currentRevealTime = currentTime;
        let hasUpdates = false;

        setLines((prev) =>
          prev.map((line) => {
            if (line.id !== lineState.id) return line;

            const updatedCharacters = line.characters.map((char, index) => {
              // Check if this character should be revealed based on queue
              const queueEntry = characterRevealQueue.find(
                (q) => q.index === index
              );
              const shouldReveal =
                queueEntry && currentRevealTime >= queueEntry.scheduleTime;
              const wasRevealed = char.isRevealed;

              if (shouldReveal && !wasRevealed) {
                hasUpdates = true;

                // Schedule audio immediately when character is revealed
                if (!char.audioScheduled) {
                  // Use immediate audio playback for better sync
                  setTimeout(() => {
                    playCharacterAudio(char.char, 0.8);
                  }, Math.max(0, AUDIO_LEAD_TIME_MS));

                  return {
                    ...char,
                    isRevealed: true,
                    revealTime: currentRevealTime,
                    audioScheduled: true,
                  };
                }
              }

              return char;
            });

            // Remove processed items from queue
            characterRevealQueue.splice(
              0,
              characterRevealQueue.findIndex(
                (q) => currentRevealTime < q.scheduleTime
              )
            );

            return hasUpdates
              ? {
                  ...line,
                  revealedChars: shouldBeRevealed,
                  characters: updatedCharacters,
                }
              : line;
          })
        );

        // Continue typing or complete
        if (shouldBeRevealed < lineState.characters.length) {
          rafRef.current = requestAnimationFrame(typeLoop);
        } else {
          // Ensure all characters are properly revealed with animation states
          setLines((prev) =>
            prev.map((line) =>
              line.id === lineState.id
                ? {
                    ...line,
                    revealedChars: line.characters.length,
                    characters: line.characters.map((char, index) => ({
                      ...char,
                      isRevealed: true,
                      revealTime:
                        char.revealTime || startTime + index * typingMsPerChar,
                    })),
                  }
                : line
            )
          );

          // Line completed - add small delay before marking complete
          addTimer(() => {
            completeTypingLineRef.current(lineState);
          }, 150); // Slightly longer delay to ensure animations finish
        }
      };

      rafRef.current = requestAnimationFrame(typeLoop);
    },
    [activeMessage?.options?.typingSpeedMs, addTimer, playCharacterAudio]
  );

  // Handle new message activation
  useEffect(() => {
    if (!activeMessage) {
      api.start({ scale: 0, opacity: 0 });
      addTimer(() => {
        setCurrentSession(null);
        setIsProcessingQueue(false);
      }, 200);
      return;
    }

    const messageLines = parseMessageLines(activeMessage);
    if (messageLines.length === 0) return;

    // Initialize audio context early
    initializeAudioContext();

    // Trigger emotion cue
    try {
      const cue = activeMessage.options?.emotion as
        | { state: any; durationMs?: number }
        | undefined;
      if (cue?.state) {
        requestEmotion(cue.state, cue.durationMs);
      }
    } catch (error) {
      console.warn(
        "Failed to request emotion:",
        activeMessage,
        activeMessage.options.emotion
      );
    }

    // Show bubble
    api.start({ scale: 1, opacity: 1 });

    // Create session
    const session: MessageSession = {
      messageId: activeMessage.config.id,
      totalLines: messageLines.length,
      currentLineIndex: 0,
      startedAt: Date.now(),
    };

    setCurrentSession(session);
    setIsProcessingQueue(true);

    // Add lines to thread
    setLines((prev) => [...prev, ...messageLines]);

    // Start first line
    addTimer(() => {
      startTypingLine(messageLines[0]);
    }, 1200);

    // Hard fallback dismiss
    const totalReadingMs = messageLines.reduce((sum, line) => {
      return (
        sum +
        calculateReadingTime(line.text, activeMessage.options) +
        LINE_PAUSE_MS
      );
    }, 0);

    if (hardDismissTimerRef.current) {
      clearTimer(hardDismissTimerRef.current);
      hardDismissTimerRef.current = null;
    }

    hardDismissTimerRef.current = addTimer(async () => {
      const current = useMessageStore.getState().activeMessage;
      if (current && current.config.id === activeMessage.config.id) {
        try {
          await dismissMessage(true);
        } catch {}
      }
    }, Math.max(5000, totalReadingMs + 1500));
  }, [
    activeMessage?.config.id,
    parseMessageLines,
    api,
    addTimer,
    initializeAudioContext,
  ]);

  // Complete typing for a line and handle next actions
  const completeTypingLine = useCallback(
    (lineState: LineState) => {
      if (isUnmountingRef.current) return;

      // Mark line as complete
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineState.id
            ? {
                ...line,
                status: "complete",
                revealedChars: line.text.length,
                characters: line.characters.map((char) => ({
                  ...char,
                  isRevealed: true,
                })),
              }
            : line
        )
      );

      // Schedule line removal
      const lineReadingMs = calculateReadingTime(
        lineState.text,
        activeMessage?.options
      );
      addTimer(() => {
        setLines((prev) => prev.filter((l) => l.id !== lineState.id));
      }, Math.max(900, lineReadingMs));

      const session = currentSession;
      if (!session || session.messageId !== lineState.messageId) return;

      const isLastLine = lineState.lineIndex >= session.totalLines - 1;

      if (isLastLine) {
        // Mark message as fully revealed
        try {
          markFullyRevealed();
        } catch (error) {
          console.warn("Failed to mark fully revealed:", error);
        }

        // Schedule message dismissal
        const message = activeMessage;
        if (message) {
          const wholeText = linesRef.current
            .filter((l) => l.messageId === message.config.id)
            .map((l) => l.text)
            .join(" ");
          const readingTimeWhole = calculateReadingTime(
            wholeText,
            message.options
          );
          const readingTimeLast = calculateReadingTime(
            lineState.text,
            message.options
          );
          const fallbackDelay = Math.max(600, readingTimeLast);
          const baseDelay =
            typeof message.config.nextDelayMs === "number"
              ? Math.max(200, message.config.nextDelayMs)
              : fallbackDelay;

          addTimer(() => {
            api.start({ scale: 0.95, opacity: 0 });
            addTimer(() => handleMessageDismissal(), 200);
          }, baseDelay);
        }
      } else {
        // Schedule next line
        addTimer(() => {
          const nextLineIndex = lineState.lineIndex + 1;
          setCurrentSession((prev) =>
            prev ? { ...prev, currentLineIndex: nextLineIndex } : null
          );

          const nextLine = linesRef.current.find(
            (l) =>
              l.messageId === lineState.messageId &&
              l.lineIndex === nextLineIndex
          );

          if (nextLine) {
            const currentVisible = linesRef.current.filter(
              (l) => l.status === "typing" || l.status === "complete"
            );

            if (currentVisible.length >= 4) {
              const oldest = currentVisible[0];
              setLines((prev) =>
                prev.map((l) =>
                  l.id === oldest.id ? { ...l, status: "removing" } : l
                )
              );
              api.start({ scale: 0.98, opacity: 0 });
              addTimer(() => {
                setLines((prev) => prev.filter((l) => l.id !== oldest.id));
                api.start({ scale: 1, opacity: 1 });
                startTypingLine(nextLine);
              }, 160);
            } else {
              startTypingLine(nextLine);
            }
          }
        }, LINE_PAUSE_MS);
      }
    },
    [
      currentSession,
      activeMessage,
      markFullyRevealed,
      calculateReadingTime,
      addTimer,
      api,
    ]
  );

  // Sync completion handler
  useEffect(() => {
    completeTypingLineRef.current = completeTypingLine;
  }, [completeTypingLine]);

  // Handle message dismissal
  const handleMessageDismissal = useCallback(async () => {
    if (isUnmountingRef.current) return;

    const state = useMessageStore.getState();
    const current = state.activeMessage;
    if (!current) return;

    const now = Date.now();
    const canDismissNow =
      now >= current.minimumDisplayUntil &&
      current.hasBeenFullyRevealed &&
      (current.userHasInteracted || now >= current.minimumDisplayUntil + 1000);

    if (!canDismissNow) {
      addTimer(() => handleMessageDismissal(), 1000);
      return;
    }

    api.start({ scale: 0.95, opacity: 0 });
    addTimer(async () => {
      setLines([]);
      setCurrentSession(null);
      try {
        const success = await dismissMessage();
        if (!success) {
          console.warn("Message dismissal was blocked by store");
        }
      } catch (error) {
        console.error("Failed to dismiss message:", error);
      }
      setIsProcessingQueue(false);
    }, MESSAGE_TRANSITION_MS);
  }, [api, dismissMessage, addTimer]);

  // Handle user interaction
  const handleUserInteraction = useCallback(async () => {
    try {
      await initializeAudioContext();
      markUserInteraction();
    } catch (error) {
      console.warn("Failed to handle user interaction:", error);
    }
  }, [markUserInteraction, initializeAudioContext]);

  // Handle click to advance
  const handleClick = useCallback(() => {
    if (!currentSession || !activeMessage) return;

    handleUserInteraction();

    const currentLine = lines.find(
      (l) =>
        l.messageId === currentSession.messageId &&
        l.lineIndex === currentSession.currentLineIndex
    );

    if (!currentLine || currentLine.status !== "complete") return;

    const isLastLine = currentLine.lineIndex >= currentSession.totalLines - 1;

    if (!isLastLine) {
      const nextLineIndex = currentLine.lineIndex + 1;
      const nextLine = lines.find(
        (l) =>
          l.messageId === currentSession.messageId &&
          l.lineIndex === nextLineIndex
      );

      if (nextLine && nextLine.status === "queued") {
        setCurrentSession((prev) =>
          prev ? { ...prev, currentLineIndex: nextLineIndex } : null
        );
        startTypingLine(nextLine);
      }
    } else {
      handleMessageDismissal();
    }
  }, [
    currentSession,
    activeMessage,
    lines,
    handleUserInteraction,
    startTypingLine,
    handleMessageDismissal,
  ]);

  // Enhanced character rendering with animation guarantees
  const renderCharacter = useCallback(
    (char: CharacterState, lineId: string, lineStartTime?: number) => {
      // Calculate staggered delay based on character index and line start time
      const baseDelay = char.index * (12 / 1000); // 12ms stagger between characters

      // If we have a reveal time, use it to calculate precise animation delay
      const animationDelay =
        char.revealTime && lineStartTime
          ? Math.max(0, (char.revealTime - lineStartTime) / 1000) // Convert to seconds
          : baseDelay;

      // Force animation state based on reveal status
      const animationState = char.isRevealed ? "visible" : "hidden";

      return (
        <Char
          key={`${lineId}-char-${char.index}`}
          initial="hidden"
          animate={animationState}
          variants={guaranteedCharVariants}
          custom={animationDelay}
          // Force re-animation when reveal state changes
          transition={{
            delay: animationDelay,
            type: "spring",
            stiffness: 450,
            damping: 25,
            mass: 0.2,
          }}
        >
          {char.char === " " ? "\u00A0" : char.char}
        </Char>
      );
    },
    []
  );

  // Render line content with guaranteed character animations
  const renderLineContent = useCallback(
    (line: LineState) => {
      // For completed lines, still render with character components to maintain consistency
      // but skip animation delays
      if (line.status === "complete") {
        return (
          <span>
            {line.characters.map((char) => (
              <Char
                key={`${line.id}-char-${char.index}-complete`}
                initial="visible"
                animate="visible"
                variants={guaranteedCharVariants}
              >
                {char.char === " " ? "\u00A0" : char.char}
              </Char>
            ))}
          </span>
        );
      }

      return (
        <span>
          {line.characters.map((char) =>
            renderCharacter(char, line.id, line.startTime)
          )}
        </span>
      );
    },
    [renderCharacter]
  );

  if (!activeMessage) return null;

  const cfg = activeMessage.config;
  const offset = cfg.positionOffset ?? [0, 0, 0];
  const position: [number, number, number] = [
    anchor[0] + offset[0],
    anchor[1] + offset[1],
    anchor[2] + offset[2],
  ];

  const visibleLines = lines
    .filter((line) => line.status === "typing" || line.status === "complete")
    .slice(-4);

  return (
    <a.group scale={spring.scale as any} position={position}>
      <Html
        style={{
          maxWidth: "min(92vw, 420px)",
          width: "fit-content",
          pointerEvents: "auto",
          transform: "translateX(-50%)",
        }}
      >
        <Container style={{ opacity: spring.opacity as any }}>
          {cfg.label && (
            <Label
              variants={MOTION_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {cfg.label}
            </Label>
          )}

          <ThreadContainer as={motion.div} layoutRoot layout>
            <AnimatePresence mode="popLayout">
              {visibleLines.map((line) => (
                <ThreadBubble
                  key={line.id}
                  layout="position"
                  variants={improvedBubbleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={Transitions.quick.layout as any}
                  onClick={handleClick}
                >
                  <ThreadText>{renderLineContent(line)}</ThreadText>
                  <TimeTag>
                    {line.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TimeTag>
                </ThreadBubble>
              ))}
            </AnimatePresence>
          </ThreadContainer>
        </Container>
      </Html>
    </a.group>
  );
});

// Styled components (same as before)
const Container = styled.div`
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  user-select: none;
`;

const ThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-bottom: 8px;
`;

const Label = styled(motion.div)`
  font-size: 16px;
  color: var(--text-color);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50px;
  backdrop-filter: blur(8px);
  margin-bottom: 2px;
`;

const ThreadBubble = styled(motion.div)`
  position: relative;
  background: var(--primary-color);
  color: var(--text-color);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
  padding: 12px 16px 24px 16px;
  width: auto;
  max-width: calc(100vw - 32px);
  min-width: min(92vw, 400px);
  display: inline-flex;
  align-self: center;
  cursor: pointer;
`;

const ThreadText = styled.div`
  font-size: 15px;
  line-height: 1.4;
  display: inline;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Char = styled(motion.span)`
  display: inline-block;
  will-change: transform, opacity;
  transform-origin: center bottom;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const TimeTag = styled.div`
  position: absolute;
  right: 12px;
  bottom: 6px;
  font-size: 11px;
  opacity: 0.7;
  color: var(--text-secondary);
`;

// Enhanced animation variants with guaranteed animation completion
const guaranteedCharVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
    rotateX: -20,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 420,
      damping: 28,
      mass: 0.25,
      // Ensure animation always completes
      duration: undefined, // Let spring physics determine duration
    },
  },
};

const improvedBubbleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      mass: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -4,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};
