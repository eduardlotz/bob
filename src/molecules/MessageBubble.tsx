import { Html } from "@react-three/drei";
import { memo, useEffect, useMemo, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { a } from "@react-spring/three";
import { motion, AnimatePresence } from "motion/react";
import type { Variants } from "motion/react";
import { useMessageStore } from "@/store/messageStore";
import { useAppStore } from "@/store";
import { useGameStore } from "@/store/gameStore";
import { textSynth } from "@/utils/sound/textSynth";
import { resumeAudioContext, unlockAudioContext } from "@/utils/soundSystem";
import { DEFAULT_TEXT_VOLUME } from "@/utils/sound/defaults";

const AUDIO_CHAR_DURATION_MS = 85;
const AUDIO_LEAD_TIME_MS = 5;
const TYPING_SPEED_MS = 18;
const BASE_LINE_DELAY_MS = 800;
const CHAR_READING_MS = 25;
const MIN_DISMISS_MS = 3000;

export interface MessageBubbleProps {
  anchor?: [number, number, number];
}

const useTypewriterAudio = (text: string, isTyping: boolean) => {
  const { soundSystem } = useGameStore();
  const audioRef = useRef<{ index: number; timeout: number | null }>({
    index: 0,
    timeout: null,
  });

  useEffect(() => {
    if (!isTyping || !text) return;
    if (audioRef.current.index >= text.length) audioRef.current.index = 0;

    const playNext = async () => {
      try {
        await resumeAudioContext();
        await unlockAudioContext();
      } catch (e) {}

      if (audioRef.current.index < text.length) {
        const char = text[audioRef.current.index];
        if (
          char !== " " &&
          soundSystem.enabled &&
          soundSystem.masterVolume > 0
        ) {
          try {
            const duration = AUDIO_CHAR_DURATION_MS;
            const adjustedVolume = Math.max(
              0.1,
              Math.min(
                0.6,
                0.8 * (soundSystem.textVolume ?? DEFAULT_TEXT_VOLUME)
              )
            );
            textSynth.playCharBlip(duration, adjustedVolume);
          } catch (e) {}
        }
        audioRef.current.index++;
        audioRef.current.timeout = window.setTimeout(
          playNext,
          AUDIO_LEAD_TIME_MS
        );
      }
    };
    playNext();
    return () => {
      if (audioRef.current.timeout) clearTimeout(audioRef.current.timeout);
    };
  }, [text, isTyping, soundSystem.enabled, soundSystem.masterVolume]);
};

const TypingIndicator = () => {
  return (
    <IndicatorBubble
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
    >
      <Dot $delay={0} />
      <Dot $delay={0.15} />
      <Dot $delay={0.3} />
    </IndicatorBubble>
  );
};

const TypewriterWord = ({
  word,
  globalIndexOffset,
}: {
  word: string;
  globalIndexOffset: number;
}) => {
  const chars = useMemo(() => Array.from(word), [word]);

  return (
    <WordWrapper>
      {chars.map((char, i) => (
        <Char
          key={i}
          custom={globalIndexOffset + i}
          variants={charVariants}
          initial="hidden"
          animate="visible"
        >
          {char}
        </Char>
      ))}
      <Space>&nbsp;</Space>
    </WordWrapper>
  );
};

const TypewriterText = ({ text }: { text: string }) => {
  useTypewriterAudio(text, true);
  const words = useMemo(() => text.split(" "), [text]);
  let charCount = 0;

  return (
    <TextContainer>
      {words.map((word, i) => {
        const currentOffset = charCount;
        charCount += Array.from(word).length + 1;
        return (
          <TypewriterWord
            key={`${word}-${i}`}
            word={word}
            globalIndexOffset={currentOffset}
          />
        );
      })}
    </TextContainer>
  );
};

export const MessageBubble = memo(function MessageBubble({
  anchor = [0, 1.5, 0],
}: MessageBubbleProps) {
  const {
    activeMessage,
    dismissMessage,
    markFullyRevealed,
    markUserInteraction,
    getQueueLength,
    showMessage,
    dismissMessageById,
    pauseSystem,
    resumeSystem,
  } = useMessageStore();
  const { requestEmotion } = useAppStore();
  const { previewMode } = useGameStore();

  const [visibleLines, setVisibleLines] = useState<
    Array<{ id: string; text: string; time: Date }>
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const dismissTimerRef = useRef<number | null>(null);

  const queueLength = getQueueLength();

  useEffect(() => {
    if (previewMode === "theme") {
      showMessage("chat_theme_preview");
    } else {
      dismissMessageById("chat_theme_preview");
    }
  }, [previewMode]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activeMessage) {
      const t = setTimeout(() => setVisibleLines([]), 300);
      return () => clearTimeout(t);
    }

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    if (activeMessage.options?.emotion?.state) {
      requestEmotion(activeMessage.options.emotion.state);
    }

    const rawText = activeMessage.config.text;
    const lines = Array.isArray(rawText)
      ? rawText
      : String(rawText).split(/\r?\n/);

    setVisibleLines([]);
    processLinesRecursive(lines, 0, activeMessage.config.id);
  }, [activeMessage?.config.id]);

  const processLinesRecursive = useCallback(
    (allLines: string[], index: number, messageId: string) => {
      if (useMessageStore.getState().activeMessage?.config.id !== messageId)
        return;

      if (index >= allLines.length) {
        setIsTyping(false);
        markFullyRevealed();

        const totalChars = allLines.join("").length;
        const readingTime = Math.max(
          MIN_DISMISS_MS,
          totalChars * CHAR_READING_MS + 1500
        );

        // TODO: don't dismiss if user is hovering
        // don't dismiss if theme preview
        if (messageId === "chat_theme_preview") {
          dismissTimerRef.current = window.setTimeout(() => {}, 0);
        } else {
          dismissTimerRef.current = window.setTimeout(() => {
            dismissMessage();
          }, readingTime);
        }
        return;
      }

      setIsTyping(true);
      const currentLineText = allLines[index];

      setVisibleLines((prev) => {
        return [
          ...prev,
          {
            id: `${messageId}-${index}`,
            text: currentLineText,
            time: new Date(),
          },
        ].slice(-3);
      });

      const typingDuration = currentLineText.length * TYPING_SPEED_MS;
      const nextStepDelay = typingDuration + BASE_LINE_DELAY_MS;

      setTimeout(() => {
        processLinesRecursive(allLines, index + 1, messageId);
      }, nextStepDelay);
    },
    [markFullyRevealed]
  );

  // TODO: dismiss message on click
  const handleClick = () => {
    markUserInteraction();
  };

  const offset = activeMessage?.config.positionOffset ?? [0, 0, 0];
  const finalPos: [number, number, number] = [
    anchor[0] + offset[0],
    anchor[1] + offset[1],
    anchor[2] + offset[2],
  ];

  return (
    <a.group position={finalPos}>
      <Html
        style={{
          width: "29.5rem",
          maxWidth: "92vw",
          pointerEvents: "none",
          transform: "translate3d(-50%, 0, 0)",
        }}
        zIndexRange={[100, 0]}
      >
        <AnimatePresence mode="popLayout">
          {activeMessage && (
            <Container
              initial={{ y: 10, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -10, scale: 0.9, opacity: 0 }}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.4,
              }}
            >
              {activeMessage?.config.label && (
                <Label
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {activeMessage.config.label}
                </Label>
              )}

              <BubbleContainer onClick={handleClick}>
                <AnimatePresence mode="popLayout">
                  {visibleLines.map((line) => (
                    <BubbleLine
                      key={line.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, x: -15 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    >
                      <TypewriterText text={line.text} />
                      <TimeTag>
                        {line.time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TimeTag>
                    </BubbleLine>
                  ))}

                  {queueLength > 0 && !isTyping && (
                    <TypingIndicator key="typing-indicator" />
                  )}
                </AnimatePresence>
              </BubbleContainer>
            </Container>
          )}
        </AnimatePresence>
      </Html>
    </a.group>
  );
});

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  pointer-events: auto;
  gap: 4px;
`;

const Label = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 50px;

  box-shadow: inset 0px 1px 4px 0 rgba(0, 0, 0, 0.1);

  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BubbleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  align-items: flex-start;
  padding: 4px;
  border-radius: 28px;
  background: rgba(33, 33, 33, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
`;

const BubbleLine = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  padding: 15px 20px;

  background: var(--secondary-color);
  color: var(--text-color);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(33, 33, 33, 0.1);

  width: fit-content;
  min-width: 90px;
  max-width: 100%;
`;

const IndicatorBubble = styled(motion.div)`
  background: rgba(33, 33, 33, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 12px 16px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 4px;
  align-items: center;
  height: 40px;
  margin-left: 2px;
`;

const Dot = styled(motion.div)<{ $delay: number }>`
  width: 6px;
  height: 6px;
  background: var(--text-color);
  border-radius: 50%;
  opacity: 0.75;
  animation: bounce 1.4s infinite ease-in-out both;
  animation-delay: ${(props) => props.$delay}s;

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`;

const TextContainer = styled.div`
  display: block;
  line-height: 1.4;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: -2%;
  color: var(--text-color);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: pre-wrap;
`;

const WordWrapper = styled.span`
  display: inline-block;
  white-space: nowrap;
`;

const Space = styled.span`
  display: inline;
  font-size: 1em;
`;

const Char = styled(motion.span)`
  display: inline-block;
  backface-visibility: hidden;
  will-change: opacity, transform;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const TimeTag = styled.div`
  font-size: 0.75rem;
  opacity: 0.75;
  font-weight: 400;
  color: var(--text-color);
  /* letter-spacing: -2%; */
`;

const labelVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const charVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.8,
    rotateX: -15,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      delay: i * (TYPING_SPEED_MS / 1000),
      type: "spring",
      damping: 20,
      stiffness: 450,
      mass: 0.5,
    },
  }),
};
