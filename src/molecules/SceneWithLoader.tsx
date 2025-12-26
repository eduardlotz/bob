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
import { initializeSoundSystem } from "@/utils/soundSystem";

export const CustomLoader = ({
  onFadeOutComplete,
}: {
  onFadeOutComplete: () => void;
}) => {
  const { active, progress } = useProgress();
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // prevents progress bar from jumping backwards
    setPercentage((prev) => Math.max(prev, progress));

    if (!active && progress === 100 && isLoading) {
      // small delay to make sure its 100% before removing loader
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [active, progress, isLoading]);

  return (
    <AnimatePresence onExitComplete={onFadeOutComplete}>
      {isLoading && (
        <LoadingWrapper
          key="loader"
          // initial={{ filter: "blur(16px)", scale: 1.15 }}
          // animate={{ filter: "blur(0)", scale: 1.25 }}
          // exit={{
          //   filter: "blur(16px)",
          //   scale: 1.15,
          // }}
          initial={{
            clipPath: "circle(150% at 50% 50%)",
            opacity: 1,
          }}
          exit={{
            clipPath: "circle(0% at 50% 50%)",
            transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] },
          }}
        >
          <FillColumn $align="center" $justify="center">
            <MotionIconWrapper
              variants={MotionVariants.Pulse}
              animate="animate"
              initial="initial"
              layoutId="page-logo"
              layout="position"
            >
              <Logo />
            </MotionIconWrapper>

            <ProgressContainer>
              <ProgressBar>
                <ProgressFill style={{ width: `${percentage}%` }} />
              </ProgressBar>
              <ProgressText>{Math.round(percentage)}%</ProgressText>
            </ProgressContainer>
          </FillColumn>
        </LoadingWrapper>
      )}
    </AnimatePresence>
  );
};

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
  const [sceneReady, setSceneReady] = useState(false);
  const [mountLoader, setMountLoader] = useState(true);
  const { isMobile, emotionData, setPermissionGranted } = useAppStore();

  const handleLoadingSequenceComplete = async () => {
    try {
      await initializeSoundSystem();
    } catch (error) {
      console.error("failed to initialize sound system:", error);
    }

    setMountLoader(false);
    setSceneReady(true);
    onLoaded?.();
  };

  return (
    <>
      {mountLoader && (
        <CustomLoader onFadeOutComplete={handleLoadingSequenceComplete} />
      )}

      <Suspense fallback={null}>
        <Scene
          permissionGranted={permissionGranted}
          onEmotionUpdate={onEmotionUpdate}
          {...rest}
        />
      </Suspense>

      {sceneReady && (
        <UILayer
          permissionGranted={permissionGranted}
          isMobile={isMobile}
          sceneLoaded={sceneReady}
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
