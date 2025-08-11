import { Html } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { a, useSpring } from "@react-spring/three";
import { motion, AnimatePresence } from "motion/react";
import { useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";
import { textSynth } from "@/utils/sound/textSynth";
import { resumeAudioContext, unlockAudioContext } from "@/utils/soundSystem";
import { MotionVariants, Transitions } from "@/styles/motion";

// Typing animation constants
const DEFAULT_MS_PER_CHAR = 50;

export interface MessageBubbleProps {
  // Anchor relative to avatar head; we assume head at [0,2,0] in this scene
  anchor?: [number, number, number];
}

export const MessageBubble = memo(function MessageBubble({
  anchor = [0, 1.5, 0],
}: MessageBubbleProps) {
  const { activeMessage, dismissMessage } = useMessageStore();
  const { soundSystem } = useGameStore();

  const [isFullyTyped, setIsFullyTyped] = useState(false);
  const [displayText, setDisplayText] = useState<string>("");
  const [revealed, setRevealed] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const revealedRef = useRef<number>(0);
  const skipRef = useRef<boolean>(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const removalTimersRef = useRef<Record<string, number>>({});
  const finishTimerRef = useRef<number | null>(null);
  const blipTimeoutsRef = useRef<number[]>([]);

  type ThreadItem = {
    key: string;
    id: string; // message id
    lineIndex: number; // index within the message's text array
    text: string;
    time: Date;
    status: "typing" | "done";
  };

  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [typingKey, setTypingKey] = useState<string | null>(null);
  const [skipRequested, setSkipRequested] = useState(false);
  const [uiScale, setUiScale] = useState(1);

  const cfg = activeMessage?.config;
  const options = activeMessage?.options;

  // Entry/Exit scale + opacity
  // const [spring, api] = useSpring(() => ({
  //   scale: 0,
  //   opacity: 0,
  //   config: { tension: 300, friction: 18 },
  // }));

  // useEffect(() => {
  //   if (activeMessage) {
  //     api.start({ scale: 1, opacity: 1 });
  //   } else {
  //     api.start({ scale: 0, opacity: 0 });
  //   }
  // }, [!!activeMessage]);

  // Ensure synth is resumed when audio becomes active
  useEffect(() => {
    if (soundSystem.enabled && soundSystem.masterVolume > 0) {
      try {
        textSynth.resume();
      } catch {}
    }
  }, [soundSystem.enabled, soundSystem.masterVolume]);

  useEffect(() => {
    if (activeMessage && soundSystem.enabled && soundSystem.masterVolume > 0) {
      try {
        textSynth.resume();
      } catch {}
    }
  }, [activeMessage]);

  // Keep refs in sync for RAF loop safety
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);
  useEffect(() => {
    skipRef.current = skipRequested;
  }, [skipRequested]);

  // Prepare text sequence
  const lines: string[] = useMemo(() => {
    const base = cfg?.text;
    if (Array.isArray(base)) return base;
    if (typeof base === "string") return [base];
    return [];
  }, [cfg]);

  // Helper to add a new typing thread bubble for the current line
  const addTypingBubble = (msgId: string, idx: number, text: string) => {
    const key = `${msgId}-${idx}-${Date.now()}`;
    setThread((prev): ThreadItem[] => {
      // Mark any existing typing as done before adding a new typing bubble
      const updated: ThreadItem[] = prev.map(
        (it): ThreadItem =>
          it.status === "typing" ? { ...it, status: "done" as const } : it
      );
      return [
        ...updated,
        {
          key,
          id: msgId,
          lineIndex: idx,
          text,
          time: new Date(),
          status: "typing" as const,
        },
      ];
    });
    setTypingKey(key);
    setDisplayText(text);
    setRevealed(0);
    revealedRef.current = 0;
    setIsFullyTyped(false);
    setSkipRequested(false);
  };

  // Estimate reading time for a bubble's text
  const estimateReadingMs = (text: string): number => {
    const baseDismiss = options?.baseDismissMs ?? 1200;
    const lengthFactor = options?.contentLengthFactorMs ?? 40;
    const optionBasedMs = baseDismiss + text.length * lengthFactor;
    // Reading speed fallback: ~220 WPM with a small buffer
    const words =
      text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const wpm = 220; // average reading speed
    const msPerWord = 60000 / wpm; // ~273ms/word
    const readingMs = Math.max(1000, Math.round(words * msPerWord + 400));
    // Use the more generous of both estimates, add slight padding
    return Math.round(Math.max(optionBasedMs, readingMs) * 1.15);
  };

  // Allow per-character animation to visually settle before swapping to static text
  const calcSettleDelayMs = (text: string): number => {
    // Char variants delay: i * 0.02s => ~20ms/char; add generous spring settle buffer
    const lastCharExtra = Math.max(0, (text.length - 1) * 20); // ms
    return Math.min(1800, Math.max(420, lastCharExtra + 420));
  };

  const clearRemovalTimer = (key: string) => {
    const timerId = removalTimersRef.current[key];
    if (timerId) {
      clearTimeout(timerId);
      delete removalTimersRef.current[key];
    }
  };

  // Cleanup any outstanding timers on unmount
  useEffect(() => {
    return () => {
      Object.values(removalTimersRef.current).forEach((id) => clearTimeout(id));
      removalTimersRef.current = {};
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (autoAdvanceTimerRef.current)
        clearTimeout(autoAdvanceTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  // Start first line when a message becomes active
  useEffect(() => {
    // clear any timers from previous message to avoid cross-talk
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    blipTimeoutsRef.current.forEach((id) => clearTimeout(id));
    blipTimeoutsRef.current = [];
    Object.values(removalTimersRef.current).forEach((id) => clearTimeout(id));
    removalTimersRef.current = {};

    if (!activeMessage || lines.length === 0) return;
    // Reset line index for each new message
    setLineIndex(0);
    // clear previous message thread to avoid old bubbles lingering
    setThread([]);
    addTypingBubble(activeMessage.config.id, 0, lines[0] ?? "");
  }, [activeMessage, lines.length]);

  // RAF-driven per-character reveal for the current typing bubble
  useEffect(() => {
    if (!activeMessage) return;
    const line = lines[lineIndex] ?? "";
    if (!typingKey) return;
    // Clear any running RAF
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Clear any pending blip timeouts
    blipTimeoutsRef.current.forEach((id) => clearTimeout(id));
    blipTimeoutsRef.current = [];
    setIsFullyTyped(false);
    setDisplayText(line);
    setRevealed(0);
    revealedRef.current = 0;
    skipRef.current = false;
    let last = 0;
    let acc = 0;
    const per = options?.typingSpeedMs ?? DEFAULT_MS_PER_CHAR;

    const loop = (t: number) => {
      if (skipRef.current) {
        setRevealed(line.length);
        revealedRef.current = line.length;
        setIsFullyTyped(true);
        return;
      }
      const dt = last ? t - last : 0;
      last = t;
      acc += dt;
      const toReveal = Math.min(line.length, Math.floor(acc / per));
      if (toReveal > revealedRef.current) {
        const delta = toReveal - revealedRef.current;
        setRevealed(toReveal);
        revealedRef.current = toReveal;
        if (
          cfg?.audioEnabled &&
          soundSystem.enabled &&
          soundSystem.masterVolume > 0
        ) {
          // Stagger blips when multiple chars revealed in the same frame
          const baseDelay = Math.max(16, Math.min(80, per * 0.5));
          for (let i = 0; i < delta; i++) {
            const timeoutId = window.setTimeout(() => {
              try {
                textSynth.resume();
                // Ensure per-char sound length is slightly shorter than reveal period
                const charDurMs = Math.max(100, Math.min(220, per * 0.9));
                // Scale gain by master * text volume (fallback to 0.8)
                const textVolume = (soundSystem as any).textVolume ?? 0.8;
                const gainScale = Math.max(
                  1.5,
                  Math.min(
                    1.2,
                    (soundSystem.masterVolume || 0) * textVolume || 0
                  )
                );
                textSynth.playCharBlip(charDurMs, gainScale || 0.2);
              } catch {}
            }, i * baseDelay) as unknown as number;
            blipTimeoutsRef.current.push(timeoutId);
          }
        }
        if (toReveal === line.length) setIsFullyTyped(true);
      }
      if (revealedRef.current < line.length)
        rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      // Clear blip timeouts on effect cleanup
      blipTimeoutsRef.current.forEach((id) => clearTimeout(id));
      blipTimeoutsRef.current = [];
    };
  }, [activeMessage, lineIndex, skipRequested, typingKey]);

  // When a line finishes, wait a short settle delay, then mark done and schedule next actions
  useEffect(() => {
    if (!activeMessage) return;
    if (!isFullyTyped) return;
    const currentTypingKey = typingKey;
    const currentLineText = lines[lineIndex] ?? "";
    const isLastLine = lineIndex >= lines.length - 1;

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    const settleMs = calcSettleDelayMs(currentLineText);
    finishTimerRef.current = window.setTimeout(() => {
      // Mark current typing bubble as done after settle so animation completes
      if (currentTypingKey) {
        setThread((prev) =>
          prev.map((it) =>
            it.key === currentTypingKey ? { ...it, status: "done" } : it
          )
        );
      }

      // Schedule auto-removal based on reading time for this line
      if (currentTypingKey) {
        const ms = Math.max(2400, estimateReadingMs(currentLineText));
        clearRemovalTimer(currentTypingKey);
        const timeoutId = window.setTimeout(() => {
          setThread((prev) => prev.filter((x) => x.key !== currentTypingKey));
          clearRemovalTimer(currentTypingKey);
        }, ms) as unknown as number;
        removalTimersRef.current[currentTypingKey] = timeoutId;
      }

      // Schedule next line or next message
      if (!isLastLine) {
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        autoAdvanceTimerRef.current = window.setTimeout(() => {
          const nextIdx = Math.min(lines.length - 1, lineIndex + 1);
          setLineIndex(nextIdx);
          addTypingBubble(
            activeMessage.config.id,
            nextIdx,
            lines[nextIdx] ?? ""
          );
        }, 600) as unknown as number;
      } else {
        // Use nextDelayMs (per-config) if provided; otherwise reading time of the whole message
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = null;
        }
        const cfgDelay = activeMessage.config.nextDelayMs;
        const wholeMessageText = Array.isArray(activeMessage.config.text)
          ? activeMessage.config.text.join(" ")
          : String(activeMessage.config.text ?? "");
        const nextMsBase =
          typeof cfgDelay === "number" && cfgDelay >= 0
            ? cfgDelay
            : estimateReadingMs(wholeMessageText);
        // add guard so we never dismiss while any typed thread bubble still exists
        const nextMs = Math.max(3200, nextMsBase);
        dismissTimerRef.current = window.setTimeout(() => {
          // if any thread item still exists, wait a bit more to avoid cutting off
          if (thread.length > 0) {
            dismissTimerRef.current = window.setTimeout(
              () => handleDismiss(),
              600
            ) as unknown as number;
          } else {
            handleDismiss();
          }
        }, nextMs) as unknown as number;
      }
    }, settleMs) as unknown as number;
  }, [isFullyTyped, activeMessage, lineIndex, lines, typingKey]);

  if (!activeMessage || !cfg) return null;

  const onClickBubble = () => {
    // on click: only advance to next line if fully typed; do not skip animation
    if (!isFullyTyped) return;
    const nextIdx = lineIndex + 1;
    if (nextIdx < lines.length) {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      setLineIndex(nextIdx);
      addTypingBubble(activeMessage!.config.id, nextIdx, lines[nextIdx] ?? "");
    }
    // Do not allow manual dismiss; auto-cleanup handles removal
  };

  const handleDismiss = () => {
    // api.start({ scale: 0, opacity: 0 });
    // Allow exit spring to play briefly before swapping messages
    setTimeout(() => {
      // cleanup timers to avoid leaking into the next message
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      blipTimeoutsRef.current.forEach((id) => clearTimeout(id));
      blipTimeoutsRef.current = [];
      Object.values(removalTimersRef.current).forEach((id) => clearTimeout(id));
      removalTimersRef.current = {};

      dismissMessage();
      setLineIndex(0);
      setSkipRequested(false);
      setDisplayText("");
      setIsFullyTyped(false);
      setUiScale(1);
      setTypingKey(null);
      setThread([]);
    }, 180);
  };

  const offset = cfg.positionOffset ?? [0, 0, 0];
  const position: [number, number, number] = [
    anchor[0] + offset[0],
    anchor[1] + offset[1],
    anchor[2] + offset[2],
  ];

  return (
    <a.group
      // scale={spring.scale as any}
      position={position}
    >
      <Html
        style={{
          maxWidth: "min(92vw, 420px)",
          width: "fit-content",
          pointerEvents: "auto",
          transform: "translateX(-50%)",
        }}
      >
        <Container
        // style={{ opacity: spring.opacity as any }}
        // onClick={onClickBubble}
        // onPointerDown={() => {
        //   try {
        //     textSynth.resume();
        //     // Help Safari/iOS policies by resuming/unlocking the primary context too
        //     resumeAudioContext();
        //     unlockAudioContext();
        //   } catch {}
        // }}
        >
          {cfg.label && <Label>{cfg.label}</Label>}
          <ThreadContainer as={motion.div} layoutRoot layout>
            <AnimatePresence mode="popLayout">
              {thread.map((it) => (
                <ThreadBubble
                  key={it.key}
                  layout="position"
                  variants={MotionVariants.SlideUp}
                  initial={"initial"}
                  animate={"animate"}
                  exit={"exit"}
                  transition={Transitions.quick.layout as any}
                >
                  <ThreadText>
                    {it.status === "typing" && typingKey === it.key
                      ? (() => {
                          const content = displayText ?? "";
                          const tokens = content.split(/(\s+)/);
                          let idx = 0;
                          const out: any[] = [];
                          tokens.forEach((tok, t) => {
                            if (!tok) return;
                            if (/^\s+$/.test(tok)) {
                              for (let j = 0; j < tok.length; j++) {
                                const ch = tok[j];
                                if (ch === "\n") {
                                  out.push(
                                    <br key={`br-${lineIndex}-${idx}`} />
                                  );
                                } else if (ch === " ") {
                                  out.push(
                                    <Space key={`sp-${lineIndex}-${idx}`}>
                                      {" "}
                                    </Space>
                                  );
                                } else {
                                  out.push(
                                    <Space key={`spx-${lineIndex}-${idx}`}>
                                      {ch}
                                    </Space>
                                  );
                                }
                                idx += 1;
                              }
                            } else {
                              const chars = Array.from(tok);
                              out.push(
                                <Word key={`w-${lineIndex}-${t}`}>
                                  {chars.map((ch, k) => {
                                    const thisIndex = idx + k;
                                    return (
                                      <Char
                                        key={`c-${lineIndex}-${thisIndex}`}
                                        initial="hidden"
                                        animate={
                                          thisIndex < revealed
                                            ? "visible"
                                            : "hidden"
                                        }
                                        variants={charVariants}
                                        custom={thisIndex}
                                      >
                                        {ch}
                                      </Char>
                                    );
                                  })}
                                </Word>
                              );
                              idx += chars.length;
                            }
                          });
                          return out;
                        })()
                      : it.text}
                  </ThreadText>
                  <TimeTag>
                    {it.time.toLocaleTimeString([], {
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

const Container = styled.div`
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 6px;
  user-select: none;
`;

const ThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  margin-bottom: 2px;
`;

const Bubble = styled.div`
  position: relative;
  background: var(--primary-color);
  color: var(--text-color);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  padding: 12px 16px;
  min-width: 200px;
  max-width: 360px;
  overflow-wrap: normal;
  word-break: keep-all;
  white-space: normal;
  @media (max-width: 480px) {
    max-width: 86vw;
  }
`;

const ThreadBubble = styled(motion.div)`
  position: relative;
  background: var(--primary-color);
  color: var(--text-color);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
  padding: 10px 14px 22px 14px;
  width: auto;

  max-width: calc(100vw - 32px);
  min-width: min(92vw, 400px);

  display: inline-flex;
  align-self: center;
  /* max-width: 560px;
  width: 100%;*/
  /* min-width: 48px; */
` as any;

const ThreadText = styled.div`
  font-size: 15px;
  line-height: 1.35;
  display: inline;
  white-space: pre-wrap;
  /* white-space: nowrap; */
`;

const Text = styled.div`
  font-size: 16px;
  line-height: 1.4;
  color: var(--text-color);
`;

const Space = styled.span`
  display: inline;
`;

const Word = styled.span`
  display: inline;
  white-space: nowrap;
`;

const Char = styled(motion.span)`
  display: inline-block;
  will-change: transform, opacity;
` as any;

const charVariants = {
  hidden: {
    opacity: 0,
    scale: 0.6,
    rotateX: -90,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: [1.1, 1],
    rotateX: [10, 0],
    transition: {
      delay: i * 0.02,
      type: "spring",
      stiffness: 500,
      damping: 24,
      mass: 0.4,
    },
  }),
};

const TimeTag = styled.div`
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 12px;
  opacity: 0.8;
`;

// Remove legacy typewriter cursor

const Close = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.06);
  color: #111;
  cursor: pointer;
`;
