import { SceneWithLoader } from "@/molecules/SceneWithLoader";
import { requestMotionPermission } from "@/utils/permission";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "./atoms";
import { MotionVariants } from "@/styles/motion";
import { AnimatePresence } from "motion/react";
import { useAppStore } from "@/store";

export default function MainLayout({ children }: any) {
  const [windowHeight, setWindowHeight] = useState(0);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const {
    currentRoute,
    permissionGranted,
    isMobile,
    emotionData,
    setPermissionGranted,
    setIsMobile,
    setEmotionData,
  } = useAppStore();

  // Initialize mobile detection and window height
  useEffect(() => {
    const mobile =
      typeof window !== "undefined" &&
      /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    setWindowHeight(window.innerHeight);
  }, [setIsMobile]);

  // TODO: show permission modal with explanation before asking for permission
  const handlePermissionRequest = async () => {
    const granted = await requestMotionPermission();
    setPermissionGranted(granted);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <Container>
      <Background style={{ height: windowHeight }}>
        <AnimatePresence>
          {!permissionGranted && isMobile && sceneLoaded && (
            <SensorButton
              variants={MotionVariants.SpringScaleReversed}
              initial="initial"
              animate="animate"
              custom={0}
              exit="exit"
              whileTap="tap"
              onClick={handlePermissionRequest}
            >
              Sensoren aktivieren
            </SensorButton>
          )}
        </AnimatePresence>

        {/* Menu Button - Always visible */}
        <MenuButton
          variants={MotionVariants.SpringScaleReversed}
          initial="initial"
          animate="animate"
          custom={0}
          whileTap="tap"
          onClick={toggleOptions}
          layout="size"
        >
          {showOptions ? "Schließen" : "Menü"}
        </MenuButton>

        <SceneWithLoader
          permissionGranted={permissionGranted}
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          onEmotionUpdate={setEmotionData}
          onLoaded={() => setSceneLoaded(true)}
        />
      </Background>
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

const MenuButton = styled(Button)`
  position: absolute;
  z-index: 100;
  top: 16px;
  right: 16px;
  width: fit-content;
  font-weight: 700;
  font-size: 1rem;
  background: rgba(100, 100, 100, 0.6);
  backdrop-filter: blur(5px);
  color: #ffffff;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.3) inset,
    0 -1px 6px 0 rgba(0, 0, 0, 0.1) inset;

  &:active,
  &:hover {
    color: white;
    background: rgba(100, 100, 100, 0.8);
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.3) inset,
      0 -1px 6px 0 rgba(0, 0, 0, 0.1) inset, 0 1px 4px 0 rgba(0, 0, 0, 0.1);
  }
`;

const SensorButton = styled(MenuButton)`
  position: absolute;
  z-index: 100;
  left: 0;
  right: 0;
  bottom: 20px;
  top: unset;
  margin: auto;
  width: calc(100% - 32px);

  /* min-width: fit-content;
  border: solid 2px #dbdbed;
  font-weight: 700;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  color: white;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);

  &:active,
  &:hover {
    border: solid 2px #dbdbed;
    color: white;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.1);
  } */
`;
