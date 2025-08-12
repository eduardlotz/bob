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
const CHAR_REVEAL_INTERVAL = 24; // default ms/char fallback (fast)
const CHAR_ANIMATION_DELAY = 10; // per-char stagger
const AUDIO_LEAD_TIME = 8;
const LINE_PAUSE_MS = 600; // shorter pause between lines
const MESSAGE_TRANSITION_MS = 220; // faster message transition

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
  const hardDismissTimerRef = useRef<number | null>(null);
  // keep latest lines and completion handler in refs to avoid stale closures in timers/RAF
  const linesRef = useRef<LineState[]>([]);
  const completeTypingLineRef = useRef<(line: LineState) => void>(() => {});
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

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
      if (hardDismissTimerRef.current) {
        clearTimer(hardDismissTimerRef.current);
        hardDismissTimerRef.current = null;
      }
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
      const baseDismiss = options?.baseDismissMs ?? 1000;
      const lengthFactor = options?.contentLengthFactorMs ?? 35;
      const optionBasedMs = baseDismiss + text.length * lengthFactor;

      // reading speed calculation (~240 WPM)
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const perWordMs = 250; // ~240wpm
      const readingMs = Math.max(800, Math.round(words * perWordMs + 250));

      // choose the larger to be safe but both are tuned faster than before
      return Math.max(optionBasedMs, readingMs);
    },
    []
  );

  // Handle new message activation
  useEffect(() => {
    if (!activeMessage) {
      // no active message; hide bubble but keep thread state until all items auto-remove
      api.start({ scale: 0, opacity: 0 });
      addTimer(() => {
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

    // append new message lines to the thread instead of resetting
    setLines((prev) => [...prev, ...initialLines]);

    // Start first line immediately
    addTimer(() => {
      startTypingLine(initialLines[0]);
    }, 60);

    // schedule a hard fallback auto-dismiss based on total reading time
    const totalReadingMs = messageLines.reduce((sum, text) => {
      return (
        sum + calculateReadingTime(text, activeMessage.options) + LINE_PAUSE_MS
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
      // derive per-message typing cadence from config with sensible defaults
      const typingMsPerChar = Math.max(
        10,
        activeMessage?.options?.typingSpeedMs ?? CHAR_REVEAL_INTERVAL
      );
      const revealIntervalMs = typingMsPerChar; // ms per character
      const charAnimDelayMs = Math.max(8, Math.round(revealIntervalMs * 0.25));
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
          Math.floor(elapsed / revealIntervalMs)
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
                  i * charAnimDelayMs - AUDIO_LEAD_TIME
                );
                addTimer(() => {
                  try {
                    textSynth.resume();
                    const duration = Math.min(
                      180,
                      Math.round(revealIntervalMs * 0.8)
                    );
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
          completeTypingLineRef.current(lineState);
        }
      };

      rafRef.current = requestAnimationFrame(typeLoop);
    },
    [soundSystem, addTimer, activeMessage?.options?.typingSpeedMs]
  );

  // Complete typing for a line and handle next actions
  const completeTypingLine = useCallback(
    (lineState: LineState) => {
      if (isUnmountingRef.current) return;

      // Mark line as complete and schedule its removal after reading time
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineState.id
            ? { ...line, status: "complete", revealedChars: line.text.length }
            : line
        )
      );
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
          // prefer explicit delay if present, otherwise use reading time of whole message as faster default
          const wholeText = parseMessageLines(message).join(" ");
          const readingTimeWhole = calculateReadingTime(
            wholeText,
            message.options
          );
          const readingTimeLast = calculateReadingTime(
            lineState.text,
            message.options
          );
          const fallbackDelay = Math.max(
            300,
            Math.min(
              1500,
              Math.max(
                Math.floor(readingTimeWhole * 0.5),
                Math.floor(readingTimeLast * 0.5)
              )
            )
          );
          const baseDelay =
            typeof message.config.nextDelayMs === "number"
              ? Math.max(200, message.config.nextDelayMs)
              : fallbackDelay;

          addTimer(() => {
            // quick motion exit, then dismiss
            api.start({ scale: 0.95, opacity: 0 });
            addTimer(() => handleMessageDismissal(), 160);
          }, baseDelay);
        }
      } else {
        // Schedule next line. If 4 visible lines are already used, remove the oldest with exit then add next.
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
              // animate-out oldest visible line before starting next
              const oldest = currentVisible[0];
              setLines((prev) =>
                prev.map((l) =>
                  l.id === oldest.id ? { ...l, status: "removing" } : l
                )
              );
              api.start({ scale: 0.98 });
              addTimer(() => {
                setLines((prev) => prev.filter((l) => l.id !== oldest.id));
                api.start({ scale: 1 });
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
      lines,
      markFullyRevealed,
      calculateReadingTime,
      addTimer,
    ]
  );

  // sync latest completion handler to ref
  useEffect(() => {
    completeTypingLineRef.current = completeTypingLine;
  }, [completeTypingLine]);

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
          {isProcessingQueue &&
            visibleLines.length >= 4 &&
            getQueueLength() > 0 && (
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

// enhanced animation variants
const improvedCharVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
    rotate: -12,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * (CHAR_ANIMATION_DELAY / 1000),
      type: "spring" as const,
      stiffness: 460,
      damping: 20,
      mass: 0.22,
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
