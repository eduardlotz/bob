import { FillColumn } from "@/layout";
import { Logo, MotionIconWrapper } from "@/layout/atoms";
import { MotionVariants } from "@/styles/motion";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useProgress } from "@react-three/drei";
import Scene, { FirstFrame } from "@/molecules/Scene";
import { UILayer } from "@/components/UILayer";
import { useAppStore } from "@/store";
import { useAnimations } from "@/hooks/useAnimations";
import { initializeSoundSystemAsync } from "@/utils/soundSystem";
import { Canvas } from "@react-three/fiber";

export const CustomLoader = () => {
  const { progress } = useProgress();

  return (
    <AnimatePresence>
      <LoadingWrapper
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{
          opacity: 0,
          transition: {
            duration: 0.8,
            ease: "easeInOut",
          },
        }}
      >
        <FillColumn $align="center" $justify="center">
          <MotionIconWrapper
            variants={MotionVariants.Pulse}
            animate="animate"
            exit={{
              scale: [1, 1.3, 0.8, 1.1, 0],
              transition: {
                duration: 0.8,
                times: [0, 0.3, 0.5, 0.7, 1],
                ease: "easeInOut",
              },
            }}
            initial="initial"
          >
            <Logo />
          </MotionIconWrapper>

          <ProgressContainer>
            <ProgressBar>
              <ProgressFill style={{ width: `${progress}%` }} />
            </ProgressBar>
            <ProgressText>{Math.round(progress)}%</ProgressText>
          </ProgressContainer>
        </FillColumn>
      </LoadingWrapper>
    </AnimatePresence>
  );
};

// Main SceneWithLoader component
export const SceneWithLoader = ({
  permissionGranted,
  onEmotionUpdate,
  onLoaded,
  ...rest
}: {
  permissionGranted: boolean;
  onEmotionUpdate?: (data: {
    emotionState: any;
    tapCount: number;
    getEmotionIcon: any;
  }) => void;
  onLoaded?: () => void;
}) => {
  const [firstFrameDone, setFirstFrameDone] = useState(false);
  const [entered, setEntered] = useState(false);
  const { isMobile, emotionData, setPermissionGranted } = useAppStore();

  useEffect(() => {
    initializeSoundSystemAsync().catch((error) => {
      console.error("failed to initialize sound system:", error);
    });
  }, []);

  return (
    <>
      {!firstFrameDone && <CustomLoader />}

      <FullScreenCanvas>
        <Suspense fallback={null}>
          <Scene
            permissionGranted={permissionGranted}
            onEmotionUpdate={onEmotionUpdate}
            {...rest}
          />
          <FirstFrame onReady={() => setFirstFrameDone(true)} />
        </Suspense>
      </FullScreenCanvas>

      {firstFrameDone && (
        <UILayer
          permissionGranted={permissionGranted}
          isMobile={isMobile}
          sceneLoaded={entered}
          setPermissionGranted={setPermissionGranted}
          emotionState={emotionData?.emotionState || "normal"}
        />
      )}
    </>
  );
};

type FullScreenCanvasProps = {
  children: any;
};

const FullScreenCanvas = ({ children, ...props }: FullScreenCanvasProps) => {
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it once to set the initial state

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      shadows
      flat
      color="black"
      camera={{ position: [0, 0, isMobile ? 1.5 : 2], fov: 50 }}
      style={{
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
      {...props}
    >
      {children}
    </Canvas>
  );
};

const LoadingWrapper = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  width: 100dvw;
  height: 100dvh;
  padding: 40px 16px 0 16px;
  background-color: #000000;

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: #ffffff !important;
  }
`;

const ProgressContainer = styled.div`
  margin-top: 40px;
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #333333;
  border-radius: 2px;
  overflow: hidden;
`;

const StartButton = styled.button`
  all: unset;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 12px 24px;
  background-color: #ffffff;
  border-radius: 100px;

  font-size: 16px;
  font-weight: 600;
  color: #000000;

  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #ffffff;
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
`;
