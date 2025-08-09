import { Html } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { a, useSpring } from "@react-spring/three";
import { useMessageStore } from "@/store/messageStore";
import { useGameStore } from "@/store/gameStore";
import { playTapSound } from "@/utils/soundSystem";
import { DEFAULT_TEXT_SOUND } from "@/utils/sound/defaults";

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

  // Prepare text sequence
  const lines: string[] = useMemo(() => {
    const base = cfg?.text;
    if (Array.isArray(base)) return base;
    if (typeof base === "string") return [base];
    return [];
  }, [cfg]);

  // Typing effect per line
  useEffect(() => {
    if (!activeMessage) return;
    const line = lines[lineIndex] ?? "";

    let cancelled = false;
    setIsFullyTyped(false);
    setDisplayText("");

    const msPerChar = options?.typingSpeedMs ?? DEFAULT_MS_PER_CHAR;
    let i = 0;

    const tick = () => {
      if (cancelled) return;
      if (skipRequested) {
        setDisplayText(line);
        setIsFullyTyped(true);
        return;
      }
      if (i < line.length) {
        setDisplayText((prev) => prev + line[i]);
        // per-char sound
        if (
          cfg?.audioEnabled &&
          soundSystem.enabled &&
          soundSystem.masterVolume > 0
        ) {
          try {
            // let engine choose current tap sound; detune handled internally
            playTapSound();
          } catch {}
        }
        i += 1;
        setTimeout(tick, msPerChar);
      } else {
        setIsFullyTyped(true);
      }
    };

    const start = setTimeout(tick, 50);
    return () => {
      cancelled = true;
      clearTimeout(start);
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
              {displayText}
              <Cursor hidden={isFullyTyped}>▌</Cursor>
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
  word-wrap: break-word;
  overflow-wrap: anywhere;
  @media (max-width: 480px) {
    max-width: 86vw;
  }
`;

const Text = styled.div`
  font-size: 16px;
  line-height: 1.4;
  color: var(--text-color);
`;

const Cursor = styled.span<{ hidden?: boolean }>`
  opacity: ${(p) => (p.hidden ? 0 : 1)};
  animation: blink 1s step-start 0s infinite;
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
`;

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
