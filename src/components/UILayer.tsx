import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Logo } from "@/layout/atoms";
import { BottomNavigation } from "@/molecules/BottomNavigation";
import { useSoundSystem } from "@/hooks/useSoundSystem";

import { useCoreStore } from "@/store/core/store";

import { AnimatePresence, motion } from "motion/react";
import { useAppStore } from "@/store";

interface UILayerProps {
  permissionGranted: boolean;
  isMobile: boolean;
  sceneLoaded: boolean;
  setPermissionGranted: (granted: boolean) => void;
  emotionState: string;
}

export function UILayer({ setPermissionGranted }: UILayerProps) {
  const sound = useSoundSystem();
  const { isMobile } = useAppStore();

  // cleanup manual taps every second
  // TODO: check if this is optimal -> without it the steps/s is not resetting
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const gameStore = useCoreStore.getState();
      gameStore.cleanupManualTaps();
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // TODO: fix or remove every device motion related
  // const handlePermissionRequest = async () => {
  //   const granted = await requestMotionPermission();
  //   setPermissionGranted(granted);
  // };

  return (
    <UILayerContainer>
      <AnimatePresence>
        <MotionRoot id="motion-root"></MotionRoot>
      </AnimatePresence>
      <BottomNavigation />
    </UILayerContainer>
  );
}

const MotionRoot = styled.div``;

const TopLogoContainer = styled(motion.div)`
  position: fixed;
  top: 20px;
  margin: 0 auto;
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
  z-index: 9999;
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
