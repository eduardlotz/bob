import { Html } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { a, useSpring } from "@react-spring/three";
import { motion, AnimatePresence } from "motion/react";
import type { Variants } from "motion/react";
import { useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";
import { textSynth } from "@/utils/sound/textSynth";
import { resumeAudioContext, unlockAudioContext } from "@/utils/soundSystem";
import { MotionVariants, Transitions } from "@/styles/motion";

// Enhanced timing constants
const CHAR_REVEAL_INTERVAL = 50; // Slightly faster for better flow
const CHAR_ANIMATION_DELAY = 12; // Reduced for smoother sequences
const AUDIO_LEAD_TIME = 8;
const LINE_PAUSE_MS = 800; // Pause between lines in same message
const MESSAGE_TRANSITION_MS = 300; // Time between different messages

export interface MessageBubbleProps {
  anchor?: [number, number, number];
}

interface LineState {
  readonly id: string;
  readonly messageId: string;
  readonly lineIndex: number;
  readonly text: string;
  readonly timestamp: Date;
  status: "queued" | "typing" | "complete" | "removing";
  revealedChars: number;
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

  const { soundSystem } = useGameStore();

  // Enhanced state management
  const [lines, setLines] = useState<LineState[]>([]);
  const [currentSession, setCurrentSession] = useState<MessageSession | null>(
    null
  );
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Refs for cleanup and control
  const timersRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const audioScheduleRef = useRef<Map<string, Set<number>>>(new Map());
  const isUnmountingRef = useRef(false);

  // Entry/Exit animations
  const [spring, api] = useSpring(() => ({
    scale: 0,
    opacity: 0,
    config: { tension: 300, friction: 18 },
  }));

  // Cleanup helper
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
      audioScheduleRef.current.clear();
    };
  }, [clearTimer]);

  // Parse message text into lines
  const parseMessageLines = useCallback(
    (message: typeof activeMessage): string[] => {
      if (!message) return [];
      const text = message.config.text;
      if (Array.isArray(text)) return text;
      if (typeof text === "string") return [text];
      return [];
    },
    []
  );

  // Calculate reading time for auto-advance
  const calculateReadingTime = useCallback(
    (text: string, options: any): number => {
      const baseDismiss = options?.baseDismissMs ?? 1400;
      const lengthFactor = options?.contentLengthFactorMs ?? 44;
      const optionBasedMs = baseDismiss + text.length * lengthFactor;

      // Reading speed calculation (220 WPM)
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const readingMs = Math.max(1000, Math.round(words * 273 + 500));

      return Math.max(optionBasedMs, readingMs);
    },
    []
  );

  // Handle new message activation
  useEffect(() => {
    if (!activeMessage) {
      // Clear everything when no active message
      api.start({ scale: 0, opacity: 0 });
      addTimer(() => {
        setLines([]);
        setCurrentSession(null);
        setIsProcessingQueue(false);
      }, 200);
      return;
    }

    const messageLines = parseMessageLines(activeMessage);
    if (messageLines.length === 0) return;

    // Show bubble
    api.start({ scale: 1, opacity: 1 });

    // Create new session
    const session: MessageSession = {
      messageId: activeMessage.config.id,
      totalLines: messageLines.length,
      currentLineIndex: 0,
      startedAt: Date.now(),
    };

    setCurrentSession(session);
    setIsProcessingQueue(true);

    // Initialize lines for this message
    const initialLines: LineState[] = messageLines.map((text, index) => ({
      id: `${activeMessage.config.id}-${index}-${Date.now()}`,
      messageId: activeMessage.config.id,
      lineIndex: index,
      text,
      timestamp: new Date(),
      status: index === 0 ? "queued" : "queued",
      revealedChars: 0,
    }));

    setLines(initialLines);

    // Start first line immediately
    addTimer(() => {
      startTypingLine(initialLines[0]);
    }, 100);
  }, [activeMessage?.config.id, parseMessageLines, api, addTimer]);

  // Audio system initialization
  useEffect(() => {
    if (soundSystem.enabled && soundSystem.masterVolume > 0) {
      try {
        textSynth.resume();
      } catch (error) {
        console.warn("Failed to resume text synth:", error);
      }
    }
  }, [soundSystem.enabled, soundSystem.masterVolume]);

  // Start typing animation for a line
  const startTypingLine = useCallback(
    (lineState: LineState) => {
      if (isUnmountingRef.current) return;

      setLines((prev) =>
        prev.map((line) =>
          line.id === lineState.id
            ? { ...line, status: "typing", revealedChars: 0 }
            : line
        )
      );

      const text = lineState.text;
      const audioScheduled = new Set<number>();
      audioScheduleRef.current.set(lineState.id, audioScheduled);

      let startTime: number | null = null;
      let lastRevealedCount = 0;

      const typeLoop = (currentTime: number) => {
        if (isUnmountingRef.current) return;

        if (!startTime) startTime = currentTime;

        const elapsed = currentTime - startTime;
        const shouldBeRevealed = Math.min(
          text.length,
          Math.floor(elapsed / CHAR_REVEAL_INTERVAL)
        );

        // Update revealed characters
        if (shouldBeRevealed > lastRevealedCount) {
          setLines((prev) =>
            prev.map((line) =>
              line.id === lineState.id
                ? { ...line, revealedChars: shouldBeRevealed }
                : line
            )
          );

          // Schedule audio for new characters
          if (soundSystem.enabled && soundSystem.masterVolume > 0) {
            for (let i = lastRevealedCount; i < shouldBeRevealed; i++) {
              if (!audioScheduled.has(i)) {
                audioScheduled.add(i);

                const audioDelay = Math.max(
                  0,
                  i * CHAR_ANIMATION_DELAY - AUDIO_LEAD_TIME
                );
                addTimer(() => {
                  try {
                    textSynth.resume();
                    const duration = Math.min(180, CHAR_REVEAL_INTERVAL * 0.8);
                    const volume = Math.max(
                      0.1,
                      Math.min(
                        0.6,
                        (soundSystem.masterVolume || 0) *
                          ((soundSystem as any).textVolume ?? 0.8)
                      )
                    );
                    textSynth.playCharBlip(duration, volume);
                  } catch (error) {
                    console.warn("Audio playback failed:", error);
                  }
                }, audioDelay);
              }
            }
          }

          lastRevealedCount = shouldBeRevealed;
        }

        // Continue typing or finish
        if (shouldBeRevealed < text.length) {
          rafRef.current = requestAnimationFrame(typeLoop);
        } else {
          // Line completed
          completeTypingLine(lineState);
        }
      };

      rafRef.current = requestAnimationFrame(typeLoop);
    },
    [soundSystem, addTimer]
  );

  // Complete typing for a line and handle next actions
  const completeTypingLine = useCallback(
    (lineState: LineState) => {
      if (isUnmountingRef.current) return;

      // Mark line as complete
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineState.id
            ? { ...line, status: "complete", revealedChars: line.text.length }
            : line
        )
      );

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
          const readingTime = calculateReadingTime(
            lineState.text,
            message.options
          );
          const dismissDelay = message.config.nextDelayMs ?? readingTime;

          addTimer(() => {
            handleMessageDismissal();
          }, Math.max(2000, dismissDelay));
        }
      } else {
        // Schedule next line
        addTimer(() => {
          const nextLineIndex = lineState.lineIndex + 1;
          setCurrentSession((prev) =>
            prev ? { ...prev, currentLineIndex: nextLineIndex } : null
          );

          const nextLine = lines.find(
            (l) =>
              l.messageId === lineState.messageId &&
              l.lineIndex === nextLineIndex
          );

          if (nextLine) {
            startTypingLine(nextLine);
          }
        }, LINE_PAUSE_MS);
      }
    },
    [
      currentSession,
      activeMessage,
      lines,
      markFullyRevealed,
      calculateReadingTime,
      addTimer,
    ]
  );

  // Handle message dismissal with queue processing
  const handleMessageDismissal = useCallback(async () => {
    if (isUnmountingRef.current) return;

    // Check if message can be dismissed according to store rules
    const state = useMessageStore.getState();
    const current = state.activeMessage;

    if (!current) return;

    const now = Date.now();
    const canDismissNow =
      now >= current.minimumDisplayUntil &&
      current.hasBeenFullyRevealed &&
      (current.userHasInteracted || now >= current.minimumDisplayUntil + 1000);

    if (!canDismissNow) {
      // Retry dismissal later
      addTimer(() => handleMessageDismissal(), 500);
      return;
    }

    // Start exit animation
    api.start({ scale: 0.95, opacity: 0 });

    addTimer(async () => {
      // Clear current message state
      setLines([]);
      setCurrentSession(null);

      // Dismiss from store (this will activate next message if queued)
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
  const handleUserInteraction = useCallback(() => {
    try {
      // Resume audio context on interaction
      textSynth.resume();
      resumeAudioContext();
      unlockAudioContext();
      markUserInteraction();
    } catch (error) {
      console.warn("Failed to handle user interaction:", error);
    }
  }, [markUserInteraction]);

  // Handle click to advance
  const handleClick = useCallback(() => {
    if (!currentSession || !activeMessage) return;

    handleUserInteraction();

    const currentLine = lines.find(
      (l) =>
        l.messageId === currentSession.messageId &&
        l.lineIndex === currentSession.currentLineIndex
    );

    if (!currentLine) return;

    // Only allow advancing if current line is complete
    if (currentLine.status === "complete") {
      const isLastLine = currentLine.lineIndex >= currentSession.totalLines - 1;

      if (!isLastLine) {
        // Advance to next line immediately
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
        // Last line - try to dismiss immediately
        handleMessageDismissal();
      }
    }
  }, [
    currentSession,
    activeMessage,
    lines,
    handleUserInteraction,
    startTypingLine,
    handleMessageDismissal,
  ]);

  // Render individual character with animation
  const renderCharacter = useCallback(
    (char: string, index: number, lineId: string, revealedCount: number) => {
      const isRevealed = index < revealedCount;

      return (
        <Char
          key={`${lineId}-char-${index}`}
          initial="hidden"
          animate={isRevealed ? "visible" : "hidden"}
          variants={improvedCharVariants}
          custom={index}
        >
          {char === " " ? "\u00A0" : char}
        </Char>
      );
    },
    []
  );

  // Render line content with character animations
  const renderLineContent = useCallback(
    (line: LineState) => {
      if (line.status === "complete") {
        return <span>{line.text}</span>;
      }

      const chars = Array.from(line.text);
      return (
        <span>
          {chars.map((char, index) =>
            renderCharacter(char, index, line.id, line.revealedChars)
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

  const visibleLines = lines.filter(
    (line) => line.status === "typing" || line.status === "complete"
  );

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
        <Container
          style={{ opacity: spring.opacity as any }}
          onClick={handleClick}
          onPointerDown={handleUserInteraction}
        >
          {cfg.label && <Label>{cfg.label}</Label>}

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

          {/* Queue indicator */}
          {isProcessingQueue && getQueueLength() > 0 && (
            <QueueIndicator
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              +{getQueueLength()} queued
            </QueueIndicator>
          )}
        </Container>
      </Html>
    </a.group>
  );
});

// Styled components
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

const Label = styled.div`
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

const QueueIndicator = styled(motion.div)`
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 12px;
  margin-top: 4px;
`;

// Enhanced animation variants
const improvedCharVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
    y: 6,
    rotate: -20,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      delay: i * (CHAR_ANIMATION_DELAY / 1000),
      type: "spring" as const,
      stiffness: 450 + (Math.random() - 0.5) * 100,
      damping: 22,
      mass: 0.25,
    },
  }),
};

const improvedBubbleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(4px)",
    y: 2,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 25,
      mass: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(4px)",
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};
