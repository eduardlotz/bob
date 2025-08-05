import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "@/layout/atoms";
import { BottomNavigation } from "@/molecules/BottomNavigation";
import { Statistics } from "@/molecules/Statistics";

import { requestMotionPermission } from "@/utils/permission";
import { useGameStore, startAutoTap, stopAutoTap } from "@/store/gameStore";

import { resetCalibration } from "@/utils/math";
import { toast } from "sonner";

import { useAnimations } from "@/hooks/useAnimations";
import { useSwipeDismiss } from "@/hooks/useSwipeDismiss";

interface UILayerProps {
  permissionGranted: boolean;
  isMobile: boolean;
  sceneLoaded: boolean;
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  setPermissionGranted: (granted: boolean) => void;
  emotionState: string;
}

export function UILayer({
  permissionGranted,
  isMobile,
  sceneLoaded,
  showOptions,
  setShowOptions,
  setPermissionGranted,
  emotionState,
}: UILayerProps) {
  const { taps, statisticsVisible, isPaused } = useGameStore();
  const [permissionDismissed, setPermissionDismissed] = useState(false);
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

  const handleCalibrationReset = () => {
    resetCalibration();
    toast.custom((id) => (
      <div
        style={{
          backgroundColor: "white",
          color: "black",
          padding: "20px 30px",
          height: "58px",
          width: "320px",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "24px",
          boxShadow: "0 4px 10px 10px rgba(37, 36, 39, 0.08)",
          textAlign: "center",
          fontSize: "14px",
          fontStyle: "normal",
          fontWeight: "600",
          lineHeight: "normal",
          letterSpacing: "1.4px",
          textTransform: "uppercase",
        }}
      >
        Kalibrierung zurückgesetzt
      </div>
    ));
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <UILayerContainer>
      <BottomNavigation onMenuClick={() => setShowOptions(!showOptions)} />
      <Statistics visible={statisticsVisible} />

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

      {/* <AnimatePresence>
        {permissionGranted && isMobile && sceneLoaded && (
          <CalibrationButton
            variants={MotionVariants.SpringScaleReversed}
            initial="initial"
            animate="animate"
            custom={0}
            exit="exit"
            whileTap="tap"
            onClick={handleCalibrationReset}
          >
            Kalibrieren
          </CalibrationButton>
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
