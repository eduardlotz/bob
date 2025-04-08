import { SceneWithLoader } from "@/molecules/SceneWithLoader";
import { requestMotionPermission } from "@/utils/permission";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "./atoms";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import { AnimatePresence } from "motion/react";

export default function MainLayout({ children }: any) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setIsMobile(
      typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)
    );
    setWindowHeight(window.innerHeight);
  }, []);

  // TODO: show permission modal with explanation before asking for permission
  const handlePermissionRequest = async () => {
    const granted = await requestMotionPermission();
    setPermissionGranted(granted);
  };

  return (
    <Container>
      <Background style={{ height: windowHeight }}>
        <AnimatePresence>
          {!permissionGranted && isMobile && (
            <Button
              style={{
                position: "absolute",
                zIndex: 100,
                left: 0,
                right: 0,
                top: "40px",
                width: "fit-content",
                margin: "auto",
                maxWidth: "calc(100% - 20px)",
                border: "dashed 3px black",
                fontWeight: 700,
                fontSize: "1rem",
                background: "transparent",
                color: "black",
              }}
              variants={MOTION_VARIANTS.springScaleReversed}
              initial="initial"
              animate="animate"
              custom={60}
              exit="exit"
              whileTap="tap"
              onClick={handlePermissionRequest}
            >
              Sensoren aktivieren
            </Button>
          )}
        </AnimatePresence>
        <SceneWithLoader permissionGranted={permissionGranted} />
      </Background>
      <Overlay>{children}</Overlay>
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

const Overlay = styled.div`
  position: relative;
  z-index: 10;
`;
