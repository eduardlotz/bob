import { FillColumn } from "@/layout";
import { Logo, MotionIconWrapper } from "@/layout/atoms";
import { MotionVariants } from "@/styles/motion";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, Suspense } from "react";
import { useProgress } from "@react-three/drei";
import Scene from "@/molecules/Scene";
import { UILayer } from "@/components/UILayer";
import { useAppStore } from "@/store";
import { useAnimations } from "@/hooks/useAnimations";
import { initializeSoundSystemAsync } from "@/utils/soundSystem";

// Custom loader component that tracks its own progress
export const CustomLoader = () => {
  const { progress } = useProgress();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Loader progress:", progress);
    // Only start the exit animation when progress is 100%
    if (progress >= 100) {
      console.log("Progress reached 100%, starting exit animation");
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Small delay to ensure everything is ready

      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <AnimatePresence>
      {isLoading && (
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
      )}
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
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const { isMobile, emotionData, setPermissionGranted } = useAppStore();

  // Initialize animations hook
  useAnimations();

  // Set scene as loaded when component mounts (after Suspense resolves)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Initialize sound system before scene is ready for interaction
      console.log(
        "SceneWithLoader: Initializing sound system before scene load..."
      );
      try {
        await initializeSoundSystemAsync();
        console.log("SceneWithLoader: Sound system ready, loading scene...");
      } catch (error) {
        console.error(
          "SceneWithLoader: Failed to initialize sound system:",
          error
        );
      }

      setSceneLoaded(true);
      onLoaded?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        {!sceneLoaded && <CustomLoader />}
        <Scene
          permissionGranted={permissionGranted}
          onEmotionUpdate={onEmotionUpdate}
          {...rest}
        />
      </Suspense>

      {sceneLoaded && (
        <UILayer
          permissionGranted={permissionGranted}
          isMobile={isMobile}
          sceneLoaded={sceneLoaded}
          setPermissionGranted={setPermissionGranted}
          emotionState={emotionData?.emotionState || "normal"}
        />
      )}
    </>
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
