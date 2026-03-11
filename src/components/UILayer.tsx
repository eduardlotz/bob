import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { Button, Logo } from "@/layout/atoms";
import { BottomNavigation } from "@/molecules/BottomNavigation";
import { useSoundSystem } from "@/hooks/useSoundSystem";

import { useCoreStore } from "@/store/core/store";

import { AnimatePresence, motion } from "motion/react";
import { useAppStore } from "@/store";
import { BookPortalOverlay } from "@/3d-objects/books/overlay";

interface UILayerProps {
  permissionGranted: boolean;
  isMobile: boolean;
  sceneLoaded: boolean;
  setPermissionGranted: (granted: boolean) => void;
  emotionState: string;
}

export function UILayer({ setPermissionGranted }: UILayerProps) {
  return (
    <UILayerContainer>
      <AnimatePresence>
        <MotionRoot id="motion-root"></MotionRoot>
        <BookPortalOverlay />
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
