import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useGameStore } from "@/store/gameStore";
import { Magnetic } from "@/layout/Magnetic";

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
  // Persist preference-only settings: enabled/muted
  const store = useGameStore();

  const handleClick = async () => {
    toggle();
    store.setSoundEnabled(isEnabled);
  };

  return (
    <Magnetic>
      <Button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={!isEnabled ? "Audio stopped" : isMuted ? "Unmute" : "Mute"}
        initial={{
          opacity: 0,
          filter: "blur(24px)",
        }}
        animate={{
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: 0.8, ease: "easeInOut", delay: 0.1 },
        }}
        exit={{ opacity: 0, filter: "blur(24px)" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={!isMuted ? "on" : "off"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, type: "spring", bounce: 0.7 }}
          >
            <SpeakerIcon muted={isMuted} />
          </motion.div>
        </AnimatePresence>
      </Button>
    </Magnetic>
  );
};

const Button = styled(motion.button)`
  height: 58px;
  padding: 20px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.3);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  color: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  transition-duration: 0.2s;
  transition-property: background-color;

  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }
`;
