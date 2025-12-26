import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Logo } from "@/layout/atoms";
import { BottomNavigation } from "@/molecules/BottomNavigation";
import { useSoundSystem } from "@/hooks/useSoundSystem";

import { requestMotionPermission } from "@/utils/permission";
import { useGameStore } from "@/store/gameStore";

import { motion } from "motion/react";

interface UILayerProps {
  permissionGranted: boolean;
  isMobile: boolean;
  sceneLoaded: boolean;
  setPermissionGranted: (granted: boolean) => void;
  emotionState: string;
}

export function UILayer({ setPermissionGranted }: UILayerProps) {
  const [soundHintDismissed, setSoundHintDismissed] = useState(false);
  const sound = useSoundSystem();

  // cleanup manual taps every second
  // TODO: check if this is optimal -> without it the steps/s is not resetting
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const gameStore = useGameStore.getState();
      gameStore.cleanupManualTaps();
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // TODO: exten audio system to support different UI sounds
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      const clickable = target.closest(
        'button, [role="button"], input[type="button"], input[type="submit"], .click-sound, input[type="radio"], input[type="checkbox"], [data-ui-sound-id]'
      );
      if (clickable) {
        // check for unique sound first
        const attrId = clickable.getAttribute("data-ui-sound-id");
        // defer slightly to avoid interfering with UI thread
        setTimeout(() => {
          if (attrId) {
            // play the specific UI sound by ID
            sound.playUISound(attrId);
          } else {
            // play default UI sound
            sound.playUISound();
          }
        }, 0);
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [sound]);

  // TODO: fix or remove every device motion related
  const handlePermissionRequest = async () => {
    const granted = await requestMotionPermission();
    setPermissionGranted(granted);
  };

  return (
    <UILayerContainer>
      <BottomNavigation />
    </UILayerContainer>
  );
}

const TopLogoContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  height: 56px;

  svg {
    height: 44px;
  }
`;

const UILayerContainer = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ToggleRow = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SoundHint = styled(motion.span)`
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 50px;
  font-size: 16px;
  z-index: 100;
`;

const CalibrationButton = styled(Button)`
  position: fixed;
  bottom: 120px;
  right: 20px;
  pointer-events: auto;
  background-color: #2979ff;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background-color: #4285f4;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;
