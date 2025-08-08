import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useSoundSystem } from "@/hooks/useSoundSystem";

function SpeakerIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9h4l5-4v14l-5-4H3V9z" fill="currentColor" />
      {!muted ? (
        <>
          <path
            d="M16 8a5 5 0 010 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18.5 5.5a8.5 8.5 0 010 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <path
          d="M19 5L5 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export const SoundToggle = () => {
  const { toggle, isMuted, isEnabled } = useSoundSystem();

  const handleClick = async () => {
    toggle();
  };

  return (
    <Button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={!isEnabled ? "Audio stopped" : isMuted ? "Unmute" : "Mute"}
      $isActive={!isMuted}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={!isMuted ? "on" : "off"}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, type: "spring", bounce: 0.5 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SpeakerIcon muted={isMuted} />
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};

const Button = styled(motion.button)<{ $isActive?: boolean }>`
  height: 58px;
  padding: 20px;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  opacity: ${(props) => (props.$isActive ? 1 : 0.6)};

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    opacity: 1;
  }
`;
