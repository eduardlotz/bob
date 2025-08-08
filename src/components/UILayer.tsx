import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "@/layout/atoms";
import { BottomNavigation } from "@/molecules/BottomNavigation";
import { Statistics } from "@/molecules/Statistics";
import { SoundSettings } from "@/components/SoundSettings";
import { SoundToggle } from "@/components/SoundToggle";

import { requestMotionPermission } from "@/utils/permission";
import { useGameStore, startAutoTap, stopAutoTap } from "@/store/gameStore";

import { useAnimations } from "@/hooks/useAnimations";
import { useSwipeDismiss } from "@/hooks/useSwipeDismiss";

interface UILayerProps {
  permissionGranted: boolean;
  isMobile: boolean;
  sceneLoaded: boolean;
  setPermissionGranted: (granted: boolean) => void;
  emotionState: string;
}

export function UILayer({ setPermissionGranted }: UILayerProps) {
  const { statisticsVisible, isPaused } = useGameStore();
  const [permissionDismissed, setPermissionDismissed] = useState(false);
  const [soundSettingsVisible, setSoundSettingsVisible] = useState(false);
  const { motionStyles, dragConstraints, dragEndHandler, drag } =
    useSwipeDismiss({
      onClose: () => setPermissionDismissed(true),
      direction: "x",
    });

  // Initialize animations hook
  useAnimations();

  // Start auto-tap when component mounts
  useEffect(() => {
    startAutoTap();
    return () => stopAutoTap();
  }, []);

  // Pause/resume auto-tap based on game state
  useEffect(() => {
    if (isPaused) {
      stopAutoTap();
    } else {
      startAutoTap();
    }
  }, [isPaused]);

  // Cleanup manual taps periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const gameStore = useGameStore.getState();
      gameStore.cleanupManualTaps();
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const handlePermissionRequest = async () => {
    const granted = await requestMotionPermission();
    setPermissionGranted(granted);
  };

  return (
    <UILayerContainer>
      <BottomNavigation />
      <Statistics visible={statisticsVisible} />

      <ToggleContainer>
        <SoundToggle />
      </ToggleContainer>

      {/* Sound Settings Modal */}
      <SoundSettings
        visible={soundSettingsVisible}
        onClose={() => setSoundSettingsVisible(false)}
      />

      {/* <StorageDebugger />
      <MigrationDebugger /> */}

      {/* TODO: Add sensor button with dismiss */}
      {/* <AnimatePresence>
        {!permissionGranted &&
          isMobile &&
          sceneLoaded &&
          !permissionDismissed && (
            <SensorButton
              variants={MotionVariants.SpringScaleReversed}
              initial="initial"
              animate="animate"
              custom={0}
              exit="exit"
              whileTap="tap"
              onClick={handlePermissionRequest}
              style={motionStyles}
              drag={drag}
              dragConstraints={dragConstraints}
              onDragEnd={dragEndHandler}
            >
              use motion sensor
            </SensorButton>
          )}
      </AnimatePresence> */}
    </UILayerContainer>
  );
}

const UILayerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
`;

const ToggleContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  pointer-events: auto;
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
