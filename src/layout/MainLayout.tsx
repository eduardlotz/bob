import { SceneWithLoader } from "@/molecules/SceneWithLoader";
import { BottomNavigation } from "@/molecules/BottomNavigation";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAppStore } from "@/store";
import { useGameStore } from "@/store/gameStore";

export default function MainLayout({ children }: any) {
  const [windowHeight, setWindowHeight] = useState(0);
  const [sceneLoaded, setSceneLoaded] = useState(false);

  const {
    permissionGranted,
    setIsMobile,
    setEmotionData,
    showOptions,
    setShowOptions,
  } = useAppStore();
  const { checkRouteUnlocks } = useGameStore();

  // Initialize mobile detection and window height
  useEffect(() => {
    const mobile =
      typeof window !== "undefined" &&
      /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    setWindowHeight(window.innerHeight);
  }, [setIsMobile]);

  // Check route unlocks on mount
  useEffect(() => {
    checkRouteUnlocks();
  }, [checkRouteUnlocks]);

  return (
    <Container>
      <Background style={{ height: windowHeight }}>
        <SceneWithLoader
          permissionGranted={permissionGranted}
          onEmotionUpdate={setEmotionData}
          onLoaded={() => setSceneLoaded(true)}
        />
      </Background>

      <BottomNavigation />

      {children}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const Background = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
`;
