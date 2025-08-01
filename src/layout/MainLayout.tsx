import { SceneWithLoader } from "@/molecules/SceneWithLoader";
import { requestMotionPermission } from "@/utils/permission";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "./atoms";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import { AnimatePresence } from "motion/react";
import { BackgroundGradient } from "@/molecules/BackgroundGradient";
import { EmotionBar } from "@/molecules/EmotionBar";
import { useRoute } from "@/contexts/RouteContext";

export default function MainLayout({ children }: any) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const [emotionData, setEmotionData] = useState<{
    emotionState: any;
    tapCount: number;
    getEmotionIcon: any;
  } | null>(null);
  const { currentRoute } = useRoute();

  // Debug state (lifted from HeadNavigation)
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [debugCircles, setDebugCircles] = useState<any[]>([]);
  const [debugOptions, setDebugOptions] = useState({
    attractionCircles: true,
    stayMagneticCircles: true,
    arcPathCircle: true,
    cursorDistance: true,
    fieldRadius: true,
  });
  const [magneticEnabled, setMagneticEnabled] = useState(true);
  const [debugCirclesEnabled, setDebugCirclesEnabled] = useState(false);

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
      <BackgroundGradient />
      <Background style={{ height: windowHeight }}>
        <AnimatePresence>
          {!permissionGranted && isMobile && (
            <SensorButton
              variants={MOTION_VARIANTS.springScaleReversed}
              initial="initial"
              animate="animate"
              custom={60}
              exit="exit"
              whileTap="tap"
              onClick={handlePermissionRequest}
            >
              Sensoren aktivieren
            </SensorButton>
          )}
        </AnimatePresence>
        <SceneWithLoader
          permissionGranted={permissionGranted}
          onEmotionUpdate={setEmotionData}
        />

        {/* EmotionBar as fixed overlay - like sensor button */}
        {emotionData && (
          <EmotionBar
            emotionState={emotionData.emotionState}
            tapCount={emotionData.tapCount}
            getEmotionIcon={emotionData.getEmotionIcon}
            routeColor={currentRoute.blobCostume?.headColor || "#4facfe"}
          />
        )}
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

const SensorButton = styled(Button)`
  position: absolute;
  z-index: 100;
  left: 0;
  right: 0;
  bottom: 40px;
  width: fit-content;
  margin: auto;
  max-width: calc(100% - 20px);
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
  }
`;
