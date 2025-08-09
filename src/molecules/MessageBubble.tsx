import { Html } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { a, useSpring } from "@react-spring/three";
import { motion } from "motion/react";
import { useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";
import { playTapSound } from "@/utils/soundSystem";
import { textSynth } from "@/utils/sound/textSynth";

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
  const [lineIndex, setLineIndex] = useState(0);
  const [skipRequested, setSkipRequested] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [uiScale, setUiScale] = useState(1);

  const cfg = activeMessage?.config;
  const options = activeMessage?.options;

  // Entry/Exit scale + opacity
  const [spring, api] = useSpring(() => ({
    scale: 0,
    opacity: 0,
    config: { tension: 300, friction: 18 },
  }));

  useEffect(() => {
    if (activeMessage) {
      api.start({ scale: 1, opacity: 1 });
    } else {
      api.start({ scale: 0, opacity: 0 });
    }
  }, [!!activeMessage]);

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

  // Prepare text sequence
  const lines: string[] = useMemo(() => {
    const base = cfg?.text;
    if (Array.isArray(base)) return base;
    if (typeof base === "string") return [base];
    return [];
  }, [cfg]);

  // RAF-driven per-character reveal with bounce/rotate variants
  useEffect(() => {
    if (!activeMessage) return;
    const line = lines[lineIndex] ?? "";
    setIsFullyTyped(false);
    setDisplayText(line);
    setRevealed(0);
    let last = 0;
    let acc = 0;
    const per = options?.typingSpeedMs ?? DEFAULT_MS_PER_CHAR;

    const loop = (t: number) => {
      if (skipRequested) {
        setRevealed(line.length);
        setIsFullyTyped(true);
        return;
      }
      const dt = last ? t - last : 0;
      last = t;
      acc += dt;
      const toReveal = Math.min(line.length, Math.floor(acc / per));
      if (toReveal > revealed) {
        const delta = toReveal - revealed;
        setRevealed(toReveal);
        if (
          cfg?.audioEnabled &&
          soundSystem.enabled &&
          soundSystem.masterVolume > 0
        ) {
          for (let i = 0; i < delta; i++) {
            try {
              textSynth.playCharBlip();
            } catch {}
          }
        }
        if (toReveal === line.length) setIsFullyTyped(true);
      }
      if (revealed < line.length) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [activeMessage, lineIndex, skipRequested]);

  // Auto-dismiss timer once full text is rendered for last line
  useEffect(() => {
    if (!activeMessage) return;
    if (!isFullyTyped) return;

    const isLastLine = lineIndex >= lines.length - 1;
    if (!isLastLine) return;

    const contentLength = lines.reduce((sum, l) => sum + l.length, 0);
    const base =
      activeMessage.config.dismissTimeout ?? options?.baseDismissMs ?? 1000;
    const factor = options?.contentLengthFactorMs ?? 40;
    const timeout =
      activeMessage.config.dismissTimeout ?? base + factor * contentLength;

    const t = setTimeout(() => {
      handleDismiss();
    }, timeout);
    return () => clearTimeout(t);
  }, [activeMessage, isFullyTyped, lineIndex, lines]);

  if (!activeMessage || !cfg) return null;

  const onClickBubble = () => {
    if (!isFullyTyped) {
      setSkipRequested(true);
      return;
    }
    // Next line or dismiss
    const nextIdx = lineIndex + 1;
    if (nextIdx < lines.length) {
      setLineIndex(nextIdx);
      setSkipRequested(false);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    api.start({ scale: 0, opacity: 0 });
    // Allow exit spring to play briefly before swapping messages
    setTimeout(() => {
      dismissMessage();
      setLineIndex(0);
      setSkipRequested(false);
      setDisplayText("");
      setIsFullyTyped(false);
      setUiScale(1);
    }, 180);
  };

  const offset = cfg.positionOffset ?? [0, 0, 0];
  const position: [number, number, number] = [
    anchor[0] + offset[0],
    anchor[1] + offset[1],
    anchor[2] + offset[2],
  ];

  return (
    <a.group scale={spring.scale as any} position={position}>
      <Html
        // transform
        center
        style={{
          maxWidth: "calc(100vw - 32px)",
          width: "600px",
          pointerEvents: "auto",
        }}
      >
        <Container
          ref={containerRef}
          style={{ opacity: spring.opacity as any }}
          onClick={onClickBubble}
        >
          {cfg.label && <Label>{cfg.label}</Label>}
          <Bubble
            style={{
              transform: `scale(${uiScale})`,
              transformOrigin: "center",
            }}
          >
            <Text>
              {(() => {
                const content = lines[lineIndex] ?? "";
                const tokens = content.split(/(\s+)/);
                let idx = 0;
                const out: any[] = [];
                tokens.forEach((tok, t) => {
                  if (!tok) return;
                  if (/^\s+$/.test(tok)) {
                    // whitespace token: render spaces and newlines; advance index per char
                    for (let j = 0; j < tok.length; j++) {
                      const ch = tok[j];
                      if (ch === "\n") {
                        out.push(<br key={`br-${lineIndex}-${idx}`} />);
                      } else if (ch === " ") {
                        out.push(
                          <Space key={`sp-${lineIndex}-${idx}`}> </Space>
                        );
                      } else {
                        out.push(
                          <Space key={`spx-${lineIndex}-${idx}`}>{ch}</Space>
                        );
                      }
                      idx += 1;
                    }
                  } else {
                    // word token: keep as one unit; animate internal chars; no breaking inside
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
                                thisIndex < revealed ? "visible" : "hidden"
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
              })()}
            </Text>
          </Bubble>
        </Container>
      </Html>
    </a.group>
  );
});

const Container = styled.div`
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  user-select: none;
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

const Text = styled.div`
  font-size: 16px;
  line-height: 1.4;
  color: var(--text-color);
`;

const Space = styled.span`
  display: inline-block;
  width: 0.33rem;
`;

const Word = styled.span`
  display: inline-flex;
  flex-wrap: nowrap;
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
    scale: [1.2, 1],
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
